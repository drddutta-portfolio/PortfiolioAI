interface Env {
  HISTORY_BUCKET: R2Bucket
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  ALLOWED_ORIGINS: string
}

const ROOT_PREFIX = "portfolioai-history/development/p8/"
const BACKUP_MANIFEST_KEY = ROOT_PREFIX + "rescue-backup-v1/COMPLETE.json"
const CATALOG_KEY = ROOT_PREFIX + "catalog/v1/catalog.json"
const VERSION = "PORTFOLIOAI_HISTORY_GATEWAY_V1"

function allowedOrigins(env: Env) {
  return new Set(
    env.ALLOWED_ORIGINS.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  )
}

function corsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("Origin")
  const allowed = allowedOrigins(env)
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type,Range",
    "Access-Control-Expose-Headers": "Content-Range,ETag,Content-Length",
    "Vary": "Origin",
  })

  if (origin && allowed.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin)
  }

  return headers
}

function jsonResponse(
  request: Request,
  env: Env,
  body: unknown,
  init: ResponseInit = {},
) {
  const headers = new Headers(init.headers)
  const cors = corsHeaders(request, env)
  cors.forEach((value, key) => headers.set(key, value))
  headers.set("Content-Type", "application/json; charset=utf-8")
  headers.set("Cache-Control", "no-store")
  return new Response(JSON.stringify(body), { ...init, headers })
}

async function requireUser(request: Request, env: Env) {
  const authorization = request.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) return null

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
    },
  })

  if (!response.ok) return null
  const user = await response.json<{ id?: string }>()
  return user.id ? user : null
}

function safeObjectKey(url: URL) {
  const key = url.searchParams.get("key")?.trim()
  if (!key || !key.startsWith(ROOT_PREFIX)) return null
  if (key.includes("..") || key.includes("\\") || key.length > 1024) return null
  return key
}

async function serveObject(
  request: Request,
  env: Env,
  key: string,
) {
  const rangeHeader = request.headers.get("Range")
  let object: R2ObjectBody | null

  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader)
    if (!match) {
      return jsonResponse(request, env, { error: "INVALID_RANGE" }, { status: 416 })
    }

    const offset = Number(match[1])
    const end = match[2] ? Number(match[2]) : undefined
    const length = end === undefined ? undefined : end - offset + 1

    object = await env.HISTORY_BUCKET.get(key, {
      range: length === undefined ? { offset } : { offset, length },
    })
  } else {
    object = await env.HISTORY_BUCKET.get(key)
  }

  if (!object) {
    return jsonResponse(request, env, { error: "OBJECT_NOT_FOUND" }, { status: 404 })
  }

  const headers = corsHeaders(request, env)
  object.writeHttpMetadata(headers)
  headers.set("ETag", object.httpEtag)
  headers.set("Cache-Control", "private, max-age=60")

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers })
  }

  if (rangeHeader && object.range) {
    const { offset, length } = object.range
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`)
    headers.set("Content-Length", String(length))
    return new Response(object.body, { status: 206, headers })
  }

  headers.set("Content-Length", String(object.size))
  return new Response(object.body, { status: 200, headers })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) })
    }

    const url = new URL(request.url)

    if (request.method === "GET" && url.pathname === "/v1/health") {
      const backup = await env.HISTORY_BUCKET.get(BACKUP_MANIFEST_KEY)
      const catalog = await env.HISTORY_BUCKET.head(CATALOG_KEY)
      let backupStatus: unknown = null

      if (backup) {
        try {
          const manifest = await backup.json<Record<string, unknown>>()
          backupStatus = {
            status: manifest.status ?? null,
            backup_version: manifest.backup_version ?? null,
            source_counts: manifest.source_counts ?? null,
          }
        } catch {
          backupStatus = { status: "INVALID_MANIFEST" }
        }
      }

      return jsonResponse(request, env, {
        ok: Boolean(backup),
        version: VERSION,
        environment: "DEVELOPMENT",
        r2: {
          bucket_bound: true,
          backup_manifest_present: Boolean(backup),
          catalog_present: Boolean(catalog),
        },
        backup: backupStatus,
      }, { status: backup ? 200 : 503 })
    }

    if (!["GET", "HEAD"].includes(request.method)) {
      return jsonResponse(request, env, { error: "METHOD_NOT_ALLOWED" }, { status: 405 })
    }

    const user = await requireUser(request, env)
    if (!user) {
      return jsonResponse(request, env, { error: "UNAUTHORIZED" }, { status: 401 })
    }

    if (url.pathname === "/v1/catalog") {
      const catalog = await env.HISTORY_BUCKET.get(CATALOG_KEY)
      if (!catalog) {
        return jsonResponse(
          request,
          env,
          { error: "CATALOG_NOT_READY", version: VERSION },
          { status: 503 },
        )
      }
      const headers = corsHeaders(request, env)
      headers.set("Content-Type", "application/json; charset=utf-8")
      headers.set("Cache-Control", "private, max-age=60")
      return new Response(request.method === "HEAD" ? null : catalog.body, {
        status: 200,
        headers,
      })
    }

    if (url.pathname === "/v1/object") {
      const key = safeObjectKey(url)
      if (!key) {
        return jsonResponse(request, env, { error: "INVALID_OBJECT_KEY" }, { status: 400 })
      }
      return serveObject(request, env, key)
    }

    return jsonResponse(request, env, { error: "NOT_FOUND" }, { status: 404 })
  },
}

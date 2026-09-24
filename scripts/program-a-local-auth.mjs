export function normalizeLocalCredential(value) {
  return typeof value === "string" ? value.trim() : ""
}

export function assertUserJwtShape(accessToken) {
  if (accessToken.split(".").length !== 3 || accessToken.split(".").some((part) => part.length === 0)) {
    throw new Error("AUTH_OR_CONFIG_ERROR")
  }
}

export async function verifyLocalUserSession({ localUrl, anonKey, accessToken, fetcher = fetch }) {
  assertUserJwtShape(accessToken)
  let response
  try {
    response = await fetcher(`${localUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    throw new Error("AUTH_OR_CONFIG_ERROR")
  }
  if (!response.ok) throw new Error("AUTH_OR_CONFIG_ERROR")
  const payload = await response.json().catch(() => null)
  if (!payload || typeof payload.id !== "string" || payload.id.length === 0) {
    throw new Error("AUTH_OR_CONFIG_ERROR")
  }
  return { userId: payload.id }
}

export const config={maxDuration:60}
export default {
  async fetch(request:Request){
    const url=new URL(request.url)
    return Response.json({
      ok:true,
      path:url.pathname,
      node:process.version,
      vercelEnv:process.env.VERCEL_ENV??null,
      gitRef:process.env.VERCEL_GIT_COMMIT_REF??null,
      region:process.env.VERCEL_REGION??null,
      rss:process.memoryUsage().rss,
      heapUsed:process.memoryUsage().heapUsed,
    })
  }
}

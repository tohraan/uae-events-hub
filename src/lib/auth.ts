/** Guard for write/admin endpoints. Fails closed when no key is configured in production. */
export function checkAdmin(req: Request): Response | null {
  const key = process.env.ADMIN_API_KEY
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      return Response.json({ success: false, error: 'ADMIN_API_KEY is not configured on the server' }, { status: 503 })
    }
    return null
  }
  const h = req.headers.get('authorization') ?? ''
  if (h !== `Bearer ${key}`) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  return null
}

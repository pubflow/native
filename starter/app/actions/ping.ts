/** Public — no `auth` flag. UI calls this as POST /api/actions/ping. */
export async function ping() {
  return { ok: true, at: new Date().toISOString() }
}

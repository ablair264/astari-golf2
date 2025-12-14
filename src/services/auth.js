const AUTH_BASE = '/.netlify/functions/auth'

export async function getCsrf() {
  const res = await fetch(`${AUTH_BASE}/csrf`)
  if (!res.ok) throw new Error('Failed to get CSRF token')
  return res.json()
}

export async function signInCredentials(email, password, callbackUrl = '/') {
  const csrf = await getCsrf()
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    callbackUrl,
    json: 'true',
    redirect: 'false',
    email,
    password,
  })
  const res = await fetch(`${AUTH_BASE}/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    credentials: 'include'
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Sign in failed')
  }
  return res.json()
}

export async function signOut() {
  const csrf = await getCsrf()
  const body = new URLSearchParams({ csrfToken: csrf.csrfToken, json: 'true' })
  await fetch(`${AUTH_BASE}/signout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    credentials: 'include'
  })
}

export async function getSession() {
  const res = await fetch(`${AUTH_BASE}/session`, { credentials: 'include' })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  if (data?.user) return data
  return null
}

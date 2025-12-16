// Temporary stub auth: accepts only kevin@astari-golf.co.uk / password123 and always returns a session for that user.
// This bypasses Auth.js to avoid upstream 502s during development.

const STATIC_USER = {
  id: 'kevin@astari-golf.co.uk',
  email: 'kevin@astari-golf.co.uk',
}

function buildResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  }
}

function parseBody(event) {
  if (!event.body) return {}
  if (event.isBase64Encoded) {
    return Object.fromEntries(new URLSearchParams(Buffer.from(event.body, 'base64').toString('utf-8')))
  }
  try {
    return Object.fromEntries(new URLSearchParams(event.body))
  } catch {
    return {}
  }
}

const handler = async (event) => {
  const url = new URL(event.rawUrl)
  const path = url.pathname.replace('/.netlify/functions/auth', '')

  // CSRF endpoint (stubbed token)
  if (path.startsWith('/csrf')) {
    return buildResponse(200, { csrfToken: 'static-csrf-token' })
  }

  // Session endpoint (always return the static user)
  if (path.startsWith('/session')) {
    return buildResponse(200, { user: STATIC_USER, expires: null })
  }

  // Credentials callback
  if (path.startsWith('/callback/credentials')) {
    const body = parseBody(event)
    const email = body.email
    const password = body.password
    if (email === STATIC_USER.email && password === 'password123') {
      // Mimic Auth.js credential response
      return buildResponse(200, {
        url: '/',
        status: 'ok',
        user: STATIC_USER,
      })
    }
    return buildResponse(401, { error: 'Invalid credentials' })
  }

  // Sign-out stub
  if (path.startsWith('/signout')) {
    return buildResponse(200, { url: '/', status: 'signed-out' })
  }

  // Fallback
  return buildResponse(404, { error: 'Not found' })
}

export { handler }

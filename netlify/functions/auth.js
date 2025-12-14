import Auth from '@auth/core'
import Credentials from '@auth/core/providers/credentials'

const handler = async (event) => {
  const url = new URL(event.rawUrl)
  // Normalize to /api/auth path for Auth.js internal routing
  url.pathname = url.pathname.replace('/.netlify/functions/auth', '/api/auth')

  const request = new Request(url.toString(), {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body && ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body,
  })

  const AUTH_SECRET = process.env.AUTH_SECRET
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

  const response = await Auth(request, {
    secret: AUTH_SECRET,
    trustHost: true,
    session: { strategy: 'jwt' },
    providers: [
      Credentials({
        name: 'Credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          const email = credentials?.email
          const password = credentials?.password
          if (!email || !password) return null
          if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            return { id: email, email }
          }
          return null
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) token.user = { email: user.email }
        return token
      },
      async session({ session, token }) {
        if (token?.user) session.user = token.user
        return session
      },
    },
  })

  const headers = Object.fromEntries(response.headers)
  // Netlify requires multiValueHeaders for set-cookie
  const multiValueHeaders = {}
  for (const [key, value] of response.headers) {
    if (key.toLowerCase() === 'set-cookie') {
      if (!multiValueHeaders['set-cookie']) multiValueHeaders['set-cookie'] = []
      multiValueHeaders['set-cookie'].push(value)
    }
  }

  return {
    statusCode: response.status,
    headers,
    multiValueHeaders,
    body: await response.text(),
  }
}

export { handler }

// LiveChat API - Handles chat sessions, messages, and admin takeover
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
}

// Auto-create tables if they don't exist
async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS livechat_settings (
      id SERIAL PRIMARY KEY,
      is_online BOOLEAN DEFAULT false,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Insert default settings if not exists
  await sql`
    INSERT INTO livechat_settings (id, is_online)
    VALUES (1, false)
    ON CONFLICT (id) DO NOTHING
  `

  await sql`
    CREATE TABLE IF NOT EXISTS livechat_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      visitor_id VARCHAR(100) NOT NULL,
      visitor_name VARCHAR(255),
      visitor_email VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      current_page TEXT,
      product_context JSONB,
      last_message_at TIMESTAMPTZ,
      unread_count INT DEFAULT 0,
      taken_over_by VARCHAR(255),
      admin_name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS livechat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID REFERENCES livechat_sessions(id) ON DELETE CASCADE,
      sender_type VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      admin_name VARCHAR(255),
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON livechat_sessions(visitor_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_sessions_status ON livechat_sessions(status)`
  await sql`CREATE INDEX IF NOT EXISTS idx_messages_session ON livechat_messages(session_id)`
}

// Verify admin token (simplified - in production use proper JWT)
function verifyAdmin(authHeader) {
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  // For now, just check if token exists (matches auth.js pattern)
  // In production, verify against your auth system
  if (token && token.length > 10) {
    return { name: 'Admin' } // Return admin info
  }
  return null
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  try {
    await ensureTables()

    const path = event.path.replace('/.netlify/functions/livechat', '').replace(/^\//, '')
    const segments = path.split('/').filter(Boolean)
    const method = event.httpMethod

    // GET /status - Check if admin is online
    if (method === 'GET' && segments[0] === 'status') {
      const result = await sql`SELECT is_online FROM livechat_settings WHERE id = 1`
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, isOnline: result[0]?.is_online || false })
      }
    }

    // POST /session - Create or get existing session
    if (method === 'POST' && segments[0] === 'session') {
      const data = JSON.parse(event.body || '{}')
      const { visitorId, currentPage, productContext } = data

      if (!visitorId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'visitorId is required' })
        }
      }

      // Check for existing active session
      const existing = await sql`
        SELECT * FROM livechat_sessions
        WHERE visitor_id = ${visitorId}
        AND status IN ('active', 'waiting_for_admin', 'admin_joined')
        ORDER BY created_at DESC LIMIT 1
      `

      if (existing.length > 0) {
        // Update current page
        await sql`
          UPDATE livechat_sessions
          SET current_page = ${currentPage}, updated_at = NOW()
          WHERE id = ${existing[0].id}
        `

        // Get messages
        const messages = await sql`
          SELECT * FROM livechat_messages
          WHERE session_id = ${existing[0].id}
          ORDER BY created_at ASC
        `

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, session: existing[0], messages })
        }
      }

      // Create new session
      const result = await sql`
        INSERT INTO livechat_sessions (visitor_id, current_page, product_context)
        VALUES (${visitorId}, ${currentPage}, ${JSON.stringify(productContext)})
        RETURNING *
      `

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, session: result[0], messages: [] })
      }
    }

    // GET /messages/:sessionId - Get messages for a session
    if (method === 'GET' && segments[0] === 'messages' && segments[1]) {
      const sessionId = segments[1]
      const since = event.queryStringParameters?.since

      let messages
      if (since) {
        messages = await sql`
          SELECT * FROM livechat_messages
          WHERE session_id = ${sessionId} AND created_at > ${since}
          ORDER BY created_at ASC
        `
      } else {
        messages = await sql`
          SELECT * FROM livechat_messages
          WHERE session_id = ${sessionId}
          ORDER BY created_at ASC
        `
      }

      // Check if admin has joined
      const session = await sql`SELECT status FROM livechat_sessions WHERE id = ${sessionId}`
      const adminJoined = session[0]?.status === 'admin_joined'

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, messages, adminJoined })
      }
    }

    // POST /message - Save a new message
    if (method === 'POST' && segments[0] === 'message') {
      const data = JSON.parse(event.body || '{}')
      const { sessionId, senderType, content, adminName } = data

      if (!sessionId || !senderType || !content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'sessionId, senderType, and content are required' })
        }
      }

      const result = await sql`
        INSERT INTO livechat_messages (session_id, sender_type, content, admin_name)
        VALUES (${sessionId}, ${senderType}, ${content}, ${adminName})
        RETURNING *
      `

      // Update session last_message_at and unread_count
      if (senderType === 'visitor') {
        await sql`
          UPDATE livechat_sessions
          SET last_message_at = NOW(), unread_count = unread_count + 1, updated_at = NOW()
          WHERE id = ${sessionId}
        `
      } else {
        await sql`
          UPDATE livechat_sessions
          SET last_message_at = NOW(), updated_at = NOW()
          WHERE id = ${sessionId}
        `
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, message: result[0] })
      }
    }

    // POST /escalate - Escalate to human
    if (method === 'POST' && segments[0] === 'escalate') {
      const data = JSON.parse(event.body || '{}')
      const { sessionId, visitorName, visitorEmail } = data

      await sql`
        UPDATE livechat_sessions
        SET status = 'waiting_for_admin',
            visitor_name = COALESCE(${visitorName}, visitor_name),
            visitor_email = COALESCE(${visitorEmail}, visitor_email),
            updated_at = NOW()
        WHERE id = ${sessionId}
      `

      // Add system message
      await sql`
        INSERT INTO livechat_messages (session_id, sender_type, content)
        VALUES (${sessionId}, 'system', 'Visitor requested to speak with a team member')
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      }
    }

    // ============ ADMIN ENDPOINTS ============

    // PUT /admin/online - Toggle online status
    if (method === 'PUT' && segments[0] === 'admin' && segments[1] === 'online') {
      const admin = verifyAdmin(event.headers.authorization || event.headers.Authorization)
      if (!admin) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) }
      }

      const data = JSON.parse(event.body || '{}')
      await sql`UPDATE livechat_settings SET is_online = ${data.isOnline}, updated_at = NOW() WHERE id = 1`

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, isOnline: data.isOnline })
      }
    }

    // GET /admin/sessions - Get all active sessions
    if (method === 'GET' && segments[0] === 'admin' && segments[1] === 'sessions') {
      const admin = verifyAdmin(event.headers.authorization || event.headers.Authorization)
      if (!admin) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) }
      }

      const sessions = await sql`
        SELECT s.*,
          (SELECT content FROM livechat_messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM livechat_sessions s
        WHERE s.status IN ('active', 'waiting_for_admin', 'admin_joined')
        ORDER BY
          CASE WHEN s.status = 'waiting_for_admin' THEN 0 ELSE 1 END,
          s.last_message_at DESC NULLS LAST
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, sessions })
      }
    }

    // GET /admin/session/:id - Get session details with messages
    if (method === 'GET' && segments[0] === 'admin' && segments[1] === 'session' && segments[2]) {
      const admin = verifyAdmin(event.headers.authorization || event.headers.Authorization)
      if (!admin) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) }
      }

      const sessionId = segments[2]
      const session = await sql`SELECT * FROM livechat_sessions WHERE id = ${sessionId}`
      const messages = await sql`
        SELECT * FROM livechat_messages
        WHERE session_id = ${sessionId}
        ORDER BY created_at ASC
      `

      // Reset unread count
      await sql`UPDATE livechat_sessions SET unread_count = 0 WHERE id = ${sessionId}`

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, session: session[0], messages })
      }
    }

    // POST /admin/takeover - Admin takes over the chat
    if (method === 'POST' && segments[0] === 'admin' && segments[1] === 'takeover') {
      const admin = verifyAdmin(event.headers.authorization || event.headers.Authorization)
      if (!admin) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) }
      }

      const data = JSON.parse(event.body || '{}')
      const { sessionId } = data

      await sql`
        UPDATE livechat_sessions
        SET status = 'admin_joined',
            taken_over_by = ${admin.name || 'Admin'},
            admin_name = ${admin.name || 'Admin'},
            updated_at = NOW()
        WHERE id = ${sessionId}
      `

      // Add system message
      await sql`
        INSERT INTO livechat_messages (session_id, sender_type, content)
        VALUES (${sessionId}, 'system', ${`${admin.name || 'A team member'} has joined the chat`})
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      }
    }

    // POST /admin/message - Admin sends a message
    if (method === 'POST' && segments[0] === 'admin' && segments[1] === 'message') {
      const admin = verifyAdmin(event.headers.authorization || event.headers.Authorization)
      if (!admin) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) }
      }

      const data = JSON.parse(event.body || '{}')
      const { sessionId, content } = data

      const result = await sql`
        INSERT INTO livechat_messages (session_id, sender_type, content, admin_name)
        VALUES (${sessionId}, 'admin', ${content}, ${admin.name || 'Admin'})
        RETURNING *
      `

      await sql`
        UPDATE livechat_sessions
        SET last_message_at = NOW(), updated_at = NOW()
        WHERE id = ${sessionId}
      `

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, message: result[0] })
      }
    }

    // POST /admin/close - Close a session
    if (method === 'POST' && segments[0] === 'admin' && segments[1] === 'close') {
      const admin = verifyAdmin(event.headers.authorization || event.headers.Authorization)
      if (!admin) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) }
      }

      const data = JSON.parse(event.body || '{}')
      const { sessionId } = data

      await sql`
        UPDATE livechat_sessions
        SET status = 'closed', updated_at = NOW()
        WHERE id = ${sessionId}
      `

      // Add system message
      await sql`
        INSERT INTO livechat_messages (session_id, sender_type, content)
        VALUES (${sessionId}, 'system', 'Chat session has been closed')
      `

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      }
    }

    // 404 for unmatched routes
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: 'Not found' })
    }

  } catch (error) {
    console.error('LiveChat error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    }
  }
}

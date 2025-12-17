import crypto from 'crypto'

const {
  R2_ACCESS_KEY,
  R2_SECRET,
  R2_PUBLIC_BASE = '',
  R2_BUCKET = 'astari-golf',
  R2_ACCOUNT_ID = '',
} = process.env

// Helper functions for AWS v4 signing
function hmac(key, string) {
  return crypto.createHmac('sha256', key).update(string).digest()
}

function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Create signed request to R2
async function signedR2Request(method, key, body = null, contentType = 'application/octet-stream') {
  const region = 'auto'
  const service = 's3'
  const host = `${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const endpoint = `https://${host}/${key}`

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const payloadHash = body ? hash(body) : hash('')

  let signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  let canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`

  if (body) {
    signedHeaders = 'content-length;content-type;host;x-amz-content-sha256;x-amz-date'
    canonicalHeaders = `content-length:${body.length}\ncontent-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  }

  const canonicalUri = `/${key}`
  const canonicalQueryString = ''

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hash(canonicalRequest)
  ].join('\n')

  const kDate = hmac('AWS4' + R2_SECRET, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  const kSigning = hmac(kService, 'aws4_request')
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const headers = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    'Authorization': authorization,
  }

  if (body) {
    headers['Content-Type'] = contentType
    headers['Content-Length'] = String(body.length)
  }

  return { endpoint, headers }
}

// List objects in R2 bucket
async function listObjects(prefix = '') {
  const region = 'auto'
  const service = 's3'
  const host = `${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  // Build query string for listing
  const params = new URLSearchParams({
    'list-type': '2',
    'delimiter': '/',
    ...(prefix && { 'prefix': prefix })
  })
  const queryString = params.toString()
  const payloadHash = hash('')

  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`

  const canonicalRequest = [
    'GET',
    '/',
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hash(canonicalRequest)
  ].join('\n')

  const kDate = hmac('AWS4' + R2_SECRET, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  const kSigning = hmac(kService, 'aws4_request')
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

  const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const endpoint = `https://${host}/?${queryString}`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      'Authorization': authorization,
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`List failed: ${response.status} - ${errorText}`)
  }

  const xml = await response.text()

  // Parse XML response
  const folders = []
  const files = []

  // Extract common prefixes (folders)
  const prefixMatches = xml.matchAll(/<CommonPrefixes><Prefix>([^<]+)<\/Prefix><\/CommonPrefixes>/g)
  for (const match of prefixMatches) {
    const path = match[1]
    const name = path.replace(prefix, '').replace(/\/$/, '')
    if (name) {
      folders.push({ name, path, type: 'folder' })
    }
  }

  // Extract contents (files)
  const contentRegex = /<Contents>[\s\S]*?<Key>([^<]+)<\/Key>[\s\S]*?<LastModified>([^<]+)<\/LastModified>[\s\S]*?<Size>([^<]+)<\/Size>[\s\S]*?<\/Contents>/g
  const contentMatches = xml.matchAll(contentRegex)
  for (const match of contentMatches) {
    const key = match[1]
    const lastModified = match[2]
    const size = parseInt(match[3], 10)
    const name = key.replace(prefix, '')

    // Skip if it's a "folder" marker or if it's deeper than current level
    if (name && !name.includes('/') && name !== '') {
      files.push({
        name,
        key,
        type: 'file',
        size,
        lastModified,
        url: `${R2_PUBLIC_BASE.replace(/\/$/, '')}/${key}`
      })
    }
  }

  return { folders, files, prefix }
}

// Upload file to R2
async function uploadFile(key, fileBuffer, contentType) {
  const { endpoint, headers } = await signedR2Request('PUT', key, fileBuffer, contentType)

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers,
    body: fileBuffer,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upload failed: ${response.status} - ${errorText}`)
  }

  return {
    success: true,
    key,
    url: `${R2_PUBLIC_BASE.replace(/\/$/, '')}/${key}`
  }
}

// Delete file from R2
async function deleteFile(key) {
  const { endpoint, headers } = await signedR2Request('DELETE', key)

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers,
  })

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text()
    throw new Error(`Delete failed: ${response.status} - ${errorText}`)
  }

  return { success: true, key }
}

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders }
  }

  if (!R2_ACCESS_KEY || !R2_SECRET || !R2_PUBLIC_BASE || !R2_ACCOUNT_ID) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'R2 environment variables not configured' })
    }
  }

  try {
    const path = event.path.replace('/.netlify/functions/image-manager', '')
    const segments = path.split('/').filter(Boolean)

    // GET /list?prefix=...
    if (event.httpMethod === 'GET' && (segments[0] === 'list' || segments.length === 0)) {
      const params = new URLSearchParams(event.queryStringParameters || {})
      const prefix = params.get('prefix') || 'product-images/'

      const result = await listObjects(prefix)
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, ...result })
      }
    }

    // POST /upload
    if (event.httpMethod === 'POST' && segments[0] === 'upload') {
      const body = JSON.parse(event.body || '{}')
      const { filename, fileData, contentType = 'image/webp', folder = 'product-images/' } = body

      if (!filename || !fileData) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'filename and fileData required' })
        }
      }

      const fileBuffer = Buffer.from(fileData, 'base64')
      const key = `${folder.replace(/\/$/, '')}/${filename}`

      const result = await uploadFile(key, fileBuffer, contentType)
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      }
    }

    // DELETE /delete
    if (event.httpMethod === 'DELETE' || (event.httpMethod === 'POST' && segments[0] === 'delete')) {
      const body = JSON.parse(event.body || '{}')
      const { key } = body

      if (!key) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'key required' })
        }
      }

      const result = await deleteFile(key)
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      }
    }

    // POST /create-folder
    if (event.httpMethod === 'POST' && segments[0] === 'create-folder') {
      const body = JSON.parse(event.body || '{}')
      const { folderPath } = body

      if (!folderPath) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'folderPath required' })
        }
      }

      // Create an empty marker file to represent the folder
      const key = `${folderPath.replace(/\/$/, '')}/.folder`
      const result = await uploadFile(key, Buffer.from(''), 'application/x-directory')

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, folder: folderPath })
      }
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' })
    }

  } catch (err) {
    console.error('Image manager error:', err)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message })
    }
  }
}

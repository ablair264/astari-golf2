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

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers }
  }

  if (!R2_ACCESS_KEY || !R2_SECRET || !R2_PUBLIC_BASE || !R2_ACCOUNT_ID) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'R2 env vars not set' })
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { brand = 'astari', filename, fileData, contentType = 'application/octet-stream' } = body

    if (!filename || !fileData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'filename and fileData required' })
      }
    }

    // Decode base64 file data
    const fileBuffer = Buffer.from(fileData, 'base64')
    const contentLength = fileBuffer.length

    // R2 endpoint
    const region = 'auto'
    const service = 's3'
    const host = `${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    const key = `product-images/${brand}/${filename}`
    const endpoint = `https://${host}/${key}`

    // Create timestamp
    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzDate.slice(0, 8)

    // Calculate content hash
    const payloadHash = hash(fileBuffer)

    // Create canonical request
    const method = 'PUT'
    const canonicalUri = `/${key}`
    const canonicalQueryString = ''
    const signedHeaders = 'content-length;content-type;host;x-amz-content-sha256;x-amz-date'
    const canonicalHeaders =
      `content-length:${contentLength}\n` +
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n')

    // Create string to sign
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      hash(canonicalRequest)
    ].join('\n')

    // Calculate signature
    const kDate = hmac('AWS4' + R2_SECRET, dateStamp)
    const kRegion = hmac(kDate, region)
    const kService = hmac(kRegion, service)
    const kSigning = hmac(kService, 'aws4_request')
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

    // Create authorization header
    const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    // Upload to R2
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(contentLength),
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authorization,
      },
      body: fileBuffer,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('R2 upload failed:', response.status, errorText)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'R2 upload failed', details: errorText })
      }
    }

    const publicUrl = `${R2_PUBLIC_BASE.replace(/\/$/, '')}/product-images/${brand}/${filename}`

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, publicUrl })
    }
  } catch (err) {
    console.error('Upload error', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Upload failed', details: err.message })
    }
  }
}

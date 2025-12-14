import crypto from 'crypto'

const {
  R2_ACCESS_KEY,
  R2_SECRET,
  R2_PUBLIC_BASE = '',
  R2_BUCKET = 'astari-golf',
  R2_ACCOUNT_ID = '',
} = process.env

// Cloudflare R2 uses S3-compatible pre-signed URLs. This creates a v4 signature for PUT.

function hmac(key, string) {
  return crypto.createHmac('sha256', key).update(string).digest()
}

function hash(string) {
  return crypto.createHash('sha256').update(string).digest('hex')
}

export default async function handler(event) {
  if (!R2_ACCESS_KEY || !R2_SECRET || !R2_PUBLIC_BASE || !R2_ACCOUNT_ID) {
    return new Response(JSON.stringify({ error: 'R2 env vars not set' }), { status: 500 })
  }

  if (event.httpMethod !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { brand = 'astari', filename } = JSON.parse(event.body || '{}')
    if (!filename) {
      return new Response(JSON.stringify({ error: 'filename required' }), { status: 400 })
    }

    const method = 'PUT'
    const region = 'auto'
    const host = `${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    const key = `product-images/${brand}/${filename}`
    const endpoint = `https://${host}/${key}`

    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\..*/g, '') + 'Z'
    const dateStamp = amzDate.slice(0, 8)
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`

    const headers = {
      host,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      'x-amz-date': amzDate,
    }

    // Canonical request
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
    const canonicalHeaders = `host:${host}\n` +
      `x-amz-content-sha256:UNSIGNED-PAYLOAD\n` +
      `x-amz-date:${amzDate}\n`
    const canonicalRequest = [
      method,
      `/${key}`,
      '',
      canonicalHeaders,
      signedHeaders,
      'UNSIGNED-PAYLOAD'
    ].join('\n')

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      hash(canonicalRequest)
    ].join('\n')

    const kDate = hmac('AWS4' + R2_SECRET, dateStamp)
    const kRegion = hmac(kDate, region)
    const kService = hmac(kRegion, 's3')
    const kSigning = hmac(kService, 'aws4_request')
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

    const params = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${R2_ACCESS_KEY}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': '900',
      'X-Amz-SignedHeaders': signedHeaders,
      'X-Amz-Signature': signature,
    })

    const uploadUrl = `${endpoint}?${params.toString()}`
    const publicUrl = `${R2_PUBLIC_BASE.replace(/\/$/, '')}/product-images/${brand}/${filename}`

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Upload sign error', err)
    return new Response(JSON.stringify({ error: 'Failed to sign upload URL' }), { status: 500 })
  }
}

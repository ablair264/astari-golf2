// Client-side helper to request signed URLs from Netlify and upload to R2

const FUNCTION_URL = '/.netlify/functions/upload-product-image'

export async function getSignedUploadUrl(brand, filename) {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brand, filename })
  })
  if (!res.ok) {
    throw new Error('Failed to get signed upload URL')
  }
  return res.json()
}

export async function uploadFileToSignedUrl(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  })
  if (!res.ok) {
    throw new Error('Upload failed')
  }
}

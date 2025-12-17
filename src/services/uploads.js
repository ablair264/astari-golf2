// Client-side helper to upload files via Netlify proxy to R2

const FUNCTION_URL = '/.netlify/functions/upload-product-image'

/**
 * Upload a file to R2 via Netlify proxy
 * @param {File} file - The file to upload
 * @param {string} brand - Brand name for path organization
 * @returns {Promise<{publicUrl: string}>} - The public URL of the uploaded file
 */
export async function uploadFile(file, brand = 'astari') {
  // Generate a unique filename
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filename = `${timestamp}_${safeName}`

  // Convert file to base64
  const fileData = await fileToBase64(file)

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand,
      filename,
      fileData,
      contentType: file.type || 'application/octet-stream'
    })
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || 'Upload failed')
  }

  const result = await res.json()
  return { publicUrl: result.publicUrl }
}

/**
 * Convert a File to base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Legacy exports for backwards compatibility
export async function getSignedUploadUrl(brand, filename) {
  console.warn('getSignedUploadUrl is deprecated, use uploadFile instead')
  return { uploadUrl: null, publicUrl: null }
}

export async function uploadFileToSignedUrl(uploadUrl, file) {
  console.warn('uploadFileToSignedUrl is deprecated, use uploadFile instead')
}

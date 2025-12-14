const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_MODEL = 'gpt-4o-mini'

export const generateProductDescription = async (product) => {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key missing. Returning existing description.')
    return product.description || ''
  }

  const prompt = `You are writing marketing copy for a golf retail site. Create a concise, energetic paragraph (45-60 words) describing this product. Focus on performance benefits and premium materials.\n\nProduct data:\n${JSON.stringify(
    product,
    null,
    2,
  )}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'You craft premium e-commerce descriptions for golf gear.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || 'OpenAI request failed')
    }

    const result = await response.json()
    const description = result.choices?.[0]?.message?.content?.trim()
    return description || product.description || ''
  } catch (error) {
    console.error('Error generating description:', error)
    return product.description || ''
  }
}

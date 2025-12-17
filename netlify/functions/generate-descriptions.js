const OpenAI = require('openai')

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    }
  }

  try {
    const { products } = JSON.parse(event.body || '{}')

    if (!products || !Array.isArray(products) || products.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Products array required' })
      }
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'OpenAI API key not configured' })
      }
    }

    const openai = new OpenAI({ apiKey })

    // Build the prompt for batch description generation
    const productList = products.map((p, i) => {
      const details = []
      if (p.name) details.push(`Name: ${p.name}`)
      if (p.brand) details.push(`Brand: ${p.brand}`)
      if (p.category) details.push(`Category: ${p.category}`)
      if (p.material) details.push(`Material: ${p.material}`)
      if (p.colour) details.push(`Colour: ${p.colour}`)
      if (p.size) details.push(`Size: ${p.size}`)
      return `Product ${i + 1}:\n${details.join('\n')}`
    }).join('\n\n')

    const systemPrompt = `You are an expert e-commerce copywriter specializing in golf equipment and accessories.
Your task is to generate compelling, shop-ready product descriptions that:

1. Are concise but informative (2-4 sentences max)
2. Highlight key features and benefits
3. Use varied language and sentence structures - avoid repetitive patterns
4. Appeal to golfers of all skill levels
5. Include relevant golf terminology naturally
6. Create urgency or desire without being pushy
7. Are SEO-friendly with natural keyword inclusion

IMPORTANT VARIATION GUIDELINES:
- Start each description differently (avoid always starting with "The" or the brand name)
- Mix sentence lengths - some short and punchy, some longer and detailed
- Vary the focus: some descriptions lead with benefits, others with features, others with the experience
- Use different tones: professional, enthusiastic, understated luxury, performance-focused
- Include sensory language occasionally (feel, grip, touch, look)

Return ONLY a JSON array of description strings, one for each product, in the same order as provided.
Do not include any other text, explanation, or markdown formatting.`

    const userPrompt = `Generate unique, varied product descriptions for these ${products.length} golf products:\n\n${productList}\n\nReturn a JSON array of ${products.length} description strings.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8, // Higher temperature for more varied outputs
      max_tokens: 1500,
    })

    const content = response.choices[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse the JSON response
    let descriptions
    try {
      // Handle potential markdown code blocks
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      descriptions = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      throw new Error('Failed to parse AI response')
    }

    if (!Array.isArray(descriptions)) {
      throw new Error('Invalid response format from AI')
    }

    // Ensure we have the right number of descriptions
    while (descriptions.length < products.length) {
      descriptions.push('Premium golf equipment designed for performance and style.')
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        descriptions: descriptions.slice(0, products.length)
      })
    }

  } catch (error) {
    console.error('Description generation error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate descriptions'
      })
    }
  }
}

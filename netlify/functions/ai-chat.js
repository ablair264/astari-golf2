// AI Chat - Uses OpenAI for chat responses (uses native fetch in Node 18+)

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const SYSTEM_PROMPT = `You are a helpful assistant for ASTARI Golf, a premium golf equipment retailer.

About ASTARI Golf:
- We sell high-quality golf grips, bags, clubs, balls, and accessories
- We focus on performance gear that helps golfers improve their game
- Our products are designed for both amateur and professional golfers
- We offer competitive pricing and excellent customer service

Your role:
- Answer questions about our products and services
- Help customers find the right gear for their needs
- Provide golf-related advice when appropriate
- Be friendly, professional, and helpful
- If you don't know something specific about our inventory, suggest they browse our products page or speak with a team member

Keep responses concise (2-3 sentences max) unless the customer asks for more detail.`

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { message, history = [] } = JSON.parse(event.body || '{}')

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      }
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      // Fallback response if no API key
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reply: "Thanks for your message! Our team will get back to you shortly. In the meantime, feel free to browse our products."
        })
      }
    }

    // Build messages array for OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      })),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 300,
        temperature: 0.7,
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      throw new Error('AI service unavailable')
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again."

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    }

  } catch (error) {
    console.error('AI Chat error:', error)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: "Thanks for your message! I'm having a moment - please try again or speak with a team member for immediate assistance."
      })
    }
  }
}

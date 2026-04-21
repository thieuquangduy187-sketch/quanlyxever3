// Netlify Function: proxy requests to Apps Script
// This avoids CORS issues since the call is server-to-server
// GAS_URL is set as server-side environment variable in Netlify UI (not exposed to browser)

exports.handler = async (event) => {
  const GAS_URL = process.env.GAS_URL

  if (!GAS_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GAS_URL environment variable not set' })
    }
  }

  try {
    let response

    if (event.httpMethod === 'GET') {
      const params = new URLSearchParams(event.queryStringParameters || {})
      const url = `${GAS_URL}?${params.toString()}`
      response = await fetch(url)
    } else if (event.httpMethod === 'POST') {
      response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: event.body
      })
    } else {
      return { statusCode: 405, body: 'Method not allowed' }
    }

    const text = await response.text()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache'
      },
      body: text
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    }
  }
}

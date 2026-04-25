// Netlify Function: proxy image requests to backend
exports.handler = async (event) => {
  const folder = event.queryStringParameters?.folder || ''
  if (!folder) {
    return { statusCode: 400, body: JSON.stringify({ urls: [] }) }
  }

  const API_URL = process.env.API_URL || process.env.VITE_API_URL || ''
  if (!API_URL) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ urls: [], error: 'API_URL not set' })
    }
  }

  try {
    const res = await fetch(`${API_URL}/api/xe/images?folder=${encodeURIComponent(folder)}`)
    const data = await res.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    }
  } catch(err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ urls: [], error: err.message })
    }
  }
}

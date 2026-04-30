// Talha AI Guide, OpenRouter Proxy
// Hides API key on server side. Frontend calls this worker instead of OpenRouter directly.

const ALLOWED_ORIGINS = [
  'https://themeknock.github.io',
  'http://localhost',
  'https://localhost'
];

function corsHeaders(origin) {
  const isAllowed = ALLOWED_ORIGINS.some(allowed => origin?.startsWith(allowed));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://themeknock.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }

    if (!env.OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }

    try {
      const body = await request.json();

      const allowedFields = ['model', 'messages', 'max_tokens', 'temperature', 'stream'];
      const cleaned = {};
      for (const k of allowedFields) if (k in body) cleaned[k] = body[k];

      if (!cleaned.model || !Array.isArray(cleaned.messages)) {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
        });
      }

      cleaned.max_tokens = Math.min(cleaned.max_tokens || 800, 1500);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://themeknock.github.io/quiet-revolution',
          'X-Title': 'Talha AI Guide'
        },
        body: JSON.stringify(cleaned)
      });

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin)
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
      });
    }
  }
};

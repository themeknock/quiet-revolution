# Talha AI Proxy Worker

Cloudflare Worker that proxies OpenRouter requests. Holds the API key on server side, frontend never sees it.

## Setup (One time)
```bash
wrangler login
wrangler deploy
echo "your-api-key" | wrangler secret put OPENROUTER_API_KEY
```

## Update key later
```bash
echo "new-api-key" | wrangler secret put OPENROUTER_API_KEY
```

## Live URL
https://talha-ai-proxy.themeknock.workers.dev

### run local
```
❯ bun install
❯ bun run dev

❯ curl -X POST http://localhost:8787/ask -H "Content-Type: application/json" -H "x-api-key:[YOUR_API_KEY]" -d '{"question": "whats your name?"}'
{"answer":"I am a large language model, trained by Google.\n"}
```

### put secrets on local
```
❯ cp .dev.vars.example .dev.vars
# edit .dev.vars
# GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"
# API_KEY = "YOUR_API_KEY"
```

### put secrets on cloudflare
```
❯ wrangler secret put GEMINI_API_KEY
❯ wrangler secret put API_KEY
```



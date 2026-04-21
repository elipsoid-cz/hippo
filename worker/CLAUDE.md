# Cloudflare Worker — Hippo Admin API

URL: `https://hippo-admin-api.hippobee.workers.dev`
Účel: bezpečný proxy — GitHub PAT a Gemini key nikdy neopustí server.

## Endpointy
- `POST /auth/login` — ověří heslo, vrátí JWT (rate limit: 5 pokusů / 15 min per IP)
- `ANY /github/**` — proxy na `api.github.com` (scoped: jen `elipsoid-cz/hippo`)
- `POST /gemini/generate` — proxy na Gemini API (denní limit: 10 volání, `GEMINI_DAILY_LIMIT`)
- `GET /gemini/status` — stav Gemini klíče + denní usage
- `GET /auth/check` — ověří platnost JWT

## Bezpečnost
- JWT: HMAC-SHA256, 2h platnost, stateless
- Requesty musí mít `Origin` header (browser) nebo `X-Hippo-Client: admin`
- CORS: `elipsoid-cz.github.io`, `localhost:*`
- GitHub proxy povoluje jen: `/repos/elipsoid-cz/hippo/contents/`, `.../git/`, `.../actions/workflows/generate-cover.yml/...`, `.../actions/runs/`

## Secrets (`wrangler secret put`)
- `PASSWORD_HASH` — SHA-256 hex (`echo -n "heslo" | shasum -a 256`)
- `GITHUB_PAT` — GitHub PAT (repo + workflow scope)
- `GEMINI_KEY` — Gemini API key (volitelné)
- `JWT_SECRET` — min 32 znaků

## KV
- Namespace: `RATE_LIMIT` (id: `2dc2600c8db8480d9ce14ddec3f3afd1`) — login rate limit + Gemini počítadlo

## Dev & Deploy
- Dev: `cd worker && npm install && npm run dev` (port 8787)
- Deploy: `cd worker && npm run deploy`

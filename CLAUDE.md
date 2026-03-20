# Claude Instructions for Hippo Project

## Project Overview
Hippo 🦛 is an interactive web application for English language learning with practice exercises.

## Project Structure
- `index.html` - Main landing page with links to all exercises
- `english/spelling-bees/` - Spelling practice exercises with audio
- `english/grammar/` - Grammar exercises (irregular verbs, comparatives)
- `admin/index.html` - Admin rozhraní pro správu spelling bee setů

## Technology Stack
- HTML5
- CSS3 (Custom Properties)
- Vanilla JavaScript
- Web Speech API (Text-to-Speech)
- Firebase Firestore (leaderboard backend)

## Development Guidelines
- Keep exercises simple and focused on one topic
- Use consistent styling with CSS variables from main index.html
- Each exercise should be self-contained in its own directory
- Use emoji icons for visual appeal (🐝, 📝, 🚀, etc.)
- Follow naming convention: `YYYY-MM-DD-topic` for dated exercises

## Git Workflow
- Main branch: `main`
- Remote: https://github.com/elipsoid-cz/hippo.git
- Keep commits focused and descriptive
- Use Czech language for commit messages when working with Czech user

## File Organization
Each exercise should have:
- Its own `index.html` file
- Self-contained styling and scripts
- Clear title and instructions
- Score tracking and feedback

## Spelling Bee Shared Engine
- `english/spelling-bees/shared/engine.js` - core game logic (IIFE, `SpellingBeeEngine`)
- `english/spelling-bees/shared/words.js` - word sets + Firebase config
- `english/spelling-bees/shared/styles.css` - shared styles
- `english/spelling-bees/play/index.html` - unified player; čte `?set=YYYY-MM-DD` z URL
- `english/spelling-bees/YYYY-MM-DD/index.html` - pouze redirect na `../play/?set=YYYY-MM-DD`

### Přidání nového spelling bee setu
**Preferovaný způsob:** přes admin rozhraní (`admin/index.html`).

Manuálně: přidat entry do `SPELLING_BEE_SETS` v `words.js` — karta na homepage se zobrazí automaticky, NEW badge se přiřadí nejnovějšímu setu (nejvyšší klíč).

**Po přidání setu vždy vygenerovat cover obrázek:**
```bash
node scripts/generate-covers.js --set YYYY-MM-DD
```
Skript uloží `english/spelling-bees/{setId}/cover.jpg` a přidá `cover: true` do `words.js`. Před spuštěním se zeptej uživatele (placené API).

### Cover obrázky — tournament
Pro regeneraci tournament coveru použij prompt uložený v paměti (`project_cover_images.md`). Výsledek: `english/spelling-bees/tournament/cover.jpg`.

### Pravidlo pro překlady (translations)
**DŮLEŽITÉ:** Překlad nesmí prozrazovat hláskování anglického slova. Vždy zkontroluj, zda český překlad není příliš podobný anglickému originálu.

Zakázáno (příliš napovídá):
- `designer` → "designér" (skoro stejné slovo)
- `fantastic` → "fantastický" (stejný základ)
- `chemistry` → "chemie" (stejný základ)
- `detective` → "detektiv" (stejný základ)

Správně (použij skutečný český ekvivalent nebo opisný překlad):
- `designer` → "návrhář"
- `fantastic` → "úžasný / skvělý"
- `chemistry` → "nauka o látkách"
- `detective` → "vyšetřovatel"

Obecné pravidlo: pokud by žák mohl Czech překlad přečíst foneticky a odvodit z toho anglický pravopis, překlad je špatný.

### Architektura karet (index.html)
- Spelling bee karty jsou generovány dynamicky z `words.js` (JS na konci body)
- Tournament badge (počet slov, počet setů) se počítá automaticky přes `getAllSpellingBeeWords()`
- Každý set: popis = `set.description + ': ' + set.words.join(', ')`

## Leaderboard (Firebase Firestore)
- **Firebase projekt:** `hippo-cz` (free Spark tier)
- **Config:** `FIREBASE_CONFIG` in `words.js`, SDK loaded dynamically in engine.js
- **Firestore structure:** `leaderboards/{setId}/scores/{nicknameKey}`
- **Document fields:** `{ nickname, score, total, totalAttempts, bestStreak, date }`
- **Ranking:** score% desc > totalAttempts asc > bestStreak desc > date asc
- **Score update:** new score overwrites old only if better (higher %, fewer attempts, or higher streak)
- **UX:** Nickname prompted on final screen only (not before game), pre-filled from localStorage
- **Display:** Leaderboard visible on both welcome and final screens; empty state shows "No scores yet — be the first!"
- **Practice Mistakes:** Leaderboard hidden and scores not saved in Practice Mistakes mode (`state.mode !== "all"`)
- **Bug (opraveno):** Save panel z předchozí All Words hry zůstával v DOM a byl znovu viditelný po Practice Mistakes → `showFinal()` nyní vždy odstraní starý panel na začátku
- **Security:** Firebase API key is intentionally public; security enforced by Firestore rules; key restricted to `elipsoid-cz.github.io/*`

## Admin rozhraní (`admin/index.html`)
- **URL:** `elipsoid-cz.github.io/hippo/admin/` (nebo `localhost:3000/admin/`)
- **Přihlášení:** pouze heslo — tokeny (GitHub PAT, Gemini key) zůstávají na Cloudflare Worker serveru
- **Backend:** Cloudflare Worker (`worker/`) — proxy pro GitHub API a Gemini API
- **JWT session:** po přihlášení Worker vrátí JWT (2h platnost), uložený v `sessionStorage`
- **Záložky:** Sety | Leaderboard | Validace
- **Sety:** přidat/upravit/smazat set; dynamické řádky slov (1–n); datum setu = unikátní klíč (`YYYY-MM-DD`), předvyplněno dnešním datem
- **Commit:** atomický přes GitHub Git Trees API (5 kroků) přes Worker proxy, zároveň bumps verze v `index.html`
- **Validace překladů:** Levenshtein similarita ≥ 60 % = varování; probíhá při ukládání, ne kontinuálně
- **Cover:** tlačítko Cover zobrazí stávající obrázek, pak nabídne regeneraci přes GitHub Actions (`generate-cover.yml`); po dispatchnutí workflow se v modalu zobrazuje live stav (polling GitHub API každých 5 s, max 3 min); při auto-triggeru po uložení nového setu běží polling na pozadí a stav se zobrazuje v persistentním banneru dole na stránce
- **Leaderboard:** načítá z Firebase (přímo, ne přes Worker), umožňuje mazat jednotlivé záznamy i celý set
- **Konstanty:** `REPO = 'elipsoid-cz/hippo'`, `BRANCH = 'main'`, `WORKER_URL = 'https://hippo-admin-api.hippobee.workers.dev'`

### Cloudflare Worker (`worker/`)
- **Účel:** bezpečný proxy — GitHub PAT a Gemini API key nikdy neopustí server
- **Endpointy:**
  - `POST /auth/login` — ověří heslo (rate-limited: 5 pokusů / 15 min per IP), vrátí JWT
  - `ANY /github/**` — proxy na `api.github.com`, injektuje PAT (scoped jen na `elipsoid-cz/hippo`)
  - `POST /gemini/generate` — proxy na Gemini API, injektuje API key (denní limit: 10 volání)
  - `GET /gemini/status` — vrátí zda je Gemini key nakonfigurovaný + denní usage
  - `GET /auth/check` — ověří platnost JWT
- **Bezpečnost:**
  - Login rate limiting: KV-based, 5 pokusů / 15 min per IP
  - GitHub proxy scoping: povolené jen cesty `/repos/elipsoid-cz/hippo/contents/`, `.../git/`, `.../actions/workflows/generate-cover.yml/dispatches`, `.../actions/workflows/generate-cover.yml/runs`, `.../actions/runs/`
  - Gemini denní limit: max 10 volání/den (konfigurovatelné v `GEMINI_DAILY_LIMIT`)
  - Requesty musí mít `Origin` header (browser) nebo `X-Hippo-Client: admin` header
  - JWT: HMAC-SHA256, 2h platnost, stateless
- **KV namespace:** `RATE_LIMIT` — pro login rate limiting a Gemini denní počítadlo
- **Secrets** (nastavit přes `wrangler secret put`):
  - `PASSWORD_HASH` — SHA-256 hex hash hesla
  - `GITHUB_PAT` — GitHub Personal Access Token (repo + workflow)
  - `GEMINI_KEY` — Gemini API key (volitelné)
  - `JWT_SECRET` — náhodný string pro podepisování JWT (min 32 znaků)
- **CORS:** povolené originy: `elipsoid-cz.github.io`, `localhost:*`
- **Dev:** `cd worker && npm install && npm run dev` (port 8787)
- **Deploy:** `cd worker && npm run deploy`
- **KV setup:** `cd worker && npx wrangler kv namespace create RATE_LIMIT` → vložit ID do `wrangler.toml`

### GitHub Actions — generate-cover.yml
- Spouští se přes `workflow_dispatch` s inputem `set_id`
- Používá `GEMINI_API_KEY` z GitHub Secrets (neukládat nikam jinam!)
- Výsledek: `english/spelling-bees/{setId}/cover.jpg` + `cover-thumb.jpg`, auto-commit

## Placená API volání
- **DŮLEŽITÉ:** Před každým voláním API, které stojí peníze (Gemini image generation, Firebase paid tier, apod.), se vždy zeptej uživatele a počkej na jeho souhlas. Nespouštěj taková volání automaticky.

## Verze (footer v index.html)
- Formát: `vX.Y.Z` — major.minor.patch
- Zvyšuj při každém commitu: patch = bugfix, minor = nová feature/refaktoring, major = zásadní změna
- Aktuální verze: **v1.8.7**
- **DŮLEŽITÉ:** Vždy aktualizuj verzi v `index.html` jako součást každého commitu — nikdy necommituj bez zvýšení verze!

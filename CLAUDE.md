# Claude Instructions for Hippo Project

## Superpowers / Skills
- **Vždy se zeptej uživatele před použitím superpowers pluginu** (brainstorming, writing-plans, subagent-driven-development, atd.) — zbytečné použití spaluje tokeny.
- Výjimka: `superpowers:verification-before-completion` a `superpowers:systematic-debugging` lze použít bez ptaní.

## Project Overview
Hippo 🦛 is an interactive web application for learning — English language exercises and math games.

## Project Structure
- `index.html` - Main landing page (HippoBee — English exercises only, nezasahuj sem kvůli math)
- `english/spelling-bees/` - Spelling practice exercises with audio
- `english/grammar/` - Grammar exercises (irregular verbs, comparatives)
- `admin/index.html` - Admin rozhraní pro správu spelling bee setů
- `math/index.html` - Math hub (vstupní stránka pro matematické hry, přístupná přes `/math/`)
- `math/multiply/index.html` - Math Blaster — retro arcade násobilka

## Sekce jsou oddělené
- **English sekce** (`index.html`, `english/`) a **Math sekce** (`math/`) jsou záměrně oddělené
- Math hub je dostupný přes `/math/`, anglická homepage se nemění
- Verze v `index.html` se bumkuje až při integraci math sekce do anglické homepage

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
- **Tournament pin:** `var TOURNAMENT_PINNED = false/true` v `words.js` — pokud `true`, tournament karta se zobrazí jako první; přepíná se tlačítkem v admin záložce Sety

### Tournament Practice (`english/spelling-bees/tournament/`)
- Procvičuje všechna slova ze všech setů (87+ slov), 10 per round
- Config: `showProgress: true` — zapíná mastery systém (ostatní sety ho nemají)
- **Audio:** `audioPathMap: getTournamentAudioMap()` — každé slovo se přehraje z pre-recorded WAV ze svého setu (`../YYYY-MM-DD/audio/`); slova bez audia fallbackují na TTS; `getTournamentAudioMap()` je definovaná v `words.js`
- **Mastery systém:**
  - Seen words: `localStorage` klíč `hippo-seen-tournament` — slova označená jako viděná po prvním odehrání kola
  - Mastered = viděné AND bez chyby (odstraněno z mistakes po 3 správných za sebou)
  - Progress tracker: 3-segment bar (mastered / learning / not seen) na welcome i final screen
  - Výběr slov: mistakes → unseen → seen-clean (priority order)
- **Mastery leaderboard** (odlišné schéma od běžných setů):
  - Firestore dokument: `{ nickname, masteredCount, totalWords, date }`
  - Řazení: masteredCount desc → date asc (první dosažení jako tiebreaker)
  - Přepíše staré skóre jen pokud masteredCount vzrostl
  - Admin leaderboard detekuje mastery entries přes `s.masteredCount !== undefined`

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
- **Sety:** přidat/upravit/smazat set; dynamické řádky slov (1–n); datum setu = unikátní klíč (`YYYY-MM-DD`), předvyplněno dnešním datem; widget "Tournament pin" (připnout/odpíchnout kartu na homepage) commituje `TOURNAMENT_PINNED` v `words.js`
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

## Hint systém (Spelling Bee)

- **1. nápověda** (po 1. špatné odpovědi): políčka pro každé písmeno slova — první písmeno zelené a odhalené, zbytek šedé otazníky (`?`), mezery zachovány jako mezery. Žádný text "Starts with...".
- **2. nápověda** (po 2. špatné odpovědi): letter-by-letter barevný feedback — zelené = správné, červené = špatné (porovnání se zadaným vstupem).
- Implementace: `generateHint()` v `engine.js`; CSS třídy `hint-correct`, `hint-blank`, `hint-wrong`, `hint-space` ve `styles.css`.

## Audio systém (Spelling Bee)
- **Technologie:** Gemini TTS API (`gemini-2.5-flash-preview-tts`) → raw PCM base64 → WAV (44-byte RIFF header, 24kHz/16bit/mono)
- **Soubory:** `english/spelling-bees/{setId}/audio/{word}.wav` (slova s mezerami → pomlčka, apostrof a spec. znaky odstraněny)
- **Filename normalizace:** `word.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') + '.wav'` — MUSÍ být stejná v `scripts/generate-audio.js` i `engine.js`
- **Aktivace:** `audio: true` v `words.js` pro daný set; `engine.js` čte `audioPath` z configu
- **Přehrávání:** HTML5 Audio s preloadem, `playbackRate=0.65` pro slow mode; Web Speech API fallback při chybě
- **AudioCache:** `preloadAudio()` v `engine.js` přednačte všechna slova při startu hry (nulová latence)
- **Hlas:** Puck (výchozí pro produkci, předat jako `--voice Puck`)
- **Vygenerování:** `node scripts/generate-audio.js --set YYYY-MM-DD --voice Puck`
  - Auto-retry: 3 pokusy per slovo, 20s prodleva mezi pokusy
  - Rate limit: 21s prodleva mezi slovy (free tier 10 RPM, 100 RPD)
  - `markAudioInWordsJs()` přidá `audio: true` do `words.js` jen pokud alespoň 1 slovo uspělo
- **Kvóta Gemini TTS (Default Gemini Project, free tier):** 10 RPM, 100 RPD — resetuje o půlnoci UTC (1:00 CET)
- **GitHub Secret `GEMINI_API_KEY`** → musí být klíč z **Default Gemini Project** (AI Studio), ne z hippo-cz
- **POZOR:** hippo-cz Firebase projekt = Google Cloud projekt jsou jedno. Odebrání billingu z Firebase odebere billing z celého GCP projektu včetně Gemini API kvót.

### GitHub Actions — generate-audio.yml
- Spouští se přes `workflow_dispatch` s inputem `set_id`
- Používá `GEMINI_API_KEY` z GitHub Secrets
- Hlas: Puck (napevno v workflow)
- `git stash` před `git pull --rebase` → `git stash pop` (kvůli změnám `words.js` při generování)
- Výsledek: WAV soubory + `audio: true` v `words.js`, auto-commit

### Admin — Audio modal
- Tlačítko 🔊 Audio v tabulce setů (sloupec vpravo od Cover)
- Zobrazuje počet vygenerovaných slov / celkový počet
- Při otevření modálu: HEAD requesty pro každé slovo (zjistí existenci souboru)
- Slova bez audia označena `—`, ostatní mají ▶️ tlačítko pro přehrání
- Tlačítko "Dogenerovat zbývající (N)" spustí workflow jen pro chybějící slova
- Po dokončení generování: tlačítko "📋 Zobrazit slova" (deployment delay ~1 min po commitu)
- Hard refresh (Cmd+Shift+R) po nasazení pokud admin zobrazuje starý stav
- ESC zavírá všechny modály (audio, cover, editor)

## Firestore Security Rules

Firestore rules jsou spravované **pouze ve Firebase Console** (nejsou v gitu). Při každé změně Firestore schématu je nutné rules zkontrolovat a případně aktualizovat.

**Aktuální rules** povolují zápis ve dvou schématech:
- Normální set: `{ nickname, score, total, ... }` — score a total musí být int v platném rozsahu
- Tournament mastery: `{ nickname, masteredCount, totalWords, date }` — masteredCount musí být int ≥ 0

**Post mortem (2026-04):** Tournament leaderboard neukladal žádné záznamy, protože `saveMasteryScore` ukládá jiná pole než rules vyžadovaly (`masteredCount` místo `score`/`total`). Chyba přežila dlouho, protože:
1. `.catch()` v Firebase operacích tiše spolkl `PERMISSION_DENIED` bez jakéhokoliv logu
2. `loadLeaderboard` vracel prázdné výsledky ze dvou důvodů naráz (prázdná kolekce + `orderBy` na neexistujícím poli), takže nebylo jasné, kde je problém

**Pravidla do budoucna:**
- Každý `.catch()` v Firebase operaci musí logovat chybu: `.catch(function(err) { console.error("[Hippo] ...", err); })`
- Při přidání nového Firestore schématu (nová pole) vždy zkontrolovat, zda rules zápis povolují
- `loadLeaderboard` nepoužívá `orderBy` na Firestore — řazení probíhá client-side (odolné vůči chybějícím polím)

## Placená API volání
- **DŮLEŽITÉ:** Před každým voláním API, které stojí peníze (Gemini image generation, Firebase paid tier, apod.), se vždy zeptej uživatele a počkej na jeho souhlas. Nespouštěj taková volání automaticky.

## Verze (footer v index.html)
- Formát: `vX.Y.Z` — major.minor.patch
- Zvyšuj při každém commitu: patch = bugfix, minor = nová feature/refaktoring, major = zásadní změna
- Aktuální verze: **v1.10.6**
- **DŮLEŽITÉ:** Vždy aktualizuj verzi v `index.html` jako součást každého commitu — nikdy necommituj bez zvýšení verze!
- **Výjimka:** Commity čistě do `math/` sekce verzi nebumpují (math je zatím oddělená, nezobrazuje se na homepage)

## Math Blaster (`math/multiply/index.html`)
- **Technologie:** Vanilla JS, HTML5, CSS3, Firebase Firestore, localStorage — vše v jednom souboru
- **Firebase kolekce:** `leaderboards/math-multiply/scores/{nicknameKey}`
- **Schéma dokumentu:** `{ nickname, score, level, date }` — score desc → date asc
- **localStorage klíče:** `mathblaster-xp`, `mathblaster-level`, `mathblaster-badges`, `mathblaster-nickname`
- **Herní flow:** Welcome → Kolo (10 příkladů, 6s timer) → Boss fight (5 příkladů, 4s timer, 6–9×6–9) → Výsledky
- **Boss fight:** těžší příklady (6–9 × 6–9), pulzující červené pozadí (`boss-bg` třída na `body`), 2× body
- **Gamifikace:** 3 životy, combo ×2/×3, XP, levely 1–10, 6 odznaků
- **Konfigurace:** konstanty `TIMER_NORMAL`, `TIMER_BOSS`, `ROUND_SIZE`, `BOSS_SIZE`, `COMBO_2X`, `COMBO_3X` na začátku `<script>` tagu
- **Firestore rules:** Math Blaster schéma přidáno do existujících rules (score + level, bez `total`)

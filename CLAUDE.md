# Claude Instructions for Hippo Project

## Superpowers / Skills
- **Vždy se zeptej uživatele před použitím superpowers pluginu** (brainstorming, writing-plans, subagent-driven-development, atd.) — zbytečné použití spaluje tokeny.
- Výjimka: `superpowers:verification-before-completion` a `superpowers:systematic-debugging` lze použít bez ptaní.

## Project Overview
Hippo 🦛 — webová app pro výuku: anglické jazykové cvičení a matematické hry.

## Project Structure
- `index.html` — Main landing page (English only, nezasahuj sem kvůli math)
- `english/spelling-bees/` — Spelling exercises with audio
- `english/grammar/` — Grammar exercises
- `admin/index.html` — Admin pro správu spelling bee setů
- `math/` — Math sekce (viz `math/CLAUDE.md`)

## Sekce jsou oddělené
- English (`index.html`, `english/`) a Math (`math/`) jsou záměrně oddělené
- Verze v `index.html` se nebumpuje pro commity čistě do `math/`

## Git Workflow
- Branch: `main`, remote: `https://github.com/elipsoid-cz/hippo.git`
- Commit messages v češtině

## Verze (footer v index.html)
- Formát: `vX.Y.Z` — patch = bugfix, minor = feature, major = zásadní změna
- Aktuální: **v1.10.6**
- **DŮLEŽITÉ:** Vždy bumkuj verzi v `index.html` s každým commitem (výjimka: čistě math commity)

## Placená API volání
- **VŽDY se zeptej uživatele** před Gemini image generation nebo jiným placeným API. Nespouštěj automaticky.

## Spelling Bee — Architektura
- `english/spelling-bees/shared/engine.js` — core logic (IIFE, `SpellingBeeEngine`)
- `english/spelling-bees/shared/words.js` — word sets + Firebase config
- `english/spelling-bees/shared/styles.css` — shared styles
- `english/spelling-bees/play/index.html` — unified player (`?set=YYYY-MM-DD`)
- `english/spelling-bees/YYYY-MM-DD/index.html` — pouze redirect na `../play/?set=YYYY-MM-DD`

### Přidání nového setu
Preferovaně přes admin (`admin/index.html`). Manuálně: přidat do `SPELLING_BEE_SETS` v `words.js`.
**Po přidání vždy vygenerovat cover** (ptej se uživatele — placené API):
```bash
node scripts/generate-covers.js --set YYYY-MM-DD
```
Tournament cover: použij prompt z paměti (`project_cover_images.md`).

### Překlady (translations) — DŮLEŽITÉ PRAVIDLO
Překlad nesmí prozrazovat hláskování anglického slova. Nikdy nepoužívej foneticky podobné slovo:
- ❌ `designer` → "designér", `detective` → "detektiv"
- ✓ `designer` → "návrhář", `detective` → "vyšetřovatel"

Pravidlo: pokud žák může z překladu foneticky odvodit anglický pravopis, překlad je špatný.

### Architektura karet (index.html)
- Karty generovány dynamicky z `words.js`; popis = `set.description + ': ' + set.words.join(', ')`
- **Tournament pin:** `TOURNAMENT_PINNED` v `words.js` — přepíná přes admin záložku Sety

### Tournament (`english/spelling-bees/tournament/`)
- Procvičuje všechna slova (87+ slov), 10 per round, `showProgress: true` (mastery systém)
- Audio: `audioPathMap: getTournamentAudioMap()` — WAV z pre-recorded souborů, TTS fallback
- Mastery: seen (`hippo-seen-tournament`), mastered = viděné + bez chyby 3× za sebou
- Progress bar: mastered / learning / not seen; výběr slov: mistakes → unseen → seen-clean
- Leaderboard schéma: `{ nickname, masteredCount, totalWords, date }` — **odlišné od běžných setů!**
  - Přepíše jen pokud masteredCount vzrostl; admin detekuje přes `s.masteredCount !== undefined`

### Hint systém
- 1. nápověda (po 1. chybě): políčka — první písmeno zelené, zbytek `?`, mezery zachovány
- 2. nápověda (po 2. chybě): letter-by-letter feedback (zelená = správné, červená = špatné)
- `generateHint()` v `engine.js`; CSS třídy `hint-correct`, `hint-blank`, `hint-wrong`, `hint-space`

### Audio systém
- Soubory: `{setId}/audio/{word}.wav`; filename normalizace: `word.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') + '.wav'` — stejná v `generate-audio.js` i `engine.js`
- Aktivace: `audio: true` v `words.js`; přehrávání `playbackRate=0.65` pro slow mode, TTS fallback
- Generování: `node scripts/generate-audio.js --set YYYY-MM-DD --voice Puck` → GitHub Actions (`generate-audio.yml`)
- Kvóta free tier: 10 RPM, 100 RPD; `GEMINI_API_KEY` musí být z **Default Gemini Project** (AI Studio), ne z hippo-cz
- **POZOR:** hippo-cz Firebase = Google Cloud projekt — odebrání billingu odebere Gemini API kvóty

## Leaderboard (Firebase Firestore)
- Projekt: `hippo-cz` (free Spark tier); config: `FIREBASE_CONFIG` v `words.js`
- Struktura: `leaderboards/{setId}/scores/{nicknameKey}`
- Schéma: `{ nickname, score, total, totalAttempts, bestStreak, date }`
- Ranking: score% desc → totalAttempts asc → bestStreak desc → date asc
- Nové skóre přepíše jen pokud je lepší; nickname z localStorage, ptá se až na final screen
- Practice Mistakes mode: leaderboard se nezobrazuje, skóre se neukládá (`state.mode !== "all"`)
- Firebase API klíč je záměrně veřejný; security via Firestore rules; klíč omezený na `elipsoid-cz.github.io/*`

### Firestore Security Rules
- Spravovány **pouze ve Firebase Console** (nejsou v gitu); při změně schématu vždy zkontrolovat
- Povolená schémata: normální `{ nickname, score, total, ... }` + tournament `{ nickname, masteredCount, totalWords, date }`
- **Pravidlo:** každý `.catch()` v Firebase musí logovat: `.catch(function(err) { console.error("[Hippo]", err); })`
- `loadLeaderboard` řadí client-side (bez `orderBy` na Firestore — odolné vůči chybějícím polím)

## Admin (`admin/index.html`)
- URL: `elipsoid-cz.github.io/hippo/admin/` nebo `localhost:3000/admin/`
- Přihlášení heslem; backend: Cloudflare Worker (`worker/`, viz `worker/CLAUDE.md`)
- JWT session (2h, `sessionStorage`); záložky: Sety | Leaderboard | Validace
- Commit: atomický přes GitHub Git Trees API (5 kroků), zároveň bumps verze v `index.html`
- Cover: tlačítko → zobrazí obrázek → regenerace přes GitHub Actions (live polling 5 s, max 3 min)
- Audio modal 🔊: HEAD requesty pro existenci WAV souborů; "Dogenerovat zbývající (N)" spustí workflow
- Validace překladů: Levenshtein ≥ 60 % = varování při ukládání
- Konstanty: `REPO='elipsoid-cz/hippo'`, `BRANCH='main'`, `WORKER_URL='https://hippo-admin-api.hippobee.workers.dev'`

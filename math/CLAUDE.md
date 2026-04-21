# Math sekce — Hippo

## Struktura
- `math/index.html` — Math hub (přístupné přes `/math/`)
- `math/multiply/index.html` — Math Blaster (retro arcade násobilka, vše v jednom souboru)

## Verze
Commity čistě do `math/` **nebumpují** verzi v kořenovém `index.html` (math je zatím oddělená sekce).

## Math Blaster (`math/multiply/index.html`)
- Firebase: `leaderboards/math-multiply/scores/{nicknameKey}`; schéma: `{ nickname, score, level, date }`; řazení: score desc → date asc
- localStorage: `mathblaster-xp`, `mathblaster-level`, `mathblaster-badges`, `mathblaster-nickname`
- Herní flow: Welcome → Kolo (10 příkladů, 6s timer) → Boss fight (5 příkladů, 4s timer, 6–9×6–9) → Výsledky
- Boss fight: `boss-bg` třída na `body`, pulzující červené pozadí, 2× body
- Gamifikace: 3 životy, combo ×2/×3, XP, levely 1–10, 6 odznaků
- Konfigurace: konstanty `TIMER_NORMAL`, `TIMER_BOSS`, `ROUND_SIZE`, `BOSS_SIZE`, `COMBO_2X`, `COMBO_3X` na začátku `<script>`
- Firestore rules: schéma Math Blaster přidáno do existujících rules (score + level, bez `total`)

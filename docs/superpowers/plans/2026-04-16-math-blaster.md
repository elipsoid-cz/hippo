# Math Blaster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vytvořit retro arcade vzdělávací hru v `math/multiply/index.html` v Hippo repozitáři pro procvičování násobilky s gamifikací (životy, combo, XP, levely, odznaky, Firebase leaderboard).

**Architecture:** Jeden self-contained `index.html` soubor (HTML + CSS + JS inline). JavaScript organizovaný do logických funkcí bez frameworků. Firebase Firestore pro leaderboard (stejný projekt `hippo-cz` jako Hippo Spelling Bee), localStorage pro XP/levely/odznaky.

**Tech Stack:** Vanilla JS, HTML5, CSS3, Firebase Firestore compat SDK v10.14.0 (dynamicky načtené), localStorage

---

## Soubory

| Soubor | Akce | Odpovědnost |
|--------|------|-------------|
| `math/multiply/index.html` | Vytvořit | Celá hra — HTML struktura, CSS styly, JS logika |

---

## Task 1: Kostra HTML + CSS základní layout

**Files:**
- Create: `math/multiply/index.html`

- [ ] **Krok 1: Vytvoř soubor s HTML kostrou a CSS**

Vytvoř `/Users/marekcais/Documents/Hippo/math/multiply/index.html`:

```html
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Math Blaster 👾</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0d0d1a;
      color: #fff;
      font-family: 'Courier New', Courier, monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 16px;
    }

    /* ── Shared ── */
    .screen { display: none; width: 100%; max-width: 380px; }
    .screen.active { display: flex; flex-direction: column; gap: 12px; }

    .neon-title {
      text-align: center;
      font-size: 2em;
      font-weight: bold;
      color: #ff6bff;
      text-shadow: 0 0 20px #ff6bff, 0 0 40px #ff6bff88;
      letter-spacing: 4px;
    }

    .subtitle {
      text-align: center;
      color: #888;
      font-size: 0.75em;
      letter-spacing: 2px;
    }

    .btn {
      padding: 14px;
      border: 2px solid #ff6bff;
      background: #1a0533;
      color: #ff6bff;
      font-family: inherit;
      font-size: 1em;
      font-weight: bold;
      letter-spacing: 2px;
      cursor: pointer;
      border-radius: 8px;
      text-shadow: 0 0 8px #ff6bff;
      box-shadow: 0 0 12px #ff6bff44;
      transition: background 0.15s, box-shadow 0.15s;
    }
    .btn:hover { background: #2a0a4a; box-shadow: 0 0 20px #ff6bff88; }

    .btn-cyan {
      border-color: #00ffff; color: #00ffff;
      background: #001a1a;
      text-shadow: 0 0 8px #00ffff;
      box-shadow: 0 0 12px #00ffff44;
    }
    .btn-cyan:hover { background: #002a2a; box-shadow: 0 0 20px #00ffff88; }

    /* ── Welcome screen ── */
    .nickname-row {
      display: flex;
      gap: 8px;
    }

    .nickname-input {
      flex: 1;
      padding: 12px;
      background: #111128;
      border: 2px solid #444;
      border-radius: 8px;
      color: #fff;
      font-family: inherit;
      font-size: 1em;
    }
    .nickname-input:focus { outline: none; border-color: #ff6bff; }

    .player-stats {
      background: #111128;
      border: 1px solid #ff6bff33;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stat-label { color: #888; font-size: 0.65em; letter-spacing: 1px; }
    .stat-value { color: #ff6bff; font-size: 1.1em; font-weight: bold; }

    /* ── Leaderboard ── */
    .leaderboard-box {
      background: #111128;
      border: 1px solid #ff6bff22;
      border-radius: 8px;
      padding: 12px;
    }
    .leaderboard-title {
      color: #ffff00;
      font-size: 0.7em;
      letter-spacing: 2px;
      margin-bottom: 8px;
      text-align: center;
    }
    .lb-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 0.8em;
      border-bottom: 1px solid #ffffff0a;
    }
    .lb-row:last-child { border-bottom: none; }
    .lb-row.me { color: #00ffff; }
    .lb-rank { width: 28px; color: #888; }
    .lb-name { flex: 1; }
    .lb-score { color: #ffff00; }
    .lb-empty { color: #555; font-size: 0.75em; text-align: center; padding: 8px 0; }

    /* ── Game screen ── */
    .hud {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .lives { font-size: 1.2em; letter-spacing: 2px; }

    .streak-display {
      color: #ff9900;
      font-size: 0.7em;
      letter-spacing: 1px;
    }

    .level-display {
      color: #ff6bff;
      font-size: 0.65em;
      letter-spacing: 1px;
    }

    .timer-bar-wrap {
      background: #1a1a3e;
      border-radius: 4px;
      height: 8px;
      overflow: hidden;
    }
    .timer-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.1s linear, background 0.3s;
      width: 100%;
    }

    .question-panel {
      background: #111128;
      border: 1px solid #ffffff11;
      border-radius: 10px;
      padding: 16px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .question-panel.boss-mode {
      border-color: #ff4444;
      box-shadow: 0 0 20px #ff444433;
      animation: boss-pulse 1s ease-in-out infinite alternate;
    }

    @keyframes boss-pulse {
      from { box-shadow: 0 0 10px #ff444433; }
      to { box-shadow: 0 0 30px #ff444466; }
    }

    .question-text {
      text-align: center;
      color: #00ffff;
      font-size: 2.8em;
      font-weight: bold;
      text-shadow: 0 0 15px #00ffff;
      letter-spacing: 4px;
    }

    .boss-label {
      text-align: center;
      color: #ff4444;
      font-size: 0.7em;
      letter-spacing: 3px;
      display: none;
    }
    .boss-mode .boss-label { display: block; }

    .answer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .answer-btn {
      padding: 16px 0;
      text-align: center;
      font-family: inherit;
      font-size: 1.8em;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid;
      background: #1a1a3e;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .answer-btn:active { transform: scale(0.96); }

    .answer-btn.color-0 { color: #ff6bff; border-color: #ff6bff; box-shadow: 0 0 8px #ff6bff33; }
    .answer-btn.color-1 { color: #00ffff; border-color: #00ffff; box-shadow: 0 0 8px #00ffff33; }
    .answer-btn.color-2 { color: #00ff88; border-color: #00ff88; box-shadow: 0 0 8px #00ff8833; background: #002a1a; }
    .answer-btn.color-3 { color: #ffff00; border-color: #ffff00; box-shadow: 0 0 8px #ffff0033; }

    .answer-btn.correct {
      background: #003322 !important;
      border-color: #00ff88 !important;
      box-shadow: 0 0 20px #00ff8877 !important;
    }
    .answer-btn.wrong {
      background: #330000 !important;
      border-color: #ff4444 !important;
      box-shadow: 0 0 20px #ff444477 !important;
    }
    .answer-btn:disabled { cursor: default; }

    .score-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.65em;
      letter-spacing: 1px;
    }
    .score-val { color: #ffff00; }
    .combo-val { color: #ff9900; }

    /* ── Flash overlay ── */
    .flash {
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 100;
    }
    .flash.green { background: #00ff8822; }
    .flash.red   { background: #ff444422; }
    .flash.show  { opacity: 1; }

    /* ── Score pop ── */
    .score-pop {
      position: fixed;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      font-size: 1.4em;
      pointer-events: none;
      z-index: 101;
      opacity: 0;
      transition: opacity 0.1s, transform 0.4s;
    }

    /* ── Result screen ── */
    .result-box {
      background: #111128;
      border: 1px solid #ff6bff22;
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .result-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85em;
    }
    .result-label { color: #888; }
    .result-value { color: #ffff00; font-weight: bold; }

    .levelup-banner {
      text-align: center;
      color: #ff6bff;
      font-size: 1.1em;
      text-shadow: 0 0 12px #ff6bff;
      letter-spacing: 2px;
      animation: levelup-flash 0.5s ease-in-out 3;
      display: none;
    }
    @keyframes levelup-flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }

    .badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }
    .badge-chip {
      background: #1a1a3e;
      border: 1px solid #ff6bff44;
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 0.75em;
      color: #ff6bff;
    }

    .xp-breakdown {
      background: #0d0d2a;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.7em;
      color: #888;
      line-height: 1.8;
    }
    .xp-line-value { color: #00ff88; }

    .btn-row {
      display: flex;
      gap: 8px;
    }
    .btn-row .btn { flex: 1; }

    /* ── Game over ── */
    .gameover-text {
      text-align: center;
      font-size: 3em;
      color: #ff4444;
      text-shadow: 0 0 20px #ff4444;
      letter-spacing: 4px;
    }
  </style>
</head>
<body>

  <!-- Flash overlay -->
  <div class="flash" id="flash"></div>

  <!-- ══════════════════════════════
       WELCOME SCREEN
  ══════════════════════════════ -->
  <div class="screen" id="screen-welcome">
    <div class="neon-title">👾 MATH<br>BLASTER</div>
    <div class="subtitle">PROCVIČUJ NÁSOBILKU</div>

    <div id="player-stats" class="player-stats">
      <div>
        <div class="stat-label">LEVEL</div>
        <div class="stat-value" id="stat-level">1</div>
      </div>
      <div style="text-align:center">
        <div class="stat-label">XP</div>
        <div class="stat-value" id="stat-xp">0</div>
      </div>
      <div style="text-align:right">
        <div class="stat-label">ODZNAKY</div>
        <div class="stat-value" id="stat-badges">0</div>
      </div>
    </div>

    <div class="nickname-row">
      <input type="text" id="nickname-input" class="nickname-input"
        placeholder="Tvoje jméno..." maxlength="15" autocomplete="off" />
    </div>

    <button class="btn" id="btn-start">▶ START</button>

    <div class="leaderboard-box">
      <div class="leaderboard-title">🏆 LEADERBOARD</div>
      <div id="leaderboard-welcome"></div>
    </div>
  </div>

  <!-- ══════════════════════════════
       GAME SCREEN
  ══════════════════════════════ -->
  <div class="screen" id="screen-game">
    <div class="hud">
      <div class="lives" id="lives-display">❤️❤️❤️</div>
      <div class="streak-display" id="streak-display"></div>
      <div class="level-display" id="level-display">LVL 1</div>
    </div>

    <div class="timer-bar-wrap">
      <div class="timer-bar" id="timer-bar"></div>
    </div>

    <div class="question-panel" id="question-panel">
      <div class="boss-label">👾 BOSS FIGHT</div>
      <div class="question-text" id="question-text">7 × 8 = ?</div>
      <div class="answer-grid" id="answer-grid">
        <!-- tlačítka generovány JS -->
      </div>
    </div>

    <div class="score-row">
      <span>SKÓRE: <span class="score-val" id="score-display">0</span></span>
      <span class="combo-val" id="combo-display"></span>
    </div>
  </div>

  <!-- ══════════════════════════════
       RESULT SCREEN
  ══════════════════════════════ -->
  <div class="screen" id="screen-result">
    <div class="neon-title" style="font-size:1.4em">VÝSLEDKY</div>

    <div class="levelup-banner" id="levelup-banner">⭐ LEVEL UP! ⭐</div>

    <div class="result-box" id="result-box">
      <div class="result-row">
        <span class="result-label">SKÓRE</span>
        <span class="result-value" id="res-score">0</span>
      </div>
      <div class="result-row">
        <span class="result-label">SPRÁVNĚ</span>
        <span class="result-value" id="res-correct">0</span>
      </div>
      <div class="result-row">
        <span class="result-label">ŠPATNĚ</span>
        <span class="result-value" id="res-wrong">0</span>
      </div>
      <div class="result-row">
        <span class="result-label">XP ZÍSKÁNO</span>
        <span class="result-value" id="res-xp">+0</span>
      </div>
    </div>

    <div class="xp-breakdown" id="xp-breakdown"></div>

    <div class="badges-row" id="new-badges"></div>

    <!-- Save score panel (generován JS) -->
    <div id="save-panel"></div>

    <div class="leaderboard-box">
      <div class="leaderboard-title">🏆 LEADERBOARD</div>
      <div id="leaderboard-result"></div>
    </div>

    <div class="btn-row">
      <button class="btn btn-cyan" id="btn-play-again">▶ ZNOVU</button>
      <button class="btn" id="btn-back-home">🏠 ÚVOD</button>
    </div>
  </div>

  <!-- ══════════════════════════════
       GAME OVER SCREEN
  ══════════════════════════════ -->
  <div class="screen" id="screen-gameover">
    <div class="gameover-text">💀<br>GAME<br>OVER</div>
    <div class="subtitle" id="gameover-score"></div>
    <div class="result-box" style="margin-top:8px">
      <div class="result-row">
        <span class="result-label">SKÓRE</span>
        <span class="result-value" id="go-score">0</span>
      </div>
      <div class="result-row">
        <span class="result-label">SPRÁVNĚ</span>
        <span class="result-value" id="go-correct">0</span>
      </div>
    </div>
    <!-- Save panel pro game over -->
    <div id="go-save-panel"></div>
    <div class="leaderboard-box">
      <div class="leaderboard-title">🏆 LEADERBOARD</div>
      <div id="leaderboard-gameover"></div>
    </div>
    <button class="btn" id="btn-go-home">🏠 ZPĚT NA ÚVOD</button>
  </div>

  <script>
    // JS bude doplněn v dalších krocích
  </script>
</body>
</html>
```

- [ ] **Krok 2: Otevři v prohlížeči a ověř základní layout**

```bash
open /Users/marekcais/Documents/Hippo/math/multiply/index.html
```

Očekávej: prázdná stránka s tmavým pozadím (žádná chyba v konzoli). Screeny nejsou viditelné (display:none).

- [ ] **Krok 3: Commit**

```bash
cd /Users/marekcais/Documents/Hippo
git add math/multiply/index.html
git commit -m "feat: math blaster – HTML kostra a CSS"
```

---

## Task 2: GameState, localStorage, utility funkce

**Files:**
- Modify: `math/multiply/index.html` — doplnit JS do `<script>` tagu

- [ ] **Krok 1: Přidej konstanty, GameState a localStorage funkce**

Nahraď `// JS bude doplněn v dalších krocích` tímto kódem:

```javascript
// ══════════════════════════
//  KONFIGURACE
// ══════════════════════════
var TIMER_NORMAL = 6;    // sekund na odpověď v normálním kole
var TIMER_BOSS   = 4;    // sekund na odpověď v boss fightu
var ROUND_SIZE   = 10;   // příkladů v normálním kole
var BOSS_SIZE    = 5;    // příkladů v boss fightu
var COMBO_2X     = 3;    // po kolika správných v sérii → ×2
var COMBO_3X     = 6;    // po kolika správných v sérii → ×3
var FAST_BONUS   = 5;    // bonus bodů za odpověď do 2 sekund
var BOSS_MULTIPLIER = 2; // násobič bodů v boss fightu

var XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
// XP_THRESHOLDS[i] = XP potřebné pro level i+1 (index 0 = level 1)

var BADGE_DEFS = [
  { id: 'first_round',   emoji: '🔥',       label: 'První krok',    desc: 'Dohrát první kolo' },
  { id: 'boss_killer',   emoji: '👾',       label: 'Boss Killer',   desc: 'Přežít první boss fight' },
  { id: 'speedster',     emoji: '⚡',       label: 'Rychlostřelec', desc: '5× rychlá odpověď v jednom kole' },
  { id: 'perfect_round', emoji: '💎',       label: 'Perfektní',     desc: 'Kolo bez jediné chyby' },
  { id: 'combo_master',  emoji: '🔥🔥🔥',   label: 'Kombo Master',  desc: 'Série 8+ v kuse' },
  { id: 'level5',        emoji: '🏆',       label: 'Level 5',       desc: 'Postoupit na level 5' },
];

// ══════════════════════════
//  GAME STATE
// ══════════════════════════
var state = {
  score: 0,
  lives: 3,
  streak: 0,        // aktuální série správných odpovědí
  maxStreak: 0,
  correct: 0,
  wrong: 0,
  xpEarned: 0,
  xpBase: 0,        // body za správné odpovědi
  xpCombo: 0,       // bonus za combo
  xpBoss: 0,        // bonus za boss
  fastAnswers: 0,   // počet rychlých odpovědí v aktuálním kole
  isBoss: false,
  questionIndex: 0, // kolikátý příklad v kole
  roundWrong: 0,    // chyby v aktuálním kole (pro perfect badge)
  usedPairs: [],    // páry použité v tomto kole
  newBadges: [],    // odznaky získané v této hře
};

// ══════════════════════════
//  LOCAL STORAGE
// ══════════════════════════
function loadProgress() {
  return {
    xp:      parseInt(localStorage.getItem('mathblaster-xp') || '0', 10),
    level:   parseInt(localStorage.getItem('mathblaster-level') || '1', 10),
    badges:  JSON.parse(localStorage.getItem('mathblaster-badges') || '[]'),
    nickname: localStorage.getItem('mathblaster-nickname') || '',
  };
}

function saveXP(xp, level) {
  localStorage.setItem('mathblaster-xp', String(xp));
  localStorage.setItem('mathblaster-level', String(level));
}

function saveNickname(nick) {
  localStorage.setItem('mathblaster-nickname', nick);
}

function saveBadge(id) {
  var badges = JSON.parse(localStorage.getItem('mathblaster-badges') || '[]');
  if (badges.indexOf(id) === -1) {
    badges.push(id);
    localStorage.setItem('mathblaster-badges', JSON.stringify(badges));
    return true; // nový odznak
  }
  return false;
}

// ══════════════════════════
//  XP + LEVELY
// ══════════════════════════
function xpToLevel(xp) {
  var level = 1;
  for (var i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 10);
}

function xpForNextLevel(level) {
  return XP_THRESHOLDS[Math.min(level, 9)]; // XP potřebné pro příští level
}

// ══════════════════════════
//  COMBO MULTIPLIER
// ══════════════════════════
function comboMultiplier(streak) {
  if (streak >= COMBO_3X) return 3;
  if (streak >= COMBO_2X) return 2;
  return 1;
}
```

- [ ] **Krok 2: Otevři v prohlížeči, zkontroluj konzoli**

```bash
open /Users/marekcais/Documents/Hippo/math/multiply/index.html
```

V DevTools konzoli nesmí být žádná chyba. Ověř v konzoli:
```javascript
loadProgress() // musí vrátit { xp:0, level:1, badges:[], nickname:'' }
xpToLevel(0)   // → 1
xpToLevel(100) // → 2
xpToLevel(300) // → 3
comboMultiplier(0) // → 1
comboMultiplier(3) // → 2
comboMultiplier(6) // → 3
```

- [ ] **Krok 3: Commit**

```bash
cd /Users/marekcais/Documents/Hippo
git add math/multiply/index.html
git commit -m "feat: math blaster – game state, localStorage, XP/levely"
```

---

## Task 3: Generování otázek a distractorů

**Files:**
- Modify: `math/multiply/index.html`

- [ ] **Krok 1: Přidej generateQuestion() za předchozí kód**

```javascript
// ══════════════════════════
//  GENEROVÁNÍ OTÁZEK
// ══════════════════════════

// Vrátí nový unikátní pár [a, b] pro toto kolo (nezopakuje se)
function randomPair() {
  var attempts = 0;
  while (attempts < 200) {
    var a = Math.floor(Math.random() * 8) + 2; // 2–9
    var b = Math.floor(Math.random() * 8) + 2; // 2–9
    var key = a + 'x' + b;
    var keyRev = b + 'x' + a;
    if (state.usedPairs.indexOf(key) === -1 && state.usedPairs.indexOf(keyRev) === -1) {
      state.usedPairs.push(key);
      return [a, b];
    }
    attempts++;
  }
  // fallback: resetuj použité páry (nastane jen po velmi mnoha kolech)
  state.usedPairs = [];
  var a = Math.floor(Math.random() * 8) + 2;
  var b = Math.floor(Math.random() * 8) + 2;
  state.usedPairs.push(a + 'x' + b);
  return [a, b];
}

// Vygeneruje 4 možnosti: 1 správná + 3 distractory
function generateDistractors(a, b) {
  var correct = a * b;
  var options = [correct];

  // Distractor 1: blízký (correct ± a nebo b)
  var close = correct + (Math.random() < 0.5 ? a : b) * (Math.random() < 0.5 ? 1 : -1);
  if (close !== correct && close > 0) options.push(close);

  // Distractor 2: jiný násobek v tabulce
  var tries = 0;
  while (options.length < 3 && tries < 50) {
    var x = Math.floor(Math.random() * 8) + 2;
    var y = Math.floor(Math.random() * 8) + 2;
    var val = x * y;
    if (options.indexOf(val) === -1) options.push(val);
    tries++;
  }

  // Distractor 3: věrohodné číslo mimo tabulku nebo jiný násobek
  tries = 0;
  while (options.length < 4 && tries < 100) {
    var base = correct + (Math.floor(Math.random() * 20) - 10);
    if (base > 0 && options.indexOf(base) === -1) options.push(base);
    tries++;
  }

  // Promíchej
  for (var i = options.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
  }

  return options;
}

// Vrátí aktuální otázku jako objekt { a, b, correct, options }
function generateQuestion() {
  var pair = randomPair();
  var a = pair[0], b = pair[1];
  var options = generateDistractors(a, b);
  return { a: a, b: b, correct: a * b, options: options };
}
```

- [ ] **Krok 2: Ověř v konzoli prohlížeče**

```javascript
// Spusť několikrát — každý výsledek musí mít 4 unikátní možnosti
// a správná odpověď musí být mezi nimi
var q = generateQuestion();
console.log(q.a + ' × ' + q.b + ' = ' + q.correct);
console.log('Options:', q.options);
console.log('Correct in options:', q.options.indexOf(q.correct) !== -1); // musí být true
console.log('All unique:', new Set(q.options).size === 4); // musí být true
```

- [ ] **Krok 3: Commit**

```bash
cd /Users/marekcais/Documents/Hippo
git add math/multiply/index.html
git commit -m "feat: math blaster – generování otázek a distractorů"
```

---

## Task 4: Herní logika — timer, handleAnswer, flow

**Files:**
- Modify: `math/multiply/index.html`

- [ ] **Krok 1: Přidej DOM reference, timer a herní flow**

```javascript
// ══════════════════════════
//  DOM REFERENCE
// ══════════════════════════
var dom = {
  screens: {
    welcome:  document.getElementById('screen-welcome'),
    game:     document.getElementById('screen-game'),
    result:   document.getElementById('screen-result'),
    gameover: document.getElementById('screen-gameover'),
  },
  livesDisplay:    document.getElementById('lives-display'),
  streakDisplay:   document.getElementById('streak-display'),
  levelDisplay:    document.getElementById('level-display'),
  timerBar:        document.getElementById('timer-bar'),
  questionPanel:   document.getElementById('question-panel'),
  questionText:    document.getElementById('question-text'),
  answerGrid:      document.getElementById('answer-grid'),
  scoreDisplay:    document.getElementById('score-display'),
  comboDisplay:    document.getElementById('combo-display'),
  flash:           document.getElementById('flash'),
};

// ══════════════════════════
//  SCREEN MANAGEMENT
// ══════════════════════════
function showScreen(name) {
  Object.keys(dom.screens).forEach(function(k) {
    dom.screens[k].classList.remove('active');
  });
  dom.screens[name].classList.add('active');
}

// ══════════════════════════
//  FLASH ANIMACE
// ══════════════════════════
function flashScreen(color) {
  dom.flash.className = 'flash ' + color;
  dom.flash.classList.add('show');
  setTimeout(function() { dom.flash.classList.remove('show'); }, 250);
}

function showScorePop(value, correct) {
  var el = document.createElement('div');
  el.className = 'score-pop';
  el.textContent = (correct ? '+' : '') + value;
  el.style.color = correct ? '#00ff88' : '#ff4444';
  el.style.left = '50%';
  el.style.top = '45%';
  el.style.transform = 'translate(-50%, -50%)';
  document.body.appendChild(el);
  requestAnimationFrame(function() {
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, -80%)';
    setTimeout(function() {
      el.style.opacity = '0';
      setTimeout(function() { el.remove(); }, 200);
    }, 500);
  });
}

// ══════════════════════════
//  TIMER
// ══════════════════════════
var timerInterval = null;
var timerRemaining = 0;
var timerTotal = 0;
var questionStartTime = 0;

function startTimer(seconds) {
  clearInterval(timerInterval);
  timerRemaining = seconds;
  timerTotal = seconds;
  questionStartTime = Date.now();
  updateTimerBar();
  timerInterval = setInterval(function() {
    timerRemaining -= 0.1;
    if (timerRemaining <= 0) {
      timerRemaining = 0;
      updateTimerBar();
      clearInterval(timerInterval);
      handleAnswer(null); // timeout = špatná odpověď
    } else {
      updateTimerBar();
    }
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimerBar() {
  var pct = Math.max(0, timerRemaining / timerTotal) * 100;
  dom.timerBar.style.width = pct + '%';
  // barva: zelená → žlutá → červená
  if (pct > 60) {
    dom.timerBar.style.background = 'linear-gradient(90deg, #00ff88, #00ffaa)';
  } else if (pct > 30) {
    dom.timerBar.style.background = 'linear-gradient(90deg, #ffff00, #ffaa00)';
  } else {
    dom.timerBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6600)';
  }
}

// ══════════════════════════
//  AKTUÁLNÍ OTÁZKA
// ══════════════════════════
var currentQuestion = null;

function renderQuestion() {
  currentQuestion = generateQuestion();
  dom.questionText.textContent = currentQuestion.a + ' × ' + currentQuestion.b + ' = ?';

  dom.answerGrid.innerHTML = '';
  var colors = ['color-0', 'color-1', 'color-2', 'color-3'];
  currentQuestion.options.forEach(function(opt, i) {
    var btn = document.createElement('button');
    btn.className = 'answer-btn ' + colors[i];
    btn.textContent = opt;
    btn.onclick = function() { handleAnswer(opt); };
    dom.answerGrid.appendChild(btn);
  });

  var timerSeconds = state.isBoss ? TIMER_BOSS : TIMER_NORMAL;
  startTimer(timerSeconds);
}

function updateHUD() {
  // Životy
  var heartsArr = [];
  for (var i = 0; i < 3; i++) {
    heartsArr.push(i < state.lives ? '❤️' : '🖤');
  }
  dom.livesDisplay.textContent = heartsArr.join('');

  // Série
  if (state.streak >= COMBO_2X) {
    var mult = comboMultiplier(state.streak);
    dom.streakDisplay.textContent = '🔥 SÉRIE ×' + state.streak + ' [×' + mult + ' COMBO]';
  } else if (state.streak > 0) {
    dom.streakDisplay.textContent = '🔥 SÉRIE ×' + state.streak;
  } else {
    dom.streakDisplay.textContent = '';
  }

  // Level
  var progress = loadProgress();
  dom.levelDisplay.textContent = 'LVL ' + progress.level;

  // Skóre
  dom.scoreDisplay.textContent = state.score;

  // Combo label
  var mult2 = comboMultiplier(state.streak);
  dom.comboDisplay.textContent = mult2 > 1 ? '×' + mult2 + ' COMBO BONUS' : '';
}

// ══════════════════════════
//  HANDLE ANSWER
// ══════════════════════════
function handleAnswer(chosen) {
  stopTimer();

  var elapsed = (Date.now() - questionStartTime) / 1000;
  var isCorrect = chosen !== null && chosen === currentQuestion.correct;
  var buttons = dom.answerGrid.querySelectorAll('.answer-btn');

  // Disable tlačítek + vizuální feedback
  buttons.forEach(function(btn) {
    btn.disabled = true;
    if (parseInt(btn.textContent) === currentQuestion.correct) {
      btn.classList.add('correct');
    } else if (parseInt(btn.textContent) === chosen) {
      btn.classList.add('wrong');
    }
  });

  if (isCorrect) {
    var mult = comboMultiplier(state.streak) * (state.isBoss ? BOSS_MULTIPLIER : 1);
    var points = 10 * mult;
    var fast = elapsed < 2 ? FAST_BONUS : 0;
    var total = points + fast;

    state.score += total;
    state.streak++;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.correct++;
    state.xpBase += 10;
    if (fast) state.xpBase += FAST_BONUS;
    if (state.isBoss) state.xpBoss += points;
    else if (mult > 1) state.xpCombo += (mult - 1) * 10;
    if (elapsed < 2) state.fastAnswers++;

    flashScreen('green');
    showScorePop('+' + total, true);
  } else {
    state.lives--;
    state.streak = 0;
    state.wrong++;
    state.roundWrong++;
    flashScreen('red');
    showScorePop('-1 ❤️', false);
  }

  updateHUD();

  // Krátká pauza pak další otázka nebo konec kola
  setTimeout(function() {
    if (state.lives <= 0) {
      gameOver();
      return;
    }
    state.questionIndex++;
    var roundSize = state.isBoss ? BOSS_SIZE : ROUND_SIZE;
    if (state.questionIndex >= roundSize) {
      if (state.isBoss) {
        endBoss();
      } else {
        endRound();
      }
    } else {
      renderQuestion();
    }
  }, 600);
}
```

- [ ] **Krok 2: Ověř v prohlížeči (konzole bez chyb)**

```bash
open /Users/marekcais/Documents/Hippo/math/multiply/index.html
```

V konzoli nesmí být žádná chyba.

- [ ] **Krok 3: Commit**

```bash
cd /Users/marekcais/Documents/Hippo
git add math/multiply/index.html
git commit -m "feat: math blaster – timer, handleAnswer, HUD"
```

---

## Task 5: Herní flow — start, kola, boss, game over, výsledky

**Files:**
- Modify: `math/multiply/index.html`

- [ ] **Krok 1: Přidej flow funkce**

```javascript
// ══════════════════════════
//  GAME FLOW
// ══════════════════════════
function resetState() {
  state.score = 0;
  state.lives = 3;
  state.streak = 0;
  state.maxStreak = 0;
  state.correct = 0;
  state.wrong = 0;
  state.xpEarned = 0;
  state.xpBase = 0;
  state.xpCombo = 0;
  state.xpBoss = 0;
  state.fastAnswers = 0;
  state.isBoss = false;
  state.questionIndex = 0;
  state.roundWrong = 0;
  state.usedPairs = [];
  state.newBadges = [];
}

function startGame() {
  var nick = document.getElementById('nickname-input').value.trim();
  if (!nick) { alert('Zadej své jméno!'); return; }
  saveNickname(nick);
  resetState();
  dom.questionPanel.classList.remove('boss-mode');
  showScreen('game');
  updateHUD();
  renderQuestion();
}

function endRound() {
  // Zkontroluj badge za první kolo
  var earnedFirstRound = saveBadge('first_round');
  if (earnedFirstRound) state.newBadges.push('first_round');

  // Perfect round badge
  if (state.roundWrong === 0) {
    var earnedPerfect = saveBadge('perfect_round');
    if (earnedPerfect) state.newBadges.push('perfect_round');
  }

  // Speedster badge (5× rychlá odpověď v kole)
  if (state.fastAnswers >= 5) {
    var earnedSpeed = saveBadge('speedster');
    if (earnedSpeed) state.newBadges.push('speedster');
  }

  // Přejdi do boss fightu
  state.isBoss = true;
  state.questionIndex = 0;
  state.roundWrong = 0;
  state.fastAnswers = 0;
  dom.questionPanel.classList.add('boss-mode');
  renderQuestion();
}

function endBoss() {
  // Boss fight přežit
  var earnedBoss = saveBadge('boss_killer');
  if (earnedBoss) state.newBadges.push('boss_killer');

  // Combo master badge
  if (state.maxStreak >= 8) {
    var earnedCombo = saveBadge('combo_master');
    if (earnedCombo) state.newBadges.push('combo_master');
  }

  // Ukonči hru a ukaž výsledky
  showResultScreen();
}

function gameOver() {
  stopTimer();
  applyXP();
  showScreen('gameover');
  document.getElementById('go-score').textContent = state.score;
  document.getElementById('go-correct').textContent = state.correct + ' / ' + (state.correct + state.wrong);
  renderSavePanelInto('go-save-panel', 'leaderboard-gameover');
  loadLeaderboard(function(entries) {
    renderLeaderboard(entries, loadProgress().nickname, 'leaderboard-gameover');
  });
}

function applyXP() {
  state.xpEarned = Math.round((state.xpBase + state.xpCombo + state.xpBoss) / 10);
  var progress = loadProgress();
  var oldLevel = progress.level;
  var newXP = progress.xp + state.xpEarned;
  var newLevel = xpToLevel(newXP);
  saveXP(newXP, newLevel);
  // Level 5 badge
  if (newLevel >= 5) {
    var earnedL5 = saveBadge('level5');
    if (earnedL5) state.newBadges.push('level5');
  }
  return { oldLevel: oldLevel, newLevel: newLevel };
}

function showResultScreen() {
  var levelResult = applyXP();
  var progress = loadProgress();

  showScreen('result');

  document.getElementById('res-score').textContent   = state.score;
  document.getElementById('res-correct').textContent = state.correct + ' / ' + (state.correct + state.wrong);
  document.getElementById('res-wrong').textContent   = state.wrong;
  document.getElementById('res-xp').textContent      = '+' + state.xpEarned + ' XP';

  // XP breakdown
  var breakdown = document.getElementById('xp-breakdown');
  breakdown.innerHTML =
    'Za správné odpovědi: <span class="xp-line-value">+' + state.xpBase + ' bodů</span><br>' +
    (state.xpCombo ? 'Combo bonus: <span class="xp-line-value">+' + state.xpCombo + ' bodů</span><br>' : '') +
    (state.xpBoss  ? 'Boss bonus: <span class="xp-line-value">+' + state.xpBoss  + ' bodů</span><br>' : '') +
    '→ Celkem XP: <span class="xp-line-value">+' + state.xpEarned + ' XP</span> (celkem: ' + progress.xp + ')';

  // Level up
  var levelupBanner = document.getElementById('levelup-banner');
  if (levelResult.newLevel > levelResult.oldLevel) {
    levelupBanner.textContent = '⭐ LEVEL UP! LEVEL ' + levelResult.newLevel + ' ⭐';
    levelupBanner.style.display = 'block';
  } else {
    levelupBanner.style.display = 'none';
  }

  // Nové odznaky
  var badgesRow = document.getElementById('new-badges');
  badgesRow.innerHTML = '';
  if (state.newBadges.length > 0) {
    var title = document.createElement('div');
    title.style.cssText = 'width:100%;text-align:center;color:#ffff00;font-size:0.7em;letter-spacing:2px;margin-bottom:4px;';
    title.textContent = 'NOVÉ ODZNAKY';
    badgesRow.appendChild(title);
    state.newBadges.forEach(function(id) {
      var def = BADGE_DEFS.find(function(d) { return d.id === id; });
      if (def) {
        var chip = document.createElement('div');
        chip.className = 'badge-chip';
        chip.textContent = def.emoji + ' ' + def.label;
        badgesRow.appendChild(chip);
      }
    });
  }

  renderSavePanelInto('save-panel', 'leaderboard-result');
  loadLeaderboard(function(entries) {
    renderLeaderboard(entries, loadProgress().nickname, 'leaderboard-result');
  });
}

// ══════════════════════════
//  TLAČÍTKA
// ══════════════════════════
document.getElementById('btn-start').onclick = startGame;
document.getElementById('nickname-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') startGame();
});
document.getElementById('btn-play-again').onclick = function() {
  resetState();
  dom.questionPanel.classList.remove('boss-mode');
  showScreen('game');
  updateHUD();
  renderQuestion();
};
document.getElementById('btn-back-home').onclick = function() { showScreen('welcome'); loadWelcomeScreen(); };
document.getElementById('btn-go-home').onclick   = function() { showScreen('welcome'); loadWelcomeScreen(); };
```

- [ ] **Krok 2: Otevři v prohlížeči, klikni START**

```bash
open /Users/marekcais/Documents/Hippo/math/multiply/index.html
```

Ověř:
- Welcome screen se zobrazí
- Po kliknutí START (bez jména) se zobrazí alert
- Po zadání jména a kliknutí START se zobrazí herní obrazovka s příkladem a 4 tlačítky
- Timer bar se pohybuje

- [ ] **Krok 3: Commit**

```bash
cd /Users/marekcais/Documents/Hippo
git add math/multiply/index.html
git commit -m "feat: math blaster – herní flow, kola, boss, výsledky"
```

---

## Task 6: Welcome screen + Firebase Leaderboard

**Files:**
- Modify: `math/multiply/index.html`

- [ ] **Krok 1: Přidej Firebase config, loadFirebase, leaderboard funkce**

```javascript
// ══════════════════════════
//  FIREBASE
// ══════════════════════════
var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyB-prvqJmm0Jdt4kQAA-f5BQXmaC8VGP44",
  authDomain:        "hippo-cz.firebaseapp.com",
  projectId:         "hippo-cz",
  storageBucket:     "hippo-cz.firebasestorage.app",
  messagingSenderId: "881228649401",
  appId:             "1:881228649401:web:2d81c97045155687a51c68"
};

var COLLECTION = 'leaderboards/math-multiply/scores';
var db = null;
var firebaseReady = false;

function loadFirebaseSDK(callback) {
  if (firebaseReady) { callback(); return; }
  var s1 = document.createElement('script');
  s1.src = 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js';
  s1.onload = function() {
    var s2 = document.createElement('script');
    s2.src = 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js';
    s2.onload = function() {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      firebaseReady = true;
      callback();
    };
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}

function loadLeaderboard(callback) {
  loadFirebaseSDK(function() {
    db.collection(COLLECTION)
      .get()
      .then(function(snap) {
        var entries = [];
        snap.forEach(function(doc) { entries.push(doc.data()); });
        entries.sort(function(a, b) {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(a.date) - new Date(b.date);
        });
        callback(entries);
      })
      .catch(function(err) {
        console.error('[MathBlaster] loadLeaderboard error:', err);
        callback([]);
      });
  });
}

function submitScore(nickname, callback) {
  if (!firebaseReady || state.score <= 0) { if (callback) callback(); return; }
  var progress = loadProgress();
  var key = nickname.toLowerCase().replace(/[^a-z0-9]/g, '');
  var ref = db.collection(COLLECTION).doc(key);
  ref.get().then(function(doc) {
    var existing = doc.exists ? doc.data() : null;
    if (!existing || state.score > (existing.score || 0)) {
      return ref.set({
        nickname: nickname,
        score:    state.score,
        level:    progress.level,
        date:     new Date().toISOString()
      });
    }
  })
  .then(function() { if (callback) callback(); })
  .catch(function(err) {
    console.error('[MathBlaster] submitScore error:', err);
    if (callback) callback();
  });
}

function renderLeaderboard(entries, currentNick, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (!entries || entries.length === 0) {
    container.innerHTML = '<div class="lb-empty">Zatím žádné skóre — buď první!</div>';
    return;
  }
  var medals = ['🥇', '🥈', '🥉'];
  entries.slice(0, 10).forEach(function(entry, i) {
    var row = document.createElement('div');
    row.className = 'lb-row' + (currentNick && entry.nickname.toLowerCase() === currentNick.toLowerCase() ? ' me' : '');
    row.innerHTML =
      '<span class="lb-rank">' + (medals[i] || (i + 1) + '.') + '</span>' +
      '<span class="lb-name">' + entry.nickname + '</span>' +
      '<span class="lb-score">' + entry.score + '</span>';
    container.appendChild(row);
  });
}

function renderSavePanelInto(panelId, lbContainerId) {
  var panel = document.getElementById(panelId);
  if (!panel) return;
  panel.innerHTML = '';
  if (state.score <= 0) return;

  var progress = loadProgress();
  var savedNick = progress.nickname;

  panel.innerHTML =
    '<div style="background:#111128;border:1px solid #ff6bff33;border-radius:8px;padding:12px;margin-bottom:8px;">' +
    '<div style="color:#888;font-size:0.7em;letter-spacing:2px;margin-bottom:8px;">ULOŽIT SKÓRE?</div>' +
    '<div style="display:flex;gap:8px;">' +
    '<input type="text" id="save-nick-' + panelId + '" class="nickname-input" placeholder="Tvoje jméno..." maxlength="15" value="' + savedNick.replace(/"/g, '&quot;') + '" />' +
    '<button class="btn" id="save-btn-' + panelId + '" style="flex:0 0 auto;padding:12px 16px;">Uložit</button>' +
    '</div></div>';

  document.getElementById('save-btn-' + panelId).onclick = function() {
    var nick = document.getElementById('save-nick-' + panelId).value.trim();
    if (!nick) return;
    saveNickname(nick);
    submitScore(nick, function() {
      panel.innerHTML = '<div style="color:#00ff88;text-align:center;font-size:0.8em;letter-spacing:2px;padding:8px;">✓ SKÓRE ULOŽENO</div>';
      loadLeaderboard(function(entries) {
        renderLeaderboard(entries, nick, lbContainerId);
      });
    });
  };
}

// ══════════════════════════
//  WELCOME SCREEN INIT
// ══════════════════════════
function loadWelcomeScreen() {
  var progress = loadProgress();
  document.getElementById('stat-level').textContent  = progress.level;
  document.getElementById('stat-xp').textContent     = progress.xp;
  document.getElementById('stat-badges').textContent = progress.badges.length + ' / ' + BADGE_DEFS.length;
  document.getElementById('nickname-input').value    = progress.nickname;

  loadLeaderboard(function(entries) {
    renderLeaderboard(entries, progress.nickname, 'leaderboard-welcome');
  });
}

// Spusť welcome screen při načtení stránky
loadWelcomeScreen();
showScreen('welcome');
```

- [ ] **Krok 2: Ověř plný flow v prohlížeči**

```bash
open /Users/marekcais/Documents/Hippo/math/multiply/index.html
```

Ověř:
1. Welcome screen zobrazí level, XP, odznaky
2. Leaderboard se načte (nebo zobrazí "Zatím žádné skóre")
3. Zahraj celé kolo (10 příkladů) — boss fight se automaticky spustí
4. Přežij boss fight — zobrazí se výsledková obrazovka
5. Klikni "Uložit" — skóre se uloží do Firebase
6. Zkontroluj Firebase Console, že dokument existuje v `leaderboards/math-multiply/scores/`
7. Přijdi o všechny životy — game over screen se zobrazí
8. Tlačítko "ZPĚT NA ÚVOD" funguje

- [ ] **Krok 3: Commit**

```bash
cd /Users/marekcais/Documents/Hippo
git add math/multiply/index.html
git commit -m "feat: math blaster – Firebase leaderboard, welcome screen, save score"
```

---

## Task 7: Firestore security rules

**Files:**
- Firebase Console (ruční krok)

- [ ] **Krok 1: Otevři Firebase Console a zkontroluj Firestore rules**

Jdi na https://console.firebase.google.com → projekt `hippo-cz` → Firestore Database → Rules.

Existující pravidla musí přidat support pro `math-multiply` schéma. Přidej nebo uprav rules tak, aby umožňovaly zápis dokumentu s poli `{ nickname, score, level, date }`:

```
// Přidej do existujících rules pod match /leaderboards/{gameId}/scores/{nick}:
allow write: if
  // Spelling Bee schéma (existující)
  (request.resource.data.keys().hasAll(['nickname','score','total','date']) &&
   request.resource.data.score is int && request.resource.data.score >= 0 &&
   request.resource.data.total is int && request.resource.data.total > 0)
  ||
  // Tournament mastery schéma (existující)
  (request.resource.data.keys().hasAll(['nickname','masteredCount','totalWords','date']) &&
   request.resource.data.masteredCount is int && request.resource.data.masteredCount >= 0)
  ||
  // Math Blaster schéma (nové)
  (request.resource.data.keys().hasAll(['nickname','score','level','date']) &&
   request.resource.data.score is int && request.resource.data.score >= 0 &&
   request.resource.data.level is int && request.resource.data.level >= 1);
```

- [ ] **Krok 2: Zkontroluj save score znovu**

Po uložení rules zahraj hru a uložit skóre. Zkontroluj v konzoli prohlížeče, že `submitScore` nevrátí `PERMISSION_DENIED`.

---

## Task 8: Přidání odkazu na homepage Hippo

**Files:**
- Modify: `index.html` (kořen Hippo repozitáře)

- [ ] **Krok 1: Přidej kartu Math Blaster na homepage**

Najdi v `/Users/marekcais/Documents/Hippo/index.html` sekci s kartami (kde jsou Spelling Bee karty). Přidej kartu pro Math Blaster. Vzor karty ze stávajícího kódu — přidej ji jako statickou kartu (ne dynamicky generovanou z words.js):

```html
<a href="math/multiply/" class="exercise-card">
  <div class="card-icon">👾</div>
  <div class="card-content">
    <h3>Math Blaster</h3>
    <p>Procvičuj násobilku — retro arcade hra s životy, combem a leaderboardem</p>
    <span class="card-badge new-badge">NOVÉ</span>
  </div>
</a>
```

- [ ] **Krok 2: Ověř, že karta se zobrazí na homepage**

```bash
open /Users/marekcais/Documents/Hippo/index.html
```

Karta Math Blaster musí být viditelná a kliknutí musí otevřít hru.

- [ ] **Krok 3: Zvyš verzi v index.html a commitni**

Najdi v `/Users/marekcais/Documents/Hippo/index.html` řádek s verzí (formát `vX.Y.Z`). Zvyš minor verzi (např. `v1.10.6` → `v1.11.0`).

```bash
cd /Users/marekcais/Documents/Hippo
git add index.html math/multiply/index.html
git commit -m "feat: přidán Math Blaster – násobilková hra s leaderboardem"
```

---

## Self-Review

**Spec coverage:**
- ✅ Welcome screen (nickname, level, XP, leaderboard, START) → Task 6
- ✅ Herní kolo 10 příkladů, timer bar, životy → Task 4+5
- ✅ Výběr ze 4 možností 2×2, distractors → Task 3+4
- ✅ Boss fight (5 příkladů, 4s timer, červený vizuál) → Task 5
- ✅ Combo ×2/×3 → Task 4
- ✅ Fast answer bonus → Task 4
- ✅ XP, levely, level-up banner → Task 5+6
- ✅ Odznaky (6 typů) → Task 5
- ✅ Výsledková obrazovka (skóre, XP breakdown, odznaky, leaderboard) → Task 5+6
- ✅ Game over screen → Task 5+6
- ✅ Firebase leaderboard (submit + load + render) → Task 6+7
- ✅ localStorage (XP, level, badges, nickname) → Task 2
- ✅ Mobilní layout (max-width 380px, centrovaný) → Task 1
- ✅ Retro arcade vizuál (neonové barvy, glow, tmavé pozadí) → Task 1
- ✅ Homepage odkaz → Task 8
- ✅ Firestore rules → Task 7

**Placeholder scan:** Žádné TBD/TODO.

**Type consistency:**
- `loadProgress()` → vrací `{ xp, level, badges, nickname }` — použito v Task 2, 5, 6 konzistentně
- `state.xpBase/xpCombo/xpBoss` → nastaveno v handleAnswer (Task 4), čteno v applyXP (Task 5)
- `COLLECTION = 'leaderboards/math-multiply/scores'` → použito v Task 6 konzistentně
- `renderLeaderboard(entries, nick, containerId)` → definováno v Task 6, voláno ze Task 5+6 konzistentně
- `renderSavePanelInto(panelId, lbContainerId)` → definováno v Task 6, voláno ze Task 5 konzistentně

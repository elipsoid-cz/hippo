# Math Blaster Sound System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Web Audio API synthesized sound effects (correct, wrong, boss heartbeat) and a persistent mute toggle to Math Blaster.

**Architecture:** All changes are in a single file (`math/multiply/index.html`). A `SoundEngine` singleton holds an `AudioContext` (lazily initialized on first user gesture) and exposes play/stop functions. All play functions check a `soundEnabled` flag before doing anything. The mute toggle is a fixed-position button that persists state in localStorage.

**Tech Stack:** Vanilla JS, Web Audio API, localStorage, HTML/CSS — no build step, no external files.

---

### Task 1: Add mute toggle button to HTML + CSS

**Files:**
- Modify: `math/multiply/index.html` (HTML body before `<script>`, and `<style>` block)

This adds the visible toggle button and its styles. The button sits above all screens, always visible.

- [ ] **Step 1: Add CSS for the mute toggle button**

Find the closing `</style>` tag (around line 490, just before `<script>`) and insert this CSS block before it:

```css
    /* ── Sound toggle ── */
    #sound-toggle {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 9999;
      background: #111128cc;
      border: 1px solid #ff6bff44;
      border-radius: 6px;
      color: #ff6bff;
      font-size: 1.1em;
      padding: 6px 10px;
      cursor: pointer;
      font-family: inherit;
      line-height: 1;
    }
    #sound-toggle:hover { background: #1a0533cc; border-color: #ff6bff88; }
```

- [ ] **Step 2: Add the button to the HTML body**

Find `<body>` opening tag and add the button immediately after it (before the first `<div id="screen-welcome"...>`):

```html
  <button id="sound-toggle" title="Zvuk zapnout/vypnout">🔊</button>
```

- [ ] **Step 3: Verify HTML structure**

Open `http://localhost:3000/math/multiply/` in the browser. You should see a small `🔊` button in the top-right corner, visible over the welcome screen. No JS yet so clicking it does nothing.

- [ ] **Step 4: Commit**

```bash
git add math/multiply/index.html
git commit -m "feat: math blaster – přidat tlačítko zvuku (HTML + CSS)"
```

---

### Task 2: Add SoundEngine singleton

**Files:**
- Modify: `math/multiply/index.html` (inside `<script>` block, right after the `KONFIGURACE` section)

- [ ] **Step 1: Insert SoundEngine after the config block**

Find the line `var BOSS_MULTIPLIER = 2;` (around line 502) and insert the following block immediately after it (before `var XP_THRESHOLDS`):

```js
// ══════════════════════════
//  SOUND ENGINE
// ══════════════════════════
var soundEnabled = (localStorage.getItem('mathblaster-sound') !== 'false');
var _audioCtx = null;
var _heartbeatInterval = null;

function ensureAudioContext() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

var SoundEngine = {
  playCorrect: function() {
    if (!soundEnabled) return;
    var ctx = ensureAudioContext();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  },

  playWrong: function() {
    if (!soundEnabled) return;
    var ctx = ensureAudioContext();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },

  playBossTick: function() {
    if (!soundEnabled) return;
    var ctx = ensureAudioContext();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  },

  playBossHeartbeat: function() {
    SoundEngine.stopBossHeartbeat();
    SoundEngine.playBossTick();
    _heartbeatInterval = setInterval(function() {
      SoundEngine.playBossTick();
    }, 700);
  },

  stopBossHeartbeat: function() {
    if (_heartbeatInterval) {
      clearInterval(_heartbeatInterval);
      _heartbeatInterval = null;
    }
  }
};
```

- [ ] **Step 2: Verify no syntax errors**

Open browser console at `http://localhost:3000/math/multiply/`. There should be zero errors in the console. The game loads normally.

- [ ] **Step 3: Commit**

```bash
git add math/multiply/index.html
git commit -m "feat: math blaster – SoundEngine (Web Audio API synth zvuky)"
```

---

### Task 3: Wire up the mute toggle button

**Files:**
- Modify: `math/multiply/index.html` (inside `<script>` block, at the very end before the closing `</script>`)

- [ ] **Step 1: Add toggle init code at the bottom of the script**

Find the last two lines of the script block:
```js
loadWelcomeScreen();
showScreen('welcome');
```

Insert the following block immediately before them:

```js
// ── Sound toggle init ──
(function() {
  var btn = document.getElementById('sound-toggle');
  btn.textContent = soundEnabled ? '🔊' : '🔇';
  btn.addEventListener('click', function() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('mathblaster-sound', String(soundEnabled));
    btn.textContent = soundEnabled ? '🔊' : '🔇';
    if (!soundEnabled) SoundEngine.stopBossHeartbeat();
    ensureAudioContext(); // unblock audio context on first interaction
  });
})();
```

- [ ] **Step 2: Verify toggle works**

Open `http://localhost:3000/math/multiply/`. Click `🔊` — it should switch to `🔇`. Reload the page — it should still show `🔇` (localStorage persisted). Click again to restore `🔊`.

- [ ] **Step 3: Commit**

```bash
git add math/multiply/index.html
git commit -m "feat: math blaster – toggle zvuku (localStorage, persistentní stav)"
```

---

### Task 4: Wire correct/wrong sounds into handleAnswer()

**Files:**
- Modify: `math/multiply/index.html` — `handleAnswer()` function (around line 827)

- [ ] **Step 1: Add sound calls in handleAnswer()**

Find this block inside `handleAnswer()`:
```js
  if (isCorrect) {
    var mult = comboMultiplier(state.streak) * (state.isBoss ? BOSS_MULTIPLIER : 1);
```

Add `SoundEngine.playCorrect();` as the very first line inside the `if (isCorrect)` block:
```js
  if (isCorrect) {
    SoundEngine.playCorrect();
    var mult = comboMultiplier(state.streak) * (state.isBoss ? BOSS_MULTIPLIER : 1);
```

Then find the `else` block:
```js
  } else {
    state.lives--;
    state.streak = 0;
```

Add `SoundEngine.playWrong();` as the very first line inside the `else` block:
```js
  } else {
    SoundEngine.playWrong();
    state.lives--;
    state.streak = 0;
```

- [ ] **Step 2: Verify sounds play**

Start a game at `http://localhost:3000/math/multiply/`. Answer a question correctly — you should hear a short ascending "ding". Answer incorrectly — you should hear a descending "bzzzt". Toggle mute and verify no sounds play.

- [ ] **Step 3: Commit**

```bash
git add math/multiply/index.html
git commit -m "feat: math blaster – zvuky správná/špatná odpověď"
```

---

### Task 5: Wire boss heartbeat into game flow

**Files:**
- Modify: `math/multiply/index.html` — `endRound()`, `showResultScreen()`, `gameOver()`, `startGame()` functions

- [ ] **Step 1: Start heartbeat in endRound()**

Find `endRound()`. It ends with:
```js
  dom.questionPanel.classList.add('boss-mode');
  document.body.classList.add('boss-bg');
  renderQuestion();
```

Add `SoundEngine.playBossHeartbeat();` after `document.body.classList.add('boss-bg');`:
```js
  dom.questionPanel.classList.add('boss-mode');
  document.body.classList.add('boss-bg');
  SoundEngine.playBossHeartbeat();
  renderQuestion();
```

- [ ] **Step 2: Stop heartbeat in showResultScreen()**

Find `showResultScreen()`. It starts with:
```js
function showResultScreen() {
  document.body.classList.remove('boss-bg');
```

Add `SoundEngine.stopBossHeartbeat();` after that line:
```js
function showResultScreen() {
  document.body.classList.remove('boss-bg');
  SoundEngine.stopBossHeartbeat();
```

- [ ] **Step 3: Stop heartbeat in gameOver()**

Find `gameOver()`. It starts with:
```js
function gameOver() {
  stopTimer();
  document.body.classList.remove('boss-bg');
```

Add `SoundEngine.stopBossHeartbeat();` after `document.body.classList.remove('boss-bg');`:
```js
function gameOver() {
  stopTimer();
  document.body.classList.remove('boss-bg');
  SoundEngine.stopBossHeartbeat();
```

- [ ] **Step 4: Stop heartbeat in startGame()**

Find `startGame()`. It contains:
```js
  dom.questionPanel.classList.remove('boss-mode');
  document.body.classList.remove('boss-bg');
```

Add `SoundEngine.stopBossHeartbeat();` after `document.body.classList.remove('boss-bg');`:
```js
  dom.questionPanel.classList.remove('boss-mode');
  document.body.classList.remove('boss-bg');
  SoundEngine.stopBossHeartbeat();
```

- [ ] **Step 5: Verify heartbeat**

Play through a full round at `http://localhost:3000/math/multiply/`. After the 10th correct answer, the boss fight starts — you should hear a steady "thump thump thump" every 700 ms. On the results screen, it stops. Toggle mute during boss fight — thumping stops immediately (interval keeps running, but `playBossTick` returns early).

- [ ] **Step 6: Commit**

```bash
git add math/multiply/index.html
git commit -m "feat: math blaster – tlukot srdce během boss fightu"
```

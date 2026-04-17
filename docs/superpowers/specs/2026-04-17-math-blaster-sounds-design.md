# Math Blaster — Sound System Design

**Date:** 2026-04-17  
**Status:** Approved

## Overview

Add synthesized sound effects to Math Blaster using the Web Audio API. No external files required — all sounds are generated programmatically in the browser. A persistent mute toggle is always visible.

## Audio Engine

A singleton `SoundEngine` object defined in the `<script>` block of `math/multiply/index.html`.

**Initialization:** `AudioContext` is created lazily on first user interaction (required by browser policy). All play functions call `ensureContext()` which creates the context if it doesn't exist yet.

**Sound definitions:**

| Function | Type | Description |
|---|---|---|
| `playCorrect()` | sine | Ascending ding: 440 → 880 Hz, 150 ms, fade out |
| `playWrong()` | sawtooth | Descending bzzzt: 200 → 80 Hz, 200 ms, fade out |
| `playBossTick()` | sine | Single thump: 60 Hz, 80 ms, exponential fade out |
| `playBossHeartbeat()` | — | Starts interval calling `playBossTick()` every 700 ms |
| `stopBossHeartbeat()` | — | Clears the heartbeat interval |

All `play*()` functions check `soundEnabled` flag first — if muted, they return immediately.

## Heartbeat Lifecycle

Heartbeat is tied to the existing `boss-bg` class lifecycle:

- **Start:** `endRound()` — same place `boss-bg` is added to body
- **Stop:** `showResultScreen()`, `gameOver()`, `startGame()` — same places `boss-bg` is removed

The heartbeat interval continues running even when muted (no complex sync needed); `playBossTick()` simply returns early.

## Integration Points

`handleAnswer()` calls sound functions immediately after determining result, parallel to `flashScreen()`:

```js
if (isCorrect) {
  SoundEngine.playCorrect();
  flashScreen('green');
  ...
} else {
  SoundEngine.playWrong();
  flashScreen('red');
  ...
}
```

## Mute Toggle

- Fixed-position button, top-right corner, above all screens (z-index high)
- Shows `🔊` when sound on, `🔇` when muted
- State stored in `localStorage` key `mathblaster-sound` (default: `true` = sound on)
- CSS: small button, semi-transparent background, consistent with game's neon style
- Toggle reads/writes `soundEnabled` boolean and updates button label

## Files Changed

- `math/multiply/index.html` — only file modified (add CSS for toggle button, add SoundEngine JS object, wire up calls)

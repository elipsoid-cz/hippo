# Math Blaster — Design Specification

**Datum:** 2026-04-16  
**Umístění v projektu:** `math/multiply/index.html` v Hippo repozitáři (`elipsoid-cz/hippo`)  
**Technologie:** Vanilla JS, HTML5, CSS3, Firebase Firestore, localStorage

---

## Kontext

Vzdělávací hra pro procvičování násobilky jednociferných čísel (2×2 až 9×9). Primární hráč: 10letá holka. Sekundárně použitelné pro spolužáky přes leaderboard. MVP je single-player, progress uložen lokálně; v budoucnu rozšiřitelné o více typů příkladů (sčítání, dělení).

---

## Vizuální styl

- **Retro arcade** — tmavé pozadí (`#0d0d1a`), neonové barvy: cyan (`#00ffff`), magenta (`#ff6bff`), zelená (`#00ff88`), žlutá (`#ffff00`)
- Glow efekty (`text-shadow`, `box-shadow`) na klíčových prvcích
- Monospace font pro číslice a labely
- Mobilní zobrazení jako primární — maximální šířka herního panelu ~360px, centrovaný

---

## Herní flow

```
Welcome screen → Kolo (10 příkladů) → Boss fight (5 příkladů) → Výsledková obrazovka
                       ↑_______________________________________________|
                              (opakuje se, obtížnost roste)
```

### 1. Welcome screen
- Název hry + neonové logo
- Pole pro nickname (předvyplněno z localStorage)
- Zobrazení aktuálního levelu a XP hráče
- Leaderboard (top 10, načteno z Firebase)
- Tlačítko **START**

### 2. Herní kolo (10 příkladů)
- Náhodné jednociferné násobky (2–9 × 2–9), bez opakování v jednom kole
- Timer bar (6 sekund na odpověď) — barva přechází zelená → žlutá → červená
- 3 životy (❤️❤️❤️) — špatná nebo pozdní odpověď = -1 život
- Výběr ze 4 možností v mřížce 2×2, vizuálně seskupeny s příkladem
- Každé tlačítko má jinou neonovou barvu
- Distractors: vždy jedna "blízká" odpověď (±1 násobek), ostatní vzdálené ale věrohodné
- Po správné odpovědi: krátká vizuální animace (flash zelená + +score pop-up)
- Po špatné: flash červená + animace ztráty života
- Série správných odpovědí = combo (×2 po 3, ×3 po 6)

### 3. Boss fight (po každém kole)
- 5 příkladů, timer zkrácen na 4 sekundy
- Dramatičtější vizuál: červené akcenty, blikající border, boss ikona (👾)
- Přežití = bonus XP + odznak za první přežití
- Pokud hráč přijde o všechny životy během boss fightů → game over

### 4. Výsledková obrazovka
- Celkové skóre, počet správných/špatných
- XP zisk (rozepsaný: za správné + combo + boss)
- Level-up animace (pokud postoupil)
- Nové odznaky (pokud získal)
- Uložení do Firebase leaderboardu (jako v Hippo: přepíše jen pokud lepší)
- Tlačítko **HRÁT ZNOVU** + **ZPĚT NA ÚVOD**

---

## Gamifikace

### Životy
- 3 životy na celou hru (kolo + boss fight dohromady)
- Vizuál: ❤️❤️❤️ → ❤️❤️🖤 → ❤️🖤🖤 → 💀 game over

### Skóre
- Správná odpověď: 10 bodů × combo multiplier
- Combo: ×2 po 3 v sérii, ×3 po 6 v sérii
- Bonus za čas: +5 bodů pokud odpovíš do 2 sekund
- Boss fight: ×2 na všechny body

### XP a levely
- XP = skóre / 10 (zaokrouhleno)
- Levely 1–10, každý vyžaduje víc XP (1→2: 100 XP, 2→3: 200 XP, atd.)
- Uloženo v localStorage: `mathblaster-xp`, `mathblaster-level`
- Level zobrazen na welcome screenu

### Odznaky (localStorage: `mathblaster-badges`)
| Odznak | Podmínka |
|--------|----------|
| 🔥 První krok | Dohrát první kolo |
| 👾 Boss killer | Přežít první boss fight |
| ⚡ Rychlostřelec | 5× odpověď do 2 sekund v jednom kole |
| 💎 Perfektní | Kolo bez jediné chyby |
| 🔥🔥🔥 Kombo master | Série 8+ v kuse |
| 🏆 Levelup | Postoupit na level 5 |

---

## Generování distractorů

Pro příklad `a × b = správný`:
1. `správný ± (a nebo b)` — "blízký" distractor
2. Další násobek z tabulky v rozumném rozsahu
3. Číslo mimo tabulku ale věrohodné
4. Vždy zkontrolovat unikátnost a že žádný distractor = správný

---

## Technická architektura

```
math/multiply/
  index.html      ← vše v jednom souboru (HTML + CSS + JS)
```

### JavaScript struktura (v jednom `<script>` tagu)
- `GameState` — objekt se stavem hry (score, lives, xp, level, streak, currentRound, mode)
- `generateQuestion()` — vygeneruje příklad + 4 možnosti
- `startRound()` / `startBoss()` / `showResult()` — flow management
- `handleAnswer(choice)` — zpracování odpovědi, update stavu
- `timerTick()` — odpočet, vyvolá handleAnswer(null) při vypršení
- `saveProgress()` / `loadProgress()` — localStorage
- `submitScore()` / `loadLeaderboard()` — Firebase (stejný pattern jako Hippo)

### Firebase
- Stejný projekt `hippo-cz`, stejná Firebase config
- Firestore kolekce: `leaderboards/math-multiply/scores/{nicknameKey}`
- Schéma dokumentu: `{ nickname, score, level, date }`
- Řazení: score desc → date asc

---

## Budoucí rozšíření (mimo MVP)
- Sčítání, odčítání, dělení (nové `index.html` v `math/add/` atd.)
- Obtížnostní nastavení (jen 7×, jen 8×, custom výběr)
- Synchronizace progressu přes Firebase (multi-device)
- Animované postavičky / pixel art

---

## Ověření (jak otestovat)
1. Otevřít `math/multiply/index.html` v prohlížeči (lokálně nebo přes GitHub Pages)
2. Zadat nickname, zkontrolovat načtení leaderboardu
3. Odehrát kolo — ověřit timer, životy, combo, XP přírůstek
4. Přijít o všechny životy → game over obrazovka
5. Přežít kolo → boss fight se správně spustí
6. Skóre se uloží do Firebase a zobrazí na leaderboardu
7. Level-up animace při dostatečném XP
8. Otevřít na mobilu — layout musí být použitelný bez scrollování

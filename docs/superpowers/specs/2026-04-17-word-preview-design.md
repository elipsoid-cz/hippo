# Word Preview — Design Spec
*2026-04-17*

## Overview

Před zahájením spelling bee hry si děti mohou prohlédnout slovíčka s překlady. Slovíčka se zobrazí jako kartičky přímo na welcome screenu, pod podnadpisem setu.

## Chování

### Toggle

Element podnadpisu (`#header-desc`) se stane klikatelným togglem. Zobrazuje text popisku setu + šipku indikující stav (▼ = rozbaleno, ▶ = sbaleno). Pod ním se nachází mřížka karet (`#word-cards-grid`).

### First-visit logika

- localStorage klíč: `hippo-wordlist-seen-{setId}`
- Pokud klíč **neexistuje**: mřížka se zobrazí rozbalená a klíč se uloží
- Pokud klíč **existuje**: mřížka je sbalená

### Kartičky

Každé slovíčko = jedna karta:
- **Horní část:** anglické slovo (tučně, větší písmo)
- **Dolní část:** český překlad (šedě, menší písmo)
- **Kliknutí:** přehraje audio (volá `speak(word, false)` — stejná funkce jako ve hře, s TTS fallbackem)

Layout: CSS grid, `repeat(auto-fill, minmax(120px, 1fr))`, 2–3 sloupce dle šířky.

### Sety bez překladů

Pokud `config.translations` je prázdný objekt nebo neobsahuje žádné klíče, `initWordList()` se předčasně ukončí — nepřidá toggle listener ani `#word-cards-grid` se nerozbalí. Podnadpis zůstane jako plain text bez toggle funkce. (Týká se i tournament modu, který překlady nemá.)

### Tlačítko START

Text se změní z `"START"` / `"All Words (10)"` na `"Začít"` — bez počtu slov (ten je redundantní, je v podnadpisu).

## Změny souborů

### `english/spelling-bees/shared/engine.js`

- `cacheDom()`: přidat `dom.headerDescToggle` (`#header-desc`) a `dom.wordCardsGrid` (`#word-cards-grid`)
- Nová funkce `renderWordCards()`: vytvoří DOM karty ze `config.words` + `config.translations`, přidá click listener volající `speak()`
- Nová funkce `initWordList()`: zkontroluje localStorage klíč, nastaví počáteční stav (rozbaleno/sbaleno), přidá click listener na toggle
- `init()`: zavolá `initWordList()` po `cacheDom()`

### `english/spelling-bees/play/index.html`

- `<p id="header-desc">` → `<div id="header-desc">` (obsah nastavuje engine, přidá šipku)
- Přidat `<div id="word-cards-grid" class="hidden"></div>` za `#header-desc`
- Tlačítko `#start-all-btn`: výchozí text `"Začít"` (engine přepisuje text, takže stačí jako fallback)

### `english/spelling-bees/shared/styles.css`

```
.word-cards-grid        — CSS grid layout, padding, gap
.word-card              — bílé pozadí, border-radius, box-shadow, cursor pointer, hover efekt
.word-card-en           — font-weight bold, větší velikost
.word-card-cs           — šedá barva, menší velikost
.header-desc-toggle     — cursor pointer, user-select none
.header-desc-toggle::after — šipka pomocí CSS transform rotate (0° = sbaleno, 90° = rozbaleno)
```

## Co se nemění

- `words.js` — žádné změny (translations jsou již přítomné)
- Homepage (`index.html`) — žádné změny
- Tournament mode — žádné změny (welcome screen tournamentu nepoužívá `#header-desc` toggle)
- Logika hry — žádné změny

## Scope

Tato změna se týká **pouze** `play/index.html` (unified player). Redirect soubory v `YYYY-MM-DD/index.html` se nemění.

# Word Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zobrazit kartičky slovíček s překlady na welcome screenu spelling bee, pod klikatelným podnadpisem setu.

**Architecture:** Podnadpis `#header-desc` se stane togglem; pod ním se renderuje mřížka karet (`#word-cards-grid`) vytvořená novou funkcí `renderWordCards()` v engine.js. Stav rozbalení se ukládá do localStorage — první návštěva = rozbaleno, další = sbaleno. Kliknutí na kartu přehraje audio přes existující `speak()`.

**Tech Stack:** Vanilla JS (ES5, IIFE pattern), CSS3, localStorage

---

## Soubory

| Soubor | Změna |
|--------|-------|
| `english/spelling-bees/shared/styles.css` | Přidat CSS třídy pro toggle a kartičky |
| `english/spelling-bees/play/index.html` | Změnit `<p>` na `<div>`, přidat `#word-cards-grid` |
| `english/spelling-bees/shared/engine.js` | Přidat `renderWordCards()`, `initWordList()`, volat z `init()`, upravit `setupWelcomeScreen()` |

---

## Task 1: CSS — toggle a kartičky

**Files:**
- Modify: `english/spelling-bees/shared/styles.css`

- [ ] **Step 1: Přidat CSS na konec souboru**

Přidej za poslední řádek `styles.css`:

```css
/* --- Word Preview --- */
#header-desc {
    cursor: default;
}

#header-desc.word-list-toggle {
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
}

#header-desc.word-list-toggle::after {
    content: "▶";
    font-size: 0.75em;
    display: inline-block;
    transition: transform 0.2s ease;
}

#header-desc.word-list-toggle.expanded::after {
    transform: rotate(90deg);
}

.word-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.6rem;
    padding: 0.75rem 0 0.5rem;
    width: 100%;
}

.word-cards-grid.hidden {
    display: none;
}

.word-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 0.6rem 0.5rem;
    text-align: center;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.word-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.word-card:active {
    transform: translateY(0);
}

.word-card-en {
    font-weight: bold;
    font-size: 0.95rem;
    color: #222;
}

.word-card-cs {
    font-size: 0.8rem;
    color: #888;
}
```

- [ ] **Step 2: Spustit dev server a ověřit, že se CSS načítá bez chyb**

```bash
npx serve -l 3000 .
```

Otevři `http://localhost:3000/english/spelling-bees/play/?set=2026-04-20` — stránka se zobrazí normálně (žádná viditelná změna zatím).

- [ ] **Step 3: Commit**

```bash
git add english/spelling-bees/shared/styles.css
git commit -m "feat: word preview – CSS pro toggle a kartičky"
```

---

## Task 2: HTML — přidat `#word-cards-grid`

**Files:**
- Modify: `english/spelling-bees/play/index.html`

- [ ] **Step 1: Změnit `<p id="header-desc">` na `<div>` a přidat grid**

V `play/index.html` najdi:
```html
<p id="header-desc"></p>
```

Nahraď za:
```html
<div id="header-desc"></div>
<div id="word-cards-grid" class="hidden"></div>
```

- [ ] **Step 2: Ověřit, že se stránka zobrazuje správně**

Reload `http://localhost:3000/english/spelling-bees/play/?set=2026-04-20` — popis setu je stále viditelný, žádná vizuální změna.

- [ ] **Step 3: Commit**

```bash
git add english/spelling-bees/play/index.html
git commit -m "feat: word preview – přidat word-cards-grid do HTML"
```

---

## Task 3: JS — `renderWordCards()` a `initWordList()`

**Files:**
- Modify: `english/spelling-bees/shared/engine.js`

- [ ] **Step 1: Přidat `dom.wordCardsGrid` do `cacheDom()`**

V `cacheDom()` (řádek ~39) přidej za poslední `dom.xxx` přiřazení:

```js
dom.wordCardsGrid = document.getElementById("word-cards-grid");
```

- [ ] **Step 2: Přidat funkci `renderWordCards()`**

Přidej novou funkci těsně před `function setupWelcomeScreen()` (řádek ~1380):

```js
function renderWordCards() {
    if (!dom.wordCardsGrid) return;
    dom.wordCardsGrid.innerHTML = "";
    config.words.forEach(function (word) {
        var translation = config.translations[word.toLowerCase()];
        var card = document.createElement("div");
        card.className = "word-card";
        var enEl = document.createElement("div");
        enEl.className = "word-card-en";
        enEl.textContent = word;
        var csEl = document.createElement("div");
        csEl.className = "word-card-cs";
        csEl.textContent = translation || "";
        card.appendChild(enEl);
        card.appendChild(csEl);
        card.addEventListener("click", function () {
            speak(word, false);
        });
        dom.wordCardsGrid.appendChild(card);
    });
}
```

- [ ] **Step 3: Přidat funkci `initWordList()`**

Přidej těsně za `renderWordCards()`:

```js
function initWordList() {
    if (!dom.wordCardsGrid || !dom.headerDesc) return;
    if (!config.translations || Object.keys(config.translations).length === 0) return;

    renderWordCards();

    var seenKey = "hippo-wordlist-seen-" + config.setId;
    var alreadySeen = localStorage.getItem(seenKey);

    if (!alreadySeen) {
        dom.wordCardsGrid.classList.remove("hidden");
        dom.headerDesc.classList.add("expanded");
        localStorage.setItem(seenKey, "1");
    }

    dom.headerDesc.classList.add("word-list-toggle");

    dom.headerDesc.addEventListener("click", function () {
        var isExpanded = !dom.wordCardsGrid.classList.contains("hidden");
        if (isExpanded) {
            dom.wordCardsGrid.classList.add("hidden");
            dom.headerDesc.classList.remove("expanded");
        } else {
            dom.wordCardsGrid.classList.remove("hidden");
            dom.headerDesc.classList.add("expanded");
        }
    });
}
```

- [ ] **Step 4: Volat `initWordList()` z `init()`**

V `init()` (řádek ~1515) přidej volání `initWordList()` za `setupWelcomeScreen()`:

```js
setupWelcomeScreen();
initWordList();   // ← přidat tento řádek
bindEvents();
```

- [ ] **Step 5: Upravit `setupWelcomeScreen()` — odstranit počet slov z podnadpisu a z CTA**

V `setupWelcomeScreen()` najdi blok nastavující `dom.headerDesc.textContent` (řádky ~1393–1397):

```js
if (dom.headerDesc) {
    dom.headerDesc.textContent = config.wordsPerRound > 0
        ? config.description
        : config.description + " (" + config.words.length + " words)";
}
```

Nahraď za (vždy jen popis, bez počtu):

```js
if (dom.headerDesc) {
    dom.headerDesc.textContent = config.description;
}
```

Pak najdi všechna místa, kde se nastavuje `dom.startAllBtn.textContent` na `"All Words (...)"` nebo `"START"`. Je to na dvou místech — jeden branch pro `mistakeWords.length > 0`, druhý pro prázdné chyby.

**Branch s chybami** (~řádky 1402–1409), nahraď:
```js
if (dom.startAllBtn) {
    if (config.showProgress && config.wordsPerRound > 0) {
        dom.startAllBtn.textContent = "Practice " + config.wordsPerRound + " words (mistakes first) \u2192";
    } else {
        dom.startAllBtn.textContent = config.wordsPerRound > 0
            ? "All Words (" + config.wordsPerRound + " per round)"
            : "All Words (" + config.words.length + ")";
    }
}
```

Za:
```js
if (dom.startAllBtn) {
    if (config.showProgress && config.wordsPerRound > 0) {
        dom.startAllBtn.textContent = "Practice " + config.wordsPerRound + " words (mistakes first) \u2192";
    } else {
        dom.startAllBtn.textContent = config.wordsPerRound > 0
            ? "All Words (" + config.wordsPerRound + " per round)"
            : "Zač\u00edt";
    }
}
```

**Branch bez chyb** (~řádky 1426–1433), nahraď:
```js
if (dom.startAllBtn) {
    if (config.showProgress && config.wordsPerRound > 0) {
        dom.startAllBtn.textContent = "Practice " + config.wordsPerRound + " words \u2192";
    } else {
        dom.startAllBtn.textContent = config.wordsPerRound > 0
            ? "START (" + config.wordsPerRound + " words)"
            : "START";
    }
}
```

Za:
```js
if (dom.startAllBtn) {
    if (config.showProgress && config.wordsPerRound > 0) {
        dom.startAllBtn.textContent = "Practice " + config.wordsPerRound + " words \u2192";
    } else {
        dom.startAllBtn.textContent = config.wordsPerRound > 0
            ? "START (" + config.wordsPerRound + " words)"
            : "Zač\u00edt";
    }
}
```

- [ ] **Step 6: Manuálně otestovat**

Otevři `http://localhost:3000/english/spelling-bees/play/?set=2026-04-20`:

1. Podnadpis zobrazuje text popisku setu + šipku `▶` (nebo `▼` pokud první návštěva)
2. Při první návštěvě jsou kartičky rozbalené (localStorage klíč `hippo-wordlist-seen-2026-04-20` neexistuje)
3. Kliknutí na podnadpis sbalí / rozbalí mřížku, šipka se rotuje
4. Kliknutí na kartičku přehraje zvuk slova
5. Reload stránky → kartičky sbalené (klíč v localStorage existuje)
6. Tlačítko START zobrazuje "Začít" (ne "All Words (10)" ani "START")

Pro otestování first-visit: v DevTools Console spusť `localStorage.removeItem('hippo-wordlist-seen-2026-04-20')` a reload.

Otevři také `http://localhost:3000/english/spelling-bees/play/?set=tournament` — podnadpis je plain text bez toggle (tournament nemá překlady).

- [ ] **Step 7: Commit**

```bash
git add english/spelling-bees/shared/engine.js
git commit -m "feat: word preview – kartičky slovíček s překlady na welcome screenu"
```

---

## Task 4: Bump verze a push

**Files:**
- Modify: `index.html` (verze ve footeru)

- [ ] **Step 1: Zvýšit verzi v `index.html`**

V `index.html` najdi aktuální verzi ve footeru (formát `vX.Y.Z`, aktuálně `v1.10.6`) a zvyš minor:

```
v1.10.6 → v1.11.0
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "chore: bump verze na v1.11.0"
```

- [ ] **Step 3: Push (vyžaduje souhlas uživatele)**

```bash
git push
```

Po úspěšném push: otestuj na `https://elipsoid-cz.github.io/hippo/english/spelling-bees/play/?set=2026-04-20`.

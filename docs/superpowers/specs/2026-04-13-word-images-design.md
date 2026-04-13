# Word Images — Design Spec
**Projekt 1 z 2** | Datum: 2026-04-13

## Přehled

Ke každému slovu ve Spelling Bee setu se vygeneruje ilustrační obrázek (3D cartoon styl, Gemini Image API). Obrázek je viditelný po celou dobu, kdy hráč píše slovo — jako vizuální kontext/nápověda.

Toto je Projekt 1. Projekt 2 (Admin Flow Redesign — automatické překlady, staging, review & publish) je samostatný spec.

---

## 1. Datová vrstva

### `words.js`
Nový flag `images: true` per set, analogický k `audio: true`:

```js
"2026-01-26": {
    audio: true,
    images: true,   // přidáno po vygenerování
    cover: true,
    words: [...],
    translations: { ... },
}
```

### Souborová struktura
```
english/spelling-bees/{setId}/
  images/
    feather.jpg
    rubber.jpg
    stomach-ache.jpg
    ...
```

**Filename normalizace** — identická s audio systémem:
```js
word.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.jpg'
```

---

## 2. Engine (`engine.js`)

### Config
```js
imagePath: null,  // optional: base URL for word images (e.g. '../2026-01-26/images/')
```

### `play/index.html` — předání configu
```js
imagePath: set.images ? ('../' + setId + '/images/') : null,
```

### DOM element
Engine dynamicky vytvoří `#word-image` kontejner (stejný vzor jako `#translation-display`), vloží ho na začátek game zone (pod progress bar, nad audio tlačítka):

```html
<div id="word-image">
  <img src="{imagePath}{filename}.jpg" alt="" />
</div>
```

### Chování
- Obrázek se přepne okamžitě při přechodu na každé nové slovo
- Fade-in animace: opacity 0 → 1, 0.3s
- Pokud obrázek neexistuje (`imagePath` null): kontejner se skryje před startem hry
- Pokud obrázek selže při načtení (HTTP 404, síťová chyba): `img.onerror` skryje `#word-image` kontejner, layout se nezlomí
- Fade-in: `img.onload` přidá CSS třídu `.loaded` (opacity 0 → 1)
- Obrázek se nezobrazuje na welcome ani final screenu

---

## 3. Styly (`styles.css`)

```css
#word-image {
    margin-bottom: 14px;
    border-radius: 12px;
    overflow: hidden;
    height: 200px;         /* desktop */
}

#word-image.hidden { display: none; }

#word-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    opacity: 0;
    transition: opacity 0.3s ease;
}

#word-image img.loaded { opacity: 1; }

@media (max-height: 700px) {
    #word-image {
        height: clamp(90px, 25vh, 140px);  /* mobil — input vždy viditelný */
    }
}
```

---

## 4. CLI skript (`scripts/generate-images.js`)

Analogický k `generate-covers.js` a `generate-audio.js`.

### Použití
```bash
node scripts/generate-images.js --set 2026-01-26
node scripts/generate-images.js --set 2026-01-26 --all   # přegenerovat i existující
```

### Prompt
```js
function buildPrompt(word, translation) {
    return (
        `IMPORTANT: Do not include ANY text, labels, letters, words, signs with writing, ` +
        `or captions anywhere in the image — not even on props, signs, or backgrounds.\n\n` +
        `Create an image for a spelling bee game representing the word "${word}" ` +
        `(meaning: ${translation}).\n\n` +
        `Style: Edge to edge 3D cartoon scene. Use soft, refined textures with realistic ` +
        `PBR materials and gentle, lifelike lighting and shadows. Clean, minimalistic ` +
        `composition focused on a single clear subject that immediately communicates ` +
        `the word's meaning at a glance.`
    );
}
```

### Parametry
- **Model:** `gemini-3.1-flash-image-preview`
- **Výstup:** ~512×512px JPEG
- **Rate limiting:** 21s prodleva mezi slovy (free tier 10 RPM)
- **Auto-retry:** 3 pokusy per slovo, 20s prodleva mezi pokusy
- **Po dokončení:** zapíše `images: true` do `words.js` pokud alespoň 1 slovo uspělo
- Přeskočí slova která již mají obrázek (pokud není `--all`)

---

## 5. GitHub Actions (`generate-images.yml`)

Stejná struktura jako `generate-audio.yml`:
- Spouštěn přes `workflow_dispatch` s inputem `set_id`
- Používá `GEMINI_API_KEY` z GitHub Secrets
- `git stash` → `git pull --rebase` → `git stash pop` před generováním
- Auto-commit výsledků: WAV soubory + `images: true` v `words.js`

---

## 6. Admin UI

### Tabulka setů — nový sloupec
Sloupec **🖼️ Img** vedle stávajících Cover a Audio sloupců. Zobrazuje počet vygenerovaných obrázků / celkový počet slov (např. `8/10`).

### Images modal
Otevře se kliknutím na sloupec 🖼️:

- **Grid náhledů** (4 sloupce) — miniatura + název slova pod ní
- Existující obrázek: barevná miniatura, kliknutím zobrazí plnou velikost v overlay
- Chybějící obrázek: šedý čtverec s `?`
- **Tlačítko „Dogenerovat zbývající (N)"** — spustí `generate-images.yml` workflow jen pro chybějící slova
- **Polling stavu workflow** každých 5s (stejný vzor jako Cover modal), max 3 min
- **ESC** zavírá modal

### Asset modal po uložení nového setu
Po uložení nového setu se zobrazí modal „Vygenerovat assety":

- Checkboxy: ✓ Cover, ✓ Audio, ✓ Obrázky ke slovům — vše zaškrtnuto defaultně
- Tlačítko **„Vygenerovat vše"** — dispatchne všechny tři workflows **paralelně**
- Průběhový stav: 3 nezávislé progress bary (polling každých 5s pro každý workflow)
- Po dokončení: shrnutí výsledků, info o deployment delay (~1 min), tlačítko „Zavřít a obnovit admin" (hard refresh)
- Tlačítko „Přeskočit" — zavře modal bez generování
- Modal nelze zavřít křížkem během generování

---

## 7. Co tento projekt neřeší (Projekt 2)

- Automatické generování překladů
- Staging fáze (assety před publikací)
- Review & approve flow před commitem
- Kompletní redesign admin editoru setů

---

## Závislosti a poznámky

- `GEMINI_API_KEY` v GitHub Secrets musí být klíč z Default Gemini Project (AI Studio), ne z hippo-cz Firebase projektu — stejné jako pro audio a cover
- Před spuštěním generování se vždy zeptat uživatele (placené API volání)
- `.superpowers/` přidat do `.gitignore`

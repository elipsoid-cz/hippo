# /ship — Dostat feature na produkci

Tento příkaz připraví a odešle aktuální změny na GitHub (produkci).

## Kroky

### 1. Zkontroluj stav

Spusť paralelně:
- `git status` — seznam změněných souborů
- `git diff --stat HEAD` — přehled změn
- `git log --oneline -5` — posledních 5 commitů pro kontext

### 2. Zjisti aktuální verzi

Přečti řádek s verzí z `index.html` (pattern `v\d+\.\d+\.\d+` v `<small>` tagu).

Výjimka: pokud jsou změny **výhradně** v `math/`, verzi nebumpuj a přeskoč na krok 4.

### 3. Zeptej se na typ bumpu

Zobraz uživateli:
- aktuální verzi
- seznam změněných souborů
- navrhni typ bumpu (patch = bugfix, minor = nová feature, major = zásadní změna)

Počkej na odpověď: `patch` / `minor` / `major` (nebo jen `p` / `m` / `M`).

Pak bumpni verzi v `index.html` — najdi `<small>vX.Y.Z</small>` a uprav číslo.

### 4. Sestav commit message

Vygeneruj commit message v češtině na základě změn.
Formát: `feat:` / `fix:` / `chore:` + stručný popis.

Zprávu zobraz, ale nečekej na schválení — použij ji přímo.
Výjimka: pokud uživatel explicitně řekne, ať se zeptám.

### 5. Commitni

```bash
git add -A
git commit -m "<vygenerovaná zpráva>"
```

### 6. Push

Pushni přímo bez dotazu:
```bash
git push origin main
```

Nakonec napiš verzi, která je teď na produkci.

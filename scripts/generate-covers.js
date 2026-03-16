#!/usr/bin/env node
// generate-covers.js — generuje cover obrázky pro Spelling Bee sety pomocí Gemini API
//
// Použití:
//   node scripts/generate-covers.js                    # všechny sety bez cover
//   node scripts/generate-covers.js --set 2026-03-23   # konkrétní set
//   node scripts/generate-covers.js --all              # přegenerovat vše
//
// Vyžaduje: GEMINI_API_KEY v prostředí nebo v souboru .env

'use strict';

const fs            = require('fs');
const path          = require('path');
const vm            = require('vm');
const { execSync }  = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Načtení .env -----------------------------------------------------------
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].trim();
    });
}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error('Chyba: GEMINI_API_KEY není nastaven. Přidej ho do .env nebo do prostředí.');
    process.exit(1);
}

// --- Cesty ------------------------------------------------------------------
const ROOT       = path.join(__dirname, '..');
const WORDS_JS   = path.join(ROOT, 'english/spelling-bees/shared/words.js');
const SETS_DIR   = path.join(ROOT, 'english/spelling-bees');

// --- Načtení words.js -------------------------------------------------------
function loadSets() {
    const code = fs.readFileSync(WORDS_JS, 'utf8');
    const sandbox = { var: undefined };
    // Spustíme kód v sandboxu — definuje SPELLING_BEE_SETS jako globál
    const ctx = vm.createContext({});
    vm.runInContext(code, ctx);
    return ctx.SPELLING_BEE_SETS;
}

// --- Sestavení promptu ------------------------------------------------------
function buildPrompt(set) {
    const keywords = set.words.map(w => w.toLowerCase()).join(', ');
    return (
        `IMPORTANT: Do not include ANY text, labels, letters, words, signs with writing, or captions anywhere in the image — not even on props, signs, or backgrounds.\n\n` +
        `Create an image for a spelling bee game. The word set contains: ${keywords}\n\n` +
        `Focus primarily on the concrete, physical objects and characters from the list. For abstract words or verbs that cannot be directly depicted, either skip them or represent them through simple recognizable objects (e.g. a padlock for "forbidden", a trophy for "excellent", a fork-in-the-road for "choice"). Do not try to illustrate every word — pick the most visually interesting and concrete ones.\n\n` +
        `Style: Edge to edge 3D cartoon scene. Use soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Clean, minimalistic composition. Do not portrait the spelling bee competition itself. The goal is to visually distinguish this set from others at a glance.`
    );
}

// --- Aktualizace words.js ---------------------------------------------------
function markCoverInWordsJs(setId) {
    let content = fs.readFileSync(WORDS_JS, 'utf8');
    const marker = `"${setId}": {`;
    if (!content.includes(marker)) {
        console.warn(`  Varování: setId "${setId}" nenalezen v words.js`);
        return;
    }
    // Přidej cover: true pokud tam ještě není
    if (content.includes(`"${setId}": {\n        cover: true`)) {
        return; // již existuje
    }
    content = content.replace(marker, `${marker}\n        cover: true,`);
    fs.writeFileSync(WORDS_JS, content, 'utf8');
}

// --- Generování jednoho obrázku ---------------------------------------------
async function generateCover(setId, set, genAI) {
    const outDir  = path.join(SETS_DIR, setId);
    const outFile = path.join(outDir, 'cover.jpg');

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const prompt = buildPrompt(set);
    console.log(`\n[${setId}] ${set.title}`);
    console.log(`  Prompt: ${prompt}`);

    const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-image-preview',
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const result = await model.generateContent(prompt);
    const parts  = result.response.candidates[0].content.parts;
    const imgPart = parts.find(p => p.inlineData);

    if (!imgPart) {
        console.error(`  Chyba: Gemini nevrátil obrázek pro set ${setId}`);
        const textPart = parts.find(p => p.text);
        if (textPart) console.error(`  Text odpovědi: ${textPart.text}`);
        return false;
    }

    fs.writeFileSync(outFile, Buffer.from(imgPart.inlineData.data, 'base64'));
    console.log(`  Uloženo: ${path.relative(ROOT, outFile)}`);

    // Generuj optimalizovaný thumb (700px, quality 80) pro použití na homepage
    const thumbFile = path.join(outDir, 'cover-thumb.jpg');
    execSync(`sips -s format jpeg -s formatOptions 80 -Z 700 "${outFile}" --out "${thumbFile}"`, { stdio: 'pipe' });
    const thumbSize = Math.round(fs.statSync(thumbFile).size / 1024);
    console.log(`  Thumb: ${path.relative(ROOT, thumbFile)} (${thumbSize} KB)`);

    markCoverInWordsJs(setId);
    console.log(`  words.js: cover: true přidáno`);
    return true;
}

// --- Hlavní logika ----------------------------------------------------------
async function main() {
    const args   = process.argv.slice(2);
    const setArg = args.includes('--set') ? args[args.indexOf('--set') + 1] : null;
    const doAll  = args.includes('--all');

    const sets = loadSets();
    const genAI = new GoogleGenerativeAI(API_KEY);

    let targets;
    if (setArg) {
        if (!sets[setArg]) {
            console.error(`Chyba: Set "${setArg}" neexistuje v words.js`);
            process.exit(1);
        }
        targets = [[setArg, sets[setArg]]];
    } else if (doAll) {
        targets = Object.entries(sets);
    } else {
        // Výchozí: pouze sety bez cover
        targets = Object.entries(sets).filter(([, s]) => !s.cover);
    }

    if (targets.length === 0) {
        console.log('Všechny sety už mají cover obrázek. Použij --all pro přegenerování.');
        return;
    }

    console.log(`Generuji ${targets.length} obrázek(ů)...`);

    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
        const [setId, set] = targets[i];
        const success = await generateCover(setId, set, genAI);
        if (success) ok++;

        // Rate limiting: delay mezi requesty (free tier = 15 RPM)
        if (i < targets.length - 1) {
            console.log('  Čekám 5s (rate limit)...');
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.log(`\nHotovo: ${ok}/${targets.length} obrázků úspěšně vygenerováno.`);
}

main().catch(err => {
    console.error('Neočekávaná chyba:', err.message || err);
    process.exit(1);
});

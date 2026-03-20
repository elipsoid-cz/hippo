#!/usr/bin/env node
// generate-audio.js — generuje WAV audio soubory pro Spelling Bee sety pomocí Gemini TTS API
//
// Použití:
//   node scripts/generate-audio.js                                        # všechny sety bez audio
//   node scripts/generate-audio.js --set 2026-03-23                       # konkrétní set
//   node scripts/generate-audio.js --all                                  # přegenerovat vše
//   node scripts/generate-audio.js --set 2026-03-23 --force               # přegenerovat i existující soubory
//   node scripts/generate-audio.js --set 2026-03-23 --force --voice Puck  # jiný hlas
//
// Vyžaduje: GEMINI_API_KEY v prostředí nebo v souboru .env

'use strict';

const fs  = require('fs');
const path = require('path');
const vm  = require('vm');

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
const ROOT     = path.join(__dirname, '..');
const WORDS_JS = path.join(ROOT, 'english/spelling-bees/shared/words.js');
const SETS_DIR = path.join(ROOT, 'english/spelling-bees');

// --- Načtení words.js -------------------------------------------------------
function loadSets() {
    const code = fs.readFileSync(WORDS_JS, 'utf8');
    const ctx  = vm.createContext({});
    vm.runInContext(code, ctx);
    return ctx.SPELLING_BEE_SETS;
}

// --- Název souboru ----------------------------------------------------------
// MUSÍ být identické s wordToAudioFilename() v engine.js
function wordToFilename(word) {
    return word.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.wav';
}

// --- Sestavení WAV bufferu z raw PCM ----------------------------------------
// Gemini TTS vrací raw PCM (24kHz, 16-bit, mono) — přidáme WAV header
function buildWavBuffer(pcmBase64) {
    const pcm    = Buffer.from(pcmBase64, 'base64');
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcm.length, 4);   // celková délka - 8
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);                // fmt chunk size
    header.writeUInt16LE(1, 20);                 // PCM format
    header.writeUInt16LE(1, 22);                 // mono
    header.writeUInt32LE(24000, 24);             // sample rate
    header.writeUInt32LE(48000, 28);             // byte rate (24000 * 1 * 2)
    header.writeUInt16LE(2, 32);                 // block align (1 * 2)
    header.writeUInt16LE(16, 34);                // bits per sample
    header.write('data', 36);
    header.writeUInt32LE(pcm.length, 40);        // data chunk size

    return Buffer.concat([header, pcm]);
}

// --- Volání Gemini TTS API --------------------------------------------------
async function generateAudio(word, apiKey, voice) {
    const url  = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
            contents: [{ parts: [{ text: `Say the word: ${word}` }] }],
            generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                },
            },
        }),
    });

    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`API ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) {
        throw new Error('Gemini nevrátil audio data');
    }

    return buildWavBuffer(part.inlineData.data);
}

// --- Označení setu v words.js (jen pokud aspoň jedno slovo uspělo) ----------
function markAudioInWordsJs(setId) {
    let content      = fs.readFileSync(WORDS_JS, 'utf8');
    const marker     = `"${setId}": {`;
    const audioCheck = `"${setId}": {\n        audio: true`;

    if (!content.includes(marker)) {
        console.warn(`  Varování: setId "${setId}" nenalezen v words.js`);
        return;
    }
    if (content.includes(audioCheck)) {
        return; // již existuje
    }
    content = content.replace(marker, `${marker}\n        audio: true,`);
    fs.writeFileSync(WORDS_JS, content, 'utf8');
}

// --- Generování audia pro jeden set -----------------------------------------
async function generateAudioForSet(setId, set, apiKey, force, voice) {
    const audioDir = path.join(SETS_DIR, setId, 'audio');
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }

    console.log(`\n[${setId}] ${set.title} (${set.words.length} slov, hlas: ${voice})`);

    let ok = 0;
    for (let i = 0; i < set.words.length; i++) {
        const word     = set.words[i];
        const filename = wordToFilename(word);
        const outPath  = path.join(audioDir, filename);

        if (fs.existsSync(outPath) && !force) {
            console.log(`  ⏭  ${word} (již existuje)`);
            ok++;
            continue;
        }

        let generated = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                if (attempt === 1) console.log(`  🔊 ${word}...`);
                else console.log(`  ⟳  ${word}: pokus ${attempt}...`);
                const wavBuffer = await generateAudio(word, apiKey, voice);
                fs.writeFileSync(outPath, wavBuffer);
                const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
                console.log(`  ✓  ${word} → ${filename} (${sizeKb} KB)`);
                generated = true;
                break;
            } catch (e) {
                if (attempt < 3) {
                    await new Promise(r => setTimeout(r, 3000));
                } else {
                    console.error(`  ✗  ${word}: ${e.message}`);
                }
            }
        }
        if (generated) ok++;

        // Rate limiting: free tier = 15 RPM
        if (i < set.words.length - 1) {
            await new Promise(r => setTimeout(r, 4000));
        }
    }

    const failed = set.words.filter(w => !fs.existsSync(path.join(audioDir, wordToFilename(w))));
    if (failed.length > 0) {
        console.error(`  ✗  Selhala slova: ${failed.join(', ')}`);
        process.exitCode = 1;
    }
    if (ok > 0) {
        markAudioInWordsJs(setId);
        console.log(`  words.js: audio: true přidáno (${ok}/${set.words.length} slov)`);
    } else {
        console.warn(`  Žádné soubory nebyly vygenerovány, words.js nezměněn.`);
    }

    return ok;
}

// --- Hlavní logika ----------------------------------------------------------
async function main() {
    const args   = process.argv.slice(2);
    const setArg = args.includes('--set') ? args[args.indexOf('--set') + 1] : null;
    const doAll  = args.includes('--all');
    const force  = args.includes('--force');
    const voice  = args.includes('--voice') ? args[args.indexOf('--voice') + 1] : 'Aoede';

    const sets = loadSets();

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
        // Výchozí: pouze sety bez audio
        targets = Object.entries(sets).filter(([, s]) => !s.audio);
    }

    if (targets.length === 0) {
        console.log('Všechny sety už mají audio. Použij --all pro přegenerování.');
        return;
    }

    console.log(`Generuji audio pro ${targets.length} set(ů)...`);

    let totalOk    = 0;
    let totalWords = 0;
    for (let i = 0; i < targets.length; i++) {
        const [setId, set] = targets[i];
        const ok = await generateAudioForSet(setId, set, API_KEY, force, voice);
        totalOk    += ok;
        totalWords += set.words.length;

        if (i < targets.length - 1) {
            console.log('  Čekám 5s před dalším setem...');
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.log(`\nHotovo: ${totalOk}/${totalWords} slov úspěšně vygenerováno.`);
}

main().catch(err => {
    console.error('Neočekávaná chyba:', err.message || err);
    process.exit(1);
});

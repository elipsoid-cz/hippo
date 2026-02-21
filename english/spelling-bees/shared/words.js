// Spelling Bee - Central Word Database
// To add a new week: add a new entry to SPELLING_BEE_SETS below.
// The tournament module will automatically include new words.

var SPELLING_BEE_SETS = {
    "2025-01-26": {
        title: "January 26",
        date: "2025-01-26",
        description: "Irregular verbs and everyday objects",
        words: [
            "Threw",
            "Wrote",
            "Knew",
            "Tourist",
            "Smooth",
            "Light",
            "Rubber",
            "Mirror",
            "Curtain",
            "Feather",
        ],
    },
    "2025-02-02": {
        title: "February 2",
        date: "2025-02-02",
        description: "Body, health and adjectives",
        words: [
            "Fluffy",
            "Bumpy",
            "Stomach ache",
            "Temperature",
            "Sore Throat",
            "Mountain",
            "Rough",
            "Curtain",
            "Should",
            "Design",
        ],
    },
    "2025-02-09": {
        title: "February 9",
        date: "2025-02-09",
        description: "History and properties",
        words: [
            "Of course",
            "Comical",
            "Myth",
            "Labyrinth",
            "Exciting",
            "Instruction",
            "Should",
            "Ancient",
            "Crown",
            "Property",
        ],
    },
    "2025-02-16": {
        title: "February 16",
        date: "2025-02-16",
        description: "Obligation and permission",
        words: [
            "Suggestion",
            "Optional",
            "Choice",
            "Mustn't",
            "Allow",
            "Obligation",
            "Mandatory",
            "Excellent",
            "Forbidden",
            "Couldn't",
        ],
    },
    "2025-02-23": {
        title: "February 23",
        date: "2025-02-23",
        description: "Science and everyday words",
        words: [
            "Project",
            "Group",
            "Science",
            "Hump",
            "Success",
            "Symbol",
            "Physical",
            "Dictionary",
            "Scissors",
            "Miles",
        ],
    },
};

// Phonetic overrides for TTS only.
// Use when the default pronunciation is wrong.
// Keys are lowercase, values are alternative spellings passed to speech synthesis.
var PHONETIC_OVERRIDES = {};

// Get all unique words across all sets (for tournament mode).
// Deduplicates by lowercase comparison (e.g. "Should" appears in set1 and set2).
function getAllSpellingBeeWords() {
    var seen = {};
    var all = [];
    for (var key in SPELLING_BEE_SETS) {
        if (SPELLING_BEE_SETS.hasOwnProperty(key)) {
            SPELLING_BEE_SETS[key].words.forEach(function (w) {
                var norm = w.toLowerCase();
                if (!seen[norm]) {
                    seen[norm] = true;
                    all.push(w);
                }
            });
        }
    }
    return all;
}

// Get words for a specific set by ID.
function getSpellingBeeSet(setId) {
    return SPELLING_BEE_SETS[setId] || null;
}

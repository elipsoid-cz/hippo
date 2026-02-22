// Spelling Bee - Central Word Database
// To add a new week: add a new entry to SPELLING_BEE_SETS below.
// The tournament module will automatically include new words.

// Firebase configuration for leaderboard
var FIREBASE_CONFIG = {
    apiKey: "AIzaSyB-prvqJmm0Jdt4kQAA-f5BQXmaC8VGP44",
    authDomain: "hippo-cz.firebaseapp.com",
    projectId: "hippo-cz",
    storageBucket: "hippo-cz.firebasestorage.app",
    messagingSenderId: "881228649401",
    appId: "1:881228649401:web:2d81c97045155687a51c68"
};

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
        translations: {
            "threw": "hodil/a",
            "wrote": "napsal/a",
            "knew": "věděl/a",
            "tourist": "turista",
            "smooth": "hladký",
            "light": "světlo / lehký",
            "rubber": "guma",
            "mirror": "zrcadlo",
            "curtain": "záclona",
            "feather": "péro / peří",
        },
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
        translations: {
            "fluffy": "nadýchaný / chlupatý",
            "bumpy": "hrbolatý",
            "stomach ache": "bolest břicha",
            "temperature": "teplota",
            "sore throat": "bolest v krku",
            "mountain": "hora",
            "rough": "drsný / hrubý",
            "curtain": "záclona",
            "should": "měl/a by",
            "design": "vzor",
        },
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
        translations: {
            "of course": "samozřejmě",
            "comical": "komický",
            "myth": "mýtus",
            "labyrinth": "bludiště",
            "exciting": "vzrušující / napínavý",
            "instruction": "návod",
            "should": "měl/a by",
            "ancient": "starověký / dávný",
            "crown": "koruna",
            "property": "vlastnost / majetek",
        },
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
        translations: {
            "suggestion": "návrh / tip",
            "optional": "volitelný / nepovinný",
            "choice": "volba / výběr",
            "mustn't": "nesmí / nesmíš",
            "allow": "dovolit / povolit",
            "obligation": "povinnost",
            "mandatory": "povinný / závazný",
            "excellent": "výborný / skvělý",
            "forbidden": "zakázaný",
            "couldn't": "nemohl/a",
        },
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
        translations: {
            "project": "projekt",
            "group": "skupina",
            "science": "věda",
            "hump": "hrb",
            "success": "úspěch",
            "symbol": "znak",
            "physical": "fyzický / tělesný",
            "dictionary": "slovník",
            "scissors": "nůžky",
            "miles": "míle",
        },
    },
};

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

// Merge translations from all sets (for tournament mode).
// Later sets overwrite earlier ones for duplicate words (same translation anyway).
function getAllTranslations() {
    var merged = {};
    for (var key in SPELLING_BEE_SETS) {
        if (SPELLING_BEE_SETS.hasOwnProperty(key)) {
            var t = SPELLING_BEE_SETS[key].translations;
            if (t) {
                for (var word in t) {
                    if (t.hasOwnProperty(word)) {
                        merged[word] = t[word];
                    }
                }
            }
        }
    }
    return merged;
}

// Get words for a specific set by ID.
function getSpellingBeeSet(setId) {
    return SPELLING_BEE_SETS[setId] || null;
}

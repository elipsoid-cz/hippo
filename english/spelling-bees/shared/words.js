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

// Tournament pin — set to true to feature tournament card at top of homepage
var TOURNAMENT_PINNED = true;

var SPELLING_BEE_SETS = {
    "2026-01-26": {
        audio: true,
        cover: true,
        title: "January 26",
        date: "2026-01-26",
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
    "2026-02-02": {
        audio: true,
        cover: true,
        title: "February 2",
        date: "2026-02-02",
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
    "2026-02-09": {
        audio: true,
        cover: true,
        title: "February 9",
        date: "2026-02-09",
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
            "comical": "směšný / legrační",
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
    "2026-02-16": {
        audio: true,
        cover: true,
        title: "February 16",
        date: "2026-02-16",
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
    "2026-02-23": {
        audio: true,
        cover: true,
        title: "February 23",
        date: "2026-02-23",
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
            "project": "školní práce / záměr",
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
    "2026-03-09": {
        audio: true,
        cover: true,
        title: "March 9",
        date: "2026-03-09",
        description: "Geography, nature and science",
        words: [
            "Bridge",
            "Country",
            "Height",
            "Volcano",
            "Weather",
            "Language",
            "Feature",
            "Rainforest",
            "Chemistry",
            "Geography",
        ],
        translations: {
            "bridge": "most",
            "country": "země / venkov",
            "height": "výška",
            "volcano": "sopka",
            "weather": "počasí",
            "language": "jazyk / řeč",
            "feature": "vlastnost / funkce / rys",
            "rainforest": "deštný prales",
            "chemistry": "nauka o látkách",
            "geography": "zeměpis",
        },
    },
    "2026-03-16": {
        audio: true,
        cover: true,
        title: "March 16",
        date: "2026-03-16",
        description: "People, jobs and everyday words",
        words: [
            "Funfair",
            "Journalist",
            "Designer",
            "Photographer",
            "Waiter",
            "Gymnast",
            "Fantastic",
            "Customer",
            "Address",
            "Definitely",
        ],
        translations: {
            "funfair": "pouť / lunapark",
            "journalist": "novinář",
            "designer": "návrhář",
            "photographer": "fotograf",
            "waiter": "číšník",
            "gymnast": "gymnasta",
            "fantastic": "úžasný / skvělý",
            "customer": "zákazník",
            "address": "adresa",
            "definitely": "rozhodně / určitě",
        },
    },
    "2026-03-23": {
        audio: true,
        cover: true,
        title: "March 23",
        date: "2026-03-23",
        description: "People, places and things",
        words: [
            "Condition",
            "Newspaper",
            "Customers",
            "Description",
            "Interesting",
            "Unfriendly",
            "Pictures",
            "Paintings",
            "Detective",
            "Archeologist",
        ],
        translations: {
            "condition": "stav / podmínka",
            "newspaper": "noviny",
            "customers": "zákazníci",
            "description": "popis",
            "interesting": "zajímavý",
            "unfriendly": "nepřátelský / nesympatický",
            "pictures": "obrázky / fotografie",
            "paintings": "obrazy / malby",
            "detective": "vyšetřovatel",
            "archeologist": "archeolog",
        },
    },
    "2026-03-30": {
        audio: true,
        cover: true,
        title: "March 30",
        date: "2026-03-30",
        description: "Varied English Vocabulary Collection",
        words: [
            "Unkind",
            "Jewellery",
            "Palaeontologist",
            "Brooch",
            "Waiter",
            "Doctor",
            "Windmills",
            "Promise",
            "Correctly",
            "Athletics",
        ],
        translations: {
            "unkind": "zlý",
            "jewellery": "šperky",
            "palaeontologist": "vědec studující zkameněliny",
            "brooch": "ozdobná spona na oděv",
            "waiter": "číšník",
            "doctor": "lékař",
            "windmills": "větrné mlýny",
            "promise": "slib",
            "correctly": "správně",
            "athletics": "sportovní soutěže v běhu, skoku a hodu",
        },
    },
    "2026-04-13": {
        audio: true,
        cover: true,
        title: "April 13",
        date: "2026-04-13",
        description: "Don Quijote adventure stories",
        words: [
            "Playwright",
            "Dramatic",
            "Tragedy",
            "Adventurous",
            "Giant",
            "Fantastical",
            "Mistake",
            "Village",
            "Knight",
            "Chivalry",
        ],
        translations: {
            "playwright": "spisovatel divadelních her",
            "dramatic": "působivý",
            "tragedy": "neštěstí",
            "adventurous": "odvážný",
            "giant": "obr",
            "fantastical": "pohádkový",
            "mistake": "chyba",
            "village": "vesnice",
            "knight": "rytíř",
            "chivalry": "rytířství",
        },
    },
    "2026-04-20": {
        audio: true,
        cover: true,
        title: "April 20",
        date: "2026-04-20",
        description: "City places and structures",
        words: [
            "University",
            "Airport",
            "High-Rise Building",
            "Chemist",
            "Theatre",
            "Post Office",
            "Statue",
            "Cardinal Directions",
            "Skyscraper",
            "Location",
        ],
        translations: {
            "university": "Vysoká škola",
            "airport": "Letiště",
            "high-rise building": "Výšková budova",
            "chemist": "Lékárna",
            "theatre": "Divadlo",
            "post office": "Pošta",
            "statue": "Socha",
            "cardinal directions": "Světové strany",
            "skyscraper": "Mrakodrap",
            "location": "Poloha",
        },
    },
};

// Get all unique words across all sets (for tournament mode).
// Deduplicates by lowercase comparison (e.g. "Should" appears in set1 and set2).
function getTournamentAudioMap() {
    var map = {};
    for (var key in SPELLING_BEE_SETS) {
        if (SPELLING_BEE_SETS.hasOwnProperty(key)) {
            var set = SPELLING_BEE_SETS[key];
            if (set.audio) {
                set.words.forEach(function(w) {
                    if (!map[w]) { // první set wins (dedup konzistentní s getAllSpellingBeeWords)
                        map[w] = '../' + key + '/audio/';
                    }
                });
            }
        }
    }
    return map;
}

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

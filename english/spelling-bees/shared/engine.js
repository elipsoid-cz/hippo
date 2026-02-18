// Spelling Bee - Shared Game Engine
// Usage: SpellingBeeEngine.init({ words, setId, title, icon, description })

var SpellingBeeEngine = (function () {
    // --- Configuration (set by init) ---
    var config = {
        words: [],
        setId: "",
        title: "Spelling Bee",
        icon: "\uD83D\uDC1D",
        description: "Listen and spell.",
        maxAttempts: 3,
        masteryThreshold: 3,
    };

    // --- Internal State ---
    var state = {
        currentWords: [],
        currentIndex: 0,
        score: 0,
        attempt: 0,
        streak: 0,
        bestStreak: 0,
        sessionMistakes: [],
        isReviewingError: false,
        mode: "all",
        firstAttemptWrong: false,
    };

    // --- DOM References ---
    var dom = {};

    function cacheDom() {
        dom.welcomeScreen = document.getElementById("welcome-screen");
        dom.gameZone = document.getElementById("game-zone");
        dom.finalScreen = document.getElementById("final-screen");
        dom.headerIcon = document.getElementById("header-icon");
        dom.headerTitle = document.getElementById("header-title");
        dom.headerDesc = document.getElementById("header-desc");
        dom.audioBtn = document.getElementById("audio-btn");
        dom.slowBtn = document.getElementById("slow-btn");
        dom.userInput = document.getElementById("user-input");
        dom.submitBtn = document.getElementById("submit-btn");
        dom.nextBtn = document.getElementById("next-btn");
        dom.feedback = document.getElementById("feedback");
        dom.scoreBar = document.getElementById("score-bar");
        dom.progressFill = document.getElementById("progress-fill");
        dom.finalScore = document.getElementById("final-score");
        dom.mistakesContainer = document.getElementById("mistakes-container");
        dom.mistakesDisplay = document.getElementById("mistakes-display");
        dom.startAllBtn = document.getElementById("start-all-btn");
        dom.startMistakesBtn = document.getElementById("start-mistakes-btn");
        dom.retryMistakesBtn = document.getElementById("retry-mistakes-btn");
        dom.playAgainBtn = document.getElementById("play-again-btn");
        dom.mistakePills = document.getElementById("mistake-pills");
    }

    // =====================
    // localStorage Tracking
    // =====================

    function getStorageKey() {
        return "hippo-spelling-mistakes-" + config.setId;
    }

    function loadMistakes() {
        try {
            var raw = localStorage.getItem(getStorageKey());
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveMistakes(data) {
        try {
            localStorage.setItem(getStorageKey(), JSON.stringify(data));
        } catch (e) {
            /* silently fail in private browsing */
        }
    }

    function recordWrong(word) {
        var data = loadMistakes();
        var key = word.toLowerCase();
        if (!data[key]) {
            data[key] = { count: 0, streak: 0 };
        }
        data[key].count++;
        data[key].streak = 0;
        saveMistakes(data);
    }

    function recordCorrectFirstAttempt(word) {
        var data = loadMistakes();
        var key = word.toLowerCase();
        if (data[key]) {
            data[key].streak++;
            if (data[key].streak >= config.masteryThreshold) {
                delete data[key];
                saveMistakes(data);
                return true; // mastered!
            }
            saveMistakes(data);
        }
        return false;
    }

    function recordCorrectRetry(word) {
        // Correct on 2nd/3rd attempt: add to mistakes (first attempt was wrong), reset streak
        var data = loadMistakes();
        var key = word.toLowerCase();
        if (!data[key]) {
            data[key] = { count: 0, streak: 0 };
        }
        data[key].streak = 0;
        saveMistakes(data);
    }

    function getMistakeWords() {
        var data = loadMistakes();
        var mistakeKeys = {};
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                mistakeKeys[key] = true;
            }
        }
        return config.words.filter(function (w) {
            return mistakeKeys[w.toLowerCase()];
        });
    }

    // =====================
    // Text-to-Speech
    // =====================

    var preferredVoice = null;

    function initVoices() {
        var voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return;

        // Prefer high-quality English voices in order of preference
        var preferred = [
            "Google UK English Female",
            "Google UK English Male",
            "Google US English",
            "Samantha",
            "Daniel",
            "Karen",
            "Moira",
        ];

        for (var i = 0; i < preferred.length; i++) {
            for (var j = 0; j < voices.length; j++) {
                if (voices[j].name === preferred[i]) {
                    preferredVoice = voices[j];
                    return;
                }
            }
        }

        // Fallback: any English voice
        for (var k = 0; k < voices.length; k++) {
            if (voices[k].lang && voices[k].lang.indexOf("en") === 0) {
                preferredVoice = voices[k];
                return;
            }
        }
    }

    function speak(text, slow) {
        window.speechSynthesis.cancel();
        var msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.lang = "en-US";
        msg.rate = slow ? 0.4 : 0.85;
        if (preferredVoice) {
            msg.voice = preferredVoice;
        }
        window.speechSynthesis.speak(msg);
    }

    // =====================
    // Hint System
    // =====================

    function generateHint(correctWord, userInput, attemptNum) {
        var html = "";

        if (attemptNum === 1) {
            // First wrong: show length and first letter
            var len = correctWord.replace(/\s/g, "").length;
            var first = correctWord.charAt(0).toUpperCase();
            html +=
                '<div class="hint-info">' +
                "Starts with <strong>" +
                first +
                "</strong>, " +
                len +
                " letters (excluding spaces)" +
                "</div>";
        } else {
            // Second wrong: letter-by-letter colored feedback
            html += generateLetterFeedback(correctWord, userInput);
        }

        html +=
            '<div class="attempts-info">Try again! (' +
            (config.maxAttempts - attemptNum) +
            " attempt" +
            (config.maxAttempts - attemptNum !== 1 ? "s" : "") +
            " left)</div>";

        return html;
    }

    // Compute alignment between two strings using Levenshtein-style DP.
    // Returns an array of operations: { type: "match"|"substitute"|"insert"|"delete", cIdx, iIdx }
    // "match" = same char at aligned positions
    // "substitute" = different char at aligned positions
    // "insert" = extra char in user input (not in correct word)
    // "delete" = missing char in user input (present in correct word)
    function alignStrings(correct, input) {
        var n = correct.length;
        var m = input.length;
        // DP table
        var dp = [];
        for (var i = 0; i <= n; i++) {
            dp[i] = [];
            for (var j = 0; j <= m; j++) {
                if (i === 0) dp[i][j] = j;
                else if (j === 0) dp[i][j] = i;
                else if (correct[i - 1] === input[j - 1])
                    dp[i][j] = dp[i - 1][j - 1];
                else
                    dp[i][j] =
                        1 +
                        Math.min(
                            dp[i - 1][j - 1], // substitute
                            dp[i - 1][j], // delete (missing in input)
                            dp[i][j - 1], // insert (extra in input)
                        );
            }
        }
        // Traceback
        var ops = [];
        var ci = n;
        var ii = m;
        while (ci > 0 || ii > 0) {
            if (
                ci > 0 &&
                ii > 0 &&
                correct[ci - 1] === input[ii - 1] &&
                dp[ci][ii] === dp[ci - 1][ii - 1]
            ) {
                ops.push({ type: "match", cIdx: ci - 1, iIdx: ii - 1 });
                ci--;
                ii--;
            } else if (
                ci > 0 &&
                ii > 0 &&
                dp[ci][ii] === dp[ci - 1][ii - 1] + 1
            ) {
                ops.push({
                    type: "substitute",
                    cIdx: ci - 1,
                    iIdx: ii - 1,
                });
                ci--;
                ii--;
            } else if (ii > 0 && dp[ci][ii] === dp[ci][ii - 1] + 1) {
                ops.push({ type: "insert", iIdx: ii - 1 });
                ii--;
            } else {
                ops.push({ type: "delete", cIdx: ci - 1 });
                ci--;
            }
        }
        ops.reverse();
        return ops;
    }

    function generateLetterFeedback(correct, input) {
        var cNorm = normalize(correct);
        var iNorm = normalize(input || "");
        var ops = alignStrings(cNorm, iNorm);
        var html = '<div class="hint-container">';

        for (var i = 0; i < ops.length; i++) {
            var op = ops[i];
            if (op.type === "match") {
                var ch = correct[op.cIdx] || cNorm[op.cIdx];
                if (cNorm[op.cIdx] === " ") {
                    html += '<span class="hint-letter hint-space"></span>';
                } else {
                    html +=
                        '<span class="hint-letter hint-correct">' +
                        ch +
                        "</span>";
                }
            } else if (op.type === "substitute") {
                if (cNorm[op.cIdx] === " ") {
                    html += '<span class="hint-letter hint-space"></span>';
                } else {
                    html +=
                        '<span class="hint-letter hint-wrong">_</span>';
                }
            } else if (op.type === "delete") {
                // Letter missing from user input
                if (cNorm[op.cIdx] === " ") {
                    html += '<span class="hint-letter hint-space"></span>';
                } else {
                    html +=
                        '<span class="hint-letter hint-wrong">_</span>';
                }
            }
            // "insert" = extra letter in user input — we skip it (show only correct word structure)
        }

        html += "</div>";
        return html;
    }

    // =====================
    // Animations
    // =====================

    var praises = [
        "Fantastic! \uD83C\uDF89",
        "Super! \u2B50",
        "Amazing! \uD83C\uDF1F",
        "Great job! \uD83D\uDCAA",
        "Excellent! \uD83C\uDF8A",
        "Perfect! \u2728",
        "Brilliant! \uD83C\uDFC5",
        "Awesome! \uD83D\uDE80",
        "Wonderful! \uD83D\uDC8E",
        "Spot on! \uD83C\uDFAF",
    ];

    function randomPraise() {
        return praises[Math.floor(Math.random() * praises.length)];
    }

    function createConfetti(count) {
        var colors = [
            "#f1c40f",
            "#e74c3c",
            "#27ae60",
            "#3498db",
            "#9b59b6",
            "#e67e22",
        ];
        var n = count || 30;
        for (var i = 0; i < n; i++) {
            var piece = document.createElement("div");
            piece.style.cssText =
                "position:fixed;width:10px;height:10px;border-radius:2px;" +
                "pointer-events:none;z-index:9999;" +
                "left:" +
                Math.random() * 100 +
                "vw;" +
                "top:-10px;" +
                "background:" +
                colors[Math.floor(Math.random() * colors.length)] +
                ";" +
                "animation:confettiFall " +
                (2 + Math.random()) +
                "s ease-out forwards;" +
                "animation-delay:" +
                Math.random() * 0.3 +
                "s;";
            document.body.appendChild(piece);
            (function (el) {
                setTimeout(function () {
                    el.remove();
                }, 3500);
            })(piece);
        }
    }

    function showStreakBonus(count) {
        var el = document.createElement("div");
        el.textContent = "\uD83D\uDD25 " + count + "x Streak!";
        el.style.cssText =
            "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);" +
            "font-size:2.5rem;font-weight:bold;color:#f1c40f;" +
            "text-shadow:0 0 20px rgba(241,196,15,0.8);" +
            "z-index:9999;pointer-events:none;" +
            "animation:streakPop 1s ease-out forwards;";
        document.body.appendChild(el);
        setTimeout(function () {
            el.remove();
        }, 1200);
    }

    function showMasteredPopup() {
        var el = document.createElement("div");
        el.textContent = "\uD83C\uDF93 Mastered!";
        el.style.cssText =
            "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);" +
            "font-size:2.8rem;font-weight:bold;color:#27ae60;" +
            "text-shadow:0 0 25px rgba(39,174,96,0.8);" +
            "z-index:9999;pointer-events:none;" +
            "animation:masteredPop 1.5s ease-out forwards;";
        document.body.appendChild(el);
        createConfetti(50);
        setTimeout(function () {
            el.remove();
        }, 1600);
    }

    // =====================
    // Utility
    // =====================

    function normalize(str) {
        return str
            .trim()
            .toLowerCase()
            .replace(/[\u2018\u2019\u0060\u2032]/g, "'");
    }

    function shuffle(array) {
        var arr = array.slice();
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function show(el) {
        if (el) el.classList.remove("hidden");
    }
    function hide(el) {
        if (el) el.classList.add("hidden");
    }

    // =====================
    // Game Flow
    // =====================

    function startGame(wordList, mode) {
        state.currentWords = shuffle(wordList);
        state.currentIndex = 0;
        state.score = 0;
        state.streak = 0;
        state.bestStreak = 0;
        state.sessionMistakes = [];
        state.mode = mode || "all";

        hide(dom.welcomeScreen);
        hide(dom.finalScreen);
        show(dom.gameZone);
        loadWord();
    }

    function loadWord() {
        state.attempt = 0;
        state.isReviewingError = false;
        state.firstAttemptWrong = false;

        if (state.currentIndex >= state.currentWords.length) {
            showFinal();
            return;
        }

        dom.userInput.value = "";
        dom.userInput.readOnly = false;
        dom.userInput.focus();
        dom.feedback.innerHTML = "";
        show(dom.submitBtn);
        hide(dom.nextBtn);
        updateScoreBar();
        updateProgressBar();
        speak(state.currentWords[state.currentIndex], false);
    }

    function checkWord() {
        var input = normalize(dom.userInput.value);
        var correct = normalize(state.currentWords[state.currentIndex]);
        if (input === "") return;

        state.attempt++;

        if (input === correct) {
            // CORRECT
            dom.userInput.readOnly = true;
            hide(dom.submitBtn);

            if (state.attempt === 1) {
                // First attempt correct
                state.score++;
                state.streak++;
                if (state.streak > state.bestStreak)
                    state.bestStreak = state.streak;

                var mastered = recordCorrectFirstAttempt(
                    state.currentWords[state.currentIndex],
                );
                createConfetti();

                if (mastered) {
                    showMasteredPopup();
                    dom.feedback.innerHTML =
                        '<div class="correct">' + randomPraise() + " Mastered!</div>";
                } else {
                    dom.feedback.innerHTML =
                        '<div class="correct">' + randomPraise() + "</div>";
                }

                if (state.streak >= 3) {
                    showStreakBonus(state.streak);
                }
            } else {
                // Correct on retry — still counts as a mistake for session display
                var retryWord = state.currentWords[state.currentIndex];
                if (state.sessionMistakes.indexOf(retryWord) === -1) {
                    state.sessionMistakes.push(retryWord);
                }
                recordCorrectRetry(retryWord);
                state.streak = 0;
                dom.feedback.innerHTML =
                    '<div class="correct">Correct! (on retry)</div>';
            }

            updateScoreBar();
            setTimeout(function () {
                state.currentIndex++;
                loadWord();
            }, 900);
        } else if (state.attempt >= config.maxAttempts) {
            // MAX ATTEMPTS - reveal answer
            dom.userInput.readOnly = true;
            hide(dom.submitBtn);
            state.streak = 0;
            state.isReviewingError = true;

            var word = state.currentWords[state.currentIndex];
            if (state.sessionMistakes.indexOf(word) === -1) {
                state.sessionMistakes.push(word);
            }
            recordWrong(word);

            dom.feedback.innerHTML =
                '<div class="wrong-box">The correct answer is:<br>' +
                '<strong class="correct-answer-text">' +
                word +
                "</strong></div>";
            show(dom.nextBtn);
            dom.nextBtn.focus();
            updateScoreBar();
        } else {
            // WRONG but attempts remain
            state.firstAttemptWrong = true;
            dom.feedback.innerHTML = generateHint(
                state.currentWords[state.currentIndex],
                dom.userInput.value,
                state.attempt,
            );
            dom.userInput.value = "";
            dom.userInput.focus();
        }
    }

    function nextStep() {
        state.currentIndex++;
        loadWord();
    }

    function showFinal() {
        hide(dom.gameZone);
        show(dom.finalScreen);

        var total = state.currentWords.length;
        var text = "Score: " + state.score + " of " + total;
        if (state.bestStreak >= 3) {
            text += " | Best streak: " + state.bestStreak + " \uD83D\uDD25";
        }
        dom.finalScore.textContent = text;

        if (state.sessionMistakes.length > 0) {
            show(dom.mistakesContainer);
            dom.mistakesDisplay.innerHTML = state.sessionMistakes
                .map(function (m) {
                    return "<li>" + m + "</li>";
                })
                .join("");
        } else {
            hide(dom.mistakesContainer);
            // Perfect score celebration
            for (var i = 0; i < 5; i++) {
                (function (idx) {
                    setTimeout(createConfetti, idx * 200);
                })(i);
            }
        }

        // Show/hide retry mistakes based on whether localStorage has mistakes
        var allMistakes = getMistakeWords();
        if (allMistakes.length > 0 && dom.retryMistakesBtn) {
            show(dom.retryMistakesBtn);
            dom.retryMistakesBtn.textContent =
                "Practice Mistakes (" + allMistakes.length + ")";
        } else if (dom.retryMistakesBtn) {
            hide(dom.retryMistakesBtn);
        }
    }

    function updateScoreBar() {
        var parts = [
            "Word: " +
                (state.currentIndex + 1) +
                " / " +
                state.currentWords.length,
            "Score: " + state.score,
        ];
        if (state.streak >= 2) {
            parts.push("\uD83D\uDD25 " + state.streak);
        }
        dom.scoreBar.textContent = parts.join("  |  ");
    }

    function updateProgressBar() {
        if (dom.progressFill) {
            var pct =
                (state.currentIndex / state.currentWords.length) * 100;
            dom.progressFill.style.width = pct + "%";
        }
    }

    // =====================
    // Welcome Screen
    // =====================

    function setupWelcomeScreen() {
        if (dom.headerIcon) dom.headerIcon.textContent = config.icon;
        if (dom.headerTitle) dom.headerTitle.textContent = config.title;
        if (dom.headerDesc) {
            dom.headerDesc.textContent =
                config.description + " (" + config.words.length + " words)";
        }

        var mistakeWords = getMistakeWords();
        if (mistakeWords.length > 0) {
            // Show mode selection
            if (dom.startAllBtn) {
                dom.startAllBtn.textContent =
                    "All Words (" + config.words.length + ")";
            }
            if (dom.startMistakesBtn) {
                show(dom.startMistakesBtn);
                dom.startMistakesBtn.textContent =
                    "Practice Mistakes (" + mistakeWords.length + ")";
            }
            // Show pills
            if (dom.mistakePills) {
                show(dom.mistakePills);
                dom.mistakePills.innerHTML =
                    '<div class="pill-container">' +
                    mistakeWords
                        .map(function (w) {
                            return '<span class="pill">' + w + "</span>";
                        })
                        .join("") +
                    "</div>";
            }
        } else {
            if (dom.startAllBtn) {
                dom.startAllBtn.textContent = "START";
            }
            if (dom.startMistakesBtn) hide(dom.startMistakesBtn);
            if (dom.mistakePills) hide(dom.mistakePills);
        }
    }

    // =====================
    // Event Binding
    // =====================

    function bindEvents() {
        dom.startAllBtn.addEventListener("click", function () {
            startGame(config.words, "all");
        });

        if (dom.startMistakesBtn) {
            dom.startMistakesBtn.addEventListener("click", function () {
                var mistakeWords = getMistakeWords();
                if (mistakeWords.length > 0) {
                    startGame(mistakeWords, "mistakes");
                }
            });
        }

        dom.audioBtn.addEventListener("click", function () {
            speak(state.currentWords[state.currentIndex], false);
            dom.userInput.focus();
        });

        if (dom.slowBtn) {
            dom.slowBtn.addEventListener("click", function () {
                speak(state.currentWords[state.currentIndex], true);
                dom.userInput.focus();
            });
        }

        dom.submitBtn.addEventListener("click", checkWord);

        dom.nextBtn.addEventListener("click", nextStep);

        if (dom.retryMistakesBtn) {
            dom.retryMistakesBtn.addEventListener("click", function () {
                var allMistakes = getMistakeWords();
                if (allMistakes.length > 0) {
                    startGame(allMistakes, "mistakes");
                }
            });
        }

        if (dom.playAgainBtn) {
            dom.playAgainBtn.addEventListener("click", function () {
                hide(dom.finalScreen);
                show(dom.welcomeScreen);
                setupWelcomeScreen();
            });
        }

        dom.userInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                if (state.isReviewingError) {
                    nextStep();
                } else {
                    checkWord();
                }
            }
        });
    }

    // =====================
    // Public API
    // =====================

    return {
        init: function (userConfig) {
            for (var key in userConfig) {
                if (userConfig.hasOwnProperty(key)) {
                    config[key] = userConfig[key];
                }
            }
            cacheDom();
            // Initialize TTS voices (may load async)
            initVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = initVoices;
            }
            setupWelcomeScreen();
            bindEvents();
        },
    };
})();

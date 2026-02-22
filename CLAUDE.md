# Claude Instructions for Hippo Project

## Project Overview
Hippo 🦛 is an interactive web application for English language learning with practice exercises.

## Project Structure
- `index.html` - Main landing page with links to all exercises
- `english/spelling-bees/` - Spelling practice exercises with audio
- `english/grammar/` - Grammar exercises (irregular verbs, comparatives)

## Technology Stack
- HTML5
- CSS3 (Custom Properties)
- Vanilla JavaScript
- Web Speech API (Text-to-Speech)
- Firebase Firestore (leaderboard backend)

## Development Guidelines
- Keep exercises simple and focused on one topic
- Use consistent styling with CSS variables from main index.html
- Each exercise should be self-contained in its own directory
- Use emoji icons for visual appeal (🐝, 📝, 🚀, etc.)
- Follow naming convention: `YYYY-MM-DD-topic` for dated exercises

## Git Workflow
- Main branch: `main`
- Remote: https://github.com/elipsoid-cz/hippo.git
- Keep commits focused and descriptive
- Use Czech language for commit messages when working with Czech user

## File Organization
Each exercise should have:
- Its own `index.html` file
- Self-contained styling and scripts
- Clear title and instructions
- Score tracking and feedback

## Spelling Bee Shared Engine
- `english/spelling-bees/shared/engine.js` - core game logic (IIFE, `SpellingBeeEngine`)
- `english/spelling-bees/shared/words.js` - word sets + Firebase config
- `english/spelling-bees/shared/styles.css` - shared styles
- Each week: `english/spelling-bees/YYYY-MM-DD/index.html` (loads shared engine)

## Leaderboard (Firebase Firestore)
- **Firebase projekt:** `hippo-cz` (free Spark tier)
- **Config:** `FIREBASE_CONFIG` in `words.js`, SDK loaded dynamically in engine.js
- **Firestore structure:** `leaderboards/{setId}/scores/{nicknameKey}`
- **Document fields:** `{ nickname, score, total, totalAttempts, bestStreak, date }`
- **Ranking:** score% desc > totalAttempts asc > bestStreak desc > date asc
- **Score update:** new score overwrites old only if better (higher %, fewer attempts, or higher streak)
- **UX:** Nickname prompted on final screen only (not before game), pre-filled from localStorage
- **Display:** Leaderboard visible on both welcome and final screens; empty state shows "No scores yet — be the first!"
- **Practice Mistakes:** Leaderboard hidden and scores not saved in Practice Mistakes mode (`state.mode !== "all"`)
- **Security:** Firebase API key is intentionally public; security enforced by Firestore rules; key restricted to `elipsoid-cz.github.io/*`

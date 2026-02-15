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

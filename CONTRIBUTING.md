# Contributing to Todo App

Thanks for considering contributing! This document covers the basic
guidelines, workflows and conventions to make your contributions smooth and
consistent.

## Getting Started
1. **Fork & clone** the repository if you're working outside the main team.
   ```bash
   git clone https://github.com/<your-user>/Todo-App.git
   cd Todo-App
   ```
2. **Install server dependencies** (frontend has no build step):
   ```bash
   cd server
   npm install
   cd ..
   ```
3. **Start the development servers**:
   - Backend: `cd server && npm run dev` (runs on http://localhost:3000)
   - Frontend: serve the root directory (`python3 -m http.server 8000` or
equivalent)

### Branching
- Create feature branches off `main` using descriptive names:
  `feature/user-auth`, `bugfix/sync-timeout`.
- Keep your branch up to date with `main` (rebase or merge regularly).

### Code Style
- **Frontend**: vanilla JavaScript, ES6+, 2-space indentation, semicolons,
  camelCase identifiers.
- **Backend**: Node.js with Express, same formatting rules; prefer `const` for
  imports and helper functions.
- Write clear JSDoc comments for new functions; existing code follows this
  pattern, especially in `script.js` and `server/index.js`.

### Testing
- No formal test suite yet; maintainers rely on manual checks.
- After changes, manually verify:
  - Frontend behavior (add/edit/delete tasks, filters, theme toggle).
  - Sync with the server (run the backend and inspect `db.sqlite`).
  - Migration if relevant (clear DB and localStorage to repeat).

### Commits & Pull Requests
- Keep commits focused and atomic.
- Use descriptive commit messages in the style of:
  `Add category filter to task list` or `Fix crash when syncing offline`.
- Open a PR against `main` with a clear description of what you changed and
  why. Include screenshots if relevant for UI work.

### Issues & Discussions
- Report bugs or request features via GitHub issues.
- Before opening a new issue, search existing issues to avoid duplicates.
- Label your issue appropriately (bug, enhancement, question).

### General Guidelines
- **Keep it simple**: This project values minimalism. Avoid introducing heavy
  dependencies or complex frameworks.
- **Document**: Add or update relevant documentation (`README.md`,
  `API.md`, `DEVELOPMENT.md`, `ARCHITECTURE.md`, etc.) when behavior changes.
- **Respect existing patterns**: Follow the data flow and sync strategy already
  in place; discuss architectural changes before implementing them.

Thanks again for helping improve the Todo App! Your contributions are
appreciated. If you have questions, reach out via issue or comment on an
existing thread.
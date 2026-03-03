# Todo App - AI Agent Guidelines

## Code Style

- **Frontend**: Vanilla JavaScript (ES6+), no frameworks. See [script.js](../script.js) for patterns.
- **Backend**: Node.js with Express. Keep endpoints RESTful and stateless.
- **Styling**: Pure CSS with theme support. Light/dark mode toggle in [style.css](../style.css) uses `data-theme` attribute.
- **Database**: SQLite with `better-sqlite3`. Schema in [server/index.js](../server/index.js) lines 16–26.
- **Formatting**: Use 2-space indentation, semicolons, camelCase for variables/functions.

## Architecture

**Frontend** (`index.html`, `script.js`, `style.css`):
- Client-side rendering with state variables: `todos`, `currentFilter`, `currentCategoryFilter`
- Offline-first: localStorage fallback when server unavailable
- Auto-sync on every save with `POST /api/sync` endpoint
- Health check via periodic `GET /api/health` (every 10 seconds if `needsSync`)

**Backend** (`server/`):
- Express server with SQLite persistence
- Data lifecycle: todos table (id, text, state, category, created_at, updated_at)
- CORS enabled for cross-origin requests from frontend
- Three sync strategies: `POST /api/sync` (full state), `POST /api/migrate` (import), GET `/api/todos` (load)

**Data Flow**:
1. User action (add/edit/delete) → `script.js` modifies `todos` array
2. `saveTodos()` → localStorage immediately, then async `POST /api/sync` to server
3. Server sync fails → `needsSync = true`, retry every 10 seconds
4. App startup → `loadTodosFromServerOrLocal()` attempts server, falls back to localStorage

## Build and Test

**Frontend**: No build step required.
```bash
# Serve locally
python3 -m http.server 8000
# Or: npx http-server
# Visit http://localhost:8000
```

**Backend**:
```bash
cd server
npm install
npm run dev
# Starts on http://localhost:3000 with auto-reload via nodemon
```

**Testing Endpoints** (with curl):
```bash
# Get all todos
curl http://localhost:3000/api/todos

# Create new todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"text":"Buy milk","state":"plan","category":"personal"}'

# Update a todo
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"text":"Buy milk and eggs","state":"done"}'

# Health check
curl http://localhost:3000/api/health
```

## Project Conventions

**Task State Lifecycle** (see [script.js](../script.js) line ~190):
- States: `plan` → `todo` → `done` → back to `plan` (cycles)
- UI shows as badge; click to cycle state
- State changes trigger `saveTodos()`

**Categories** (three fixed values):
- `trabajo`, `personal`, `estudio`
- Default: `personal` for new tasks
- Inline select dropdown in task row

**Filtering** (both filters are independent):
- State filter: All, Plan, To Do, Done (affects `currentFilter`)
- Category filter: All categories, Trabajo, Personal, Estudio (affects `currentCategoryFilter`)
- `renderTodos()` applies both filters together (see [script.js](../script.js) line ~250)

**Inline Editing**:
- Task text: `contentEditable` span, saved on blur or Enter key
- Category: Dropdown select, saves on change
- Updates call `saveTodos()` immediately

## Integration Points

**Client-Server Communication**:
1. **Load**: `GET /api/todos` — Initialize `todos` array on startup
2. **Sync**: `POST /api/sync` — Push complete state (bulk replace), include all todos in body
3. **Migrate**: `POST /api/migrate` — One-time import from localStorage (409 if data exists)
4. **Create**: `POST /api/todos` — Single task creation (alternative to sync)
5. **Update/Delete**: `PUT /api/todos/:id`, `DELETE /api/todos/:id` — Per-item operations

**API URL Configuration**:
- Client: `const API_URL = 'http://localhost:3000/api'` (see [script.js](../script.js) line 11)
- Server: `const PORT = process.env.PORT || 3000` (see [server/index.js](../server/index.js) line 211)

**CORS**: Enabled server-wide (see [server/index.js](../server/index.js) line 11). Restrict in production with specific origin.

## Documentation

In addition to this instruction file, the repository includes several
supporting documents for different audiences:

- `ARCHITECTURE.md` – high-level system architecture and data flow overview.
- `PRODUCT.md` – concise feature summary written for product/stakeholder review.
- `CONTRIBUTING.md` – developer guidelines, workflows, and best practices.

Refer to these files when you need context beyond code or setup.

## Common Tasks

**Adding a feature (e.g., priority levels)**:
1. **Client**: Add `priority` field to todo objects (default: 'medium') in state initialization
2. **UI**: Add priority selector in `renderTodos()` alongside category select
3. **Server**: Add migration SQL to schema (ALTER TABLE) and include field in INSERT/SELECT queries
4. **Endpoints**: Update all API endpoints to accept and return priority field
5. **Test**: Create task with priority, edit it, refresh browser—verify localStorage and server sync

**Debugging offline/sync issues**:
- Check `serverAvailable` flag: should be `true` if server is reachable
- Check `needsSync` flag: should be `false` after successful sync
- DevTools Console: logs indicate "Loaded from server" or "offline mode"
- Open DevTools → Application → Local Storage → inspect `todos` JSON

**Migrating data**:
- Automatic: Start server first, app auto-migrates on load if server is empty
- Manual: Use `POST /api/migrate` endpoint or browser console script (see [MIGRATION.md](../MIGRATION.md))

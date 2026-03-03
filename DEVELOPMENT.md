# Development Guide

Setup and development notes for extending the Todo App.

## Project Overview

**Frontend** (`index.html`, `script.js`, `style.css`):
- Vanilla JavaScript, no frameworks
- localStorage fallback for offline
- Auto-sync with server when available
- Responsive design with dark theme support

**Backend** (`server/`):
- Node.js + Express
- SQLite for persistence
- RESTful API design
- CORS enabled for cross-origin requests

## Development Setup

### 1. Clone/Open Repository
```bash
cd /Users/sebastian93/Desktop/todo-app
```

### 2. Frontend Setup (Client)
No build step needed. Simply open `index.html` in a browser or serve it:

```bash
# Simple HTTP server
python3 -m http.server 8000

# Or use Node's http-server
npx http-server

# Visit http://localhost:8000
```

### 3. Backend Setup (Server)
```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:3000` with auto-reload via nodemon.

## Project Structure

```
todo-app/
├── index.html                  # Frontend entry point
├── script.js                   # Core client logic
├── style.css                   # Styling (light/dark themes)
├── server/
│   ├── index.js                # Express server + endpoints
│   ├── package.json            # Dependencies
│   ├── db.sqlite               # SQLite database (auto-created)
│   ├── README.md               # Server setup
│   └── API.md                  # API specification
├── README.md                   # Project README
├── MIGRATION.md                # Data migration guide
├── DEVELOPMENT.md              # This file
└── .gitignore (optional)       # Ignore node_modules, db.sqlite, etc
```

## Key Code Files & Functions

### Frontend (script.js)

**Global Variables:**
- `todos` — Array of task objects
- `currentFilter` — Current state filter (all, plan, todo, done)
- `currentCategoryFilter` — Current category filter (all, trabajo, personal, estudio)
- `serverAvailable` — Boolean, whether server is reachable
- `needsSync` — Boolean, whether local changes need server sync

**Key Functions:**

1. **`loadTodosFromServerOrLocal()`**
   - Attempts to load from server `/api/todos`
   - Falls back to localStorage if server unavailable
   - Sets `serverAvailable` flag

2. **`saveTodos()`**
   - Saves to localStorage immediately
   - Attempts async sync to server via `POST /api/sync`
   - Sets `needsSync = true` if sync fails
   - Periodic retry every 10 seconds if needed

3. **`migrateTodos(list)`**
   - Adds missing `category` property (default: 'personal')
   - Persists to localStorage

4. **`attemptMigration()`**
   - On startup, tries to import localStorage data to server
   - Calls `POST /api/migrate` if server is empty
   - Skips if server already has data

5. **`addTodo()`, `deleteTodo(id)`, `cycleState(id)`**
   - Create, delete, and cycle task state
   - All call `saveTodos()` for persistence

6. **`renderTodos()`**
   - Filters todos by state and category
   - Creates inline editable UI with:
     - State badge (clickable to cycle state)
     - Text span (contentEditable)
     - Category select dropdown
     - Delete button
   - Inline edits on blur/Enter trigger `saveTodos()`

### Backend (server/index.js)

**Database:**
- SQLite table `todos` with columns: `id`, `text`, `state`, `category`, `created_at`, `updated_at`
- `initializeDatabase()` — Creates table if not exists

**Endpoints:**

1. **`GET /api/todos`**
   - Returns all todos as JSON array
   - Useful for client load/sync

2. **`POST /api/todos`**
   - Creates new todo with provided text, state, category
   - Returns created todo with assigned ID

3. **`PUT /api/todos/:id`**
   - Updates todo (text, state, or category)
   - Returns updated todo

4. **`DELETE /api/todos/:id`**
   - Deletes todo by ID
   - Returns 204 No Content

5. **`POST /api/sync`**
   - Bulk operation: deletes all server todos and inserts new list
   - Used when client wants to push complete state
   - Returns new server state

6. **`POST /api/migrate`**
   - Imports array of todos (one-time operation)
   - Fails with 409 if server already has data
   - Returns imported todos

7. **`GET /api/health`**
   - Health check endpoint
   - Returns `{ "status": "ok", "timestamp": "..." }`

## Configuration

### Client Configuration
Edit `script.js` to change:
```javascript
const API_URL = 'http://localhost:3000/api';  // Server API base
const SERVER_TIMEOUT = 5000;                   // Request timeout (ms)
```

### Server Configuration
Edit `server/index.js` to change:
```javascript
const PORT = process.env.PORT || 3000;         // Server port
// CORS: app.use(cors({ origin: '...' }))    // Restrict origins if needed
```

## Development Workflow

### Adding a New Feature

**Example: Add priority levels to tasks**

1. **Update data model** (client):
   - Add `priority` field to todo objects in `script.js` (default: 'medium')

2. **Update UI** (client):
   - Add priority selector in `renderTodos()` alongside category select
   - Handle priority changes with event listener → `saveTodos()`

3. **Update database** (server):
   - Add migration to add `priority` column to `todos` table in `server/index.js`:
     ```javascript
     db.prepare('ALTER TABLE todos ADD COLUMN priority TEXT DEFAULT "medium"').run();
     ```
   - Update INSERT/SELECT queries to include `priority`

4. **Update API** (server):
   - Ensure endpoints accept and return `priority` field
   - Test with curl:
     ```bash
     curl -X POST http://localhost:3000/api/todos \
       -H "Content-Type: application/json" \
       -d '{"text":"Task","priority":"high","category":"trabajo"}'
     ```

5. **Test**:
   - Create task with priority, edit it, refresh browser
   - Check localStorage and server DB

### Adding Multi-User Support

To extend for multi-user (requires authentication):

1. **Add user table** (server):
   ```javascript
   db.prepare(`
     CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY,
       username TEXT UNIQUE,
       password_hash TEXT
     )
   `).run();
   ```

2. **Add user_id to todos** (server):
   ```javascript
   db.prepare('ALTER TABLE todos ADD COLUMN user_id INTEGER').run();
   ```

3. **Add JWT auth** (server):
   ```bash
   npm install jsonwebtoken
   ```
   - Implement `/auth/login` and `/auth/register` endpoints
   - Verify JWT on todo endpoints

4. **Update client** (script.js):
   - Store JWT in localStorage
   - Send `Authorization: Bearer <token>` header with API requests
   - Handle 401 Unauthorized → redirect to login

### Performance Considerations

**Client:**
- Use `debounce()` on inline edits to reduce save frequency
- Batch multiple changes before syncing
- Use request queueing for offline scenarios

**Server:**
- Add indexes on `user_id`, `created_at` for queries
- Implement pagination for large todo lists: `GET /api/todos?limit=50&offset=0`
- Consider compression middleware: `npm install compression`

## Testing

### Manual Testing Checklist

```
✓ Create todo with each category
✓ Edit todo text inline
✓ Change category via dropdown
✓ Cycle task state (Plan → To Do → Done)
✓ Delete task
✓ Filter by state
✓ Filter by category
✓ Combined filters (state + category)
✓ Toggle dark/light theme (persists)
✓ Refresh page → data persists

[ Server running ]
✓ Create task → appears in server DB
✓ Edit task on Browser A → appears on Browser B after refresh
✓ Stop server → continue using app (offline mode)
✓ Start server → offline changes sync
✓ Migrate existing tasks

[ Server not running ]
✓ App works with localStorage
✓ Sync retry when server comes online
```

### Testing Endpoints with curl

```bash
# Health check
curl http://localhost:3000/api/health

# Get todos
curl http://localhost:3000/api/todos

# Create todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"text":"Test task","state":"plan","category":"personal"}'

# Update todo (replace ID with real one)
curl -X PUT http://localhost:3000/api/todos/1707336000000 \
  -H "Content-Type: application/json" \
  -d '{"state":"done"}'

# Delete todo
curl -X DELETE http://localhost:3000/api/todos/1707336000000

# Sync all todos (replace with real list)
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '[{"id":123,"text":"Task","state":"plan","category":"personal"}]'
```

### Inspecting the Database

```bash
sqlite3 server/db.sqlite

# Inside sqlite3 prompt:
sqlite> SELECT * FROM todos;
sqlite> SELECT id, text, state, category FROM todos WHERE category = 'trabajo';
sqlite> DELETE FROM todos;  -- Clear all (careful!)
sqlite> .quit
```

## Debugging

### Browser DevTools

1. **Console**:
   - App logs sync status: `✓ Loaded todos from server`
   - Warnings: `Server unavailable. Loading from localStorage`

2. **Network tab**:
   - Inspect `/api/todos`, `/api/sync` requests
   - Check response status and payload

3. **Storage/Application tab**:
   - View localStorage key `todos` (JSON array)
   - View localStorage key `theme` (dark | light)

### Server Logs

When running `npm run dev`, you'll see:
```
🚀 Todo App Server running on http://localhost:3000
[timestamp] GET /api/todos 200
[timestamp] POST /api/sync 200
```

To debug further, add console.log statements or use a debugger:
```bash
node --inspect-brk server/index.js
# Then open chrome://inspect
```

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Tasks not syncing | Server unreachable | Check port 3000, `npm run dev` in `/server` |
| CORS error | Browser blocking request | Ensure `cors()` middleware in `server/index.js` |
| Database locked | Another process using DB | Stop server, delete `db.sqlite`, restart |
| Port 3000 in use | Another app using port | `PORT=3001 npm start` |
| Tasks lost after refresh | localStorage cleared | Check browser storage settings |

## File Editing Tips

- **Client-side**: Most changes in `script.js`; test with browser console
- **Styles**: `style.css`; hot-reload works in browsers (just refresh)
- **Server**: `server/index.js`; changes require restart `npm run dev`
- **Database schema**: Changes require migration logic or deleting `db.sqlite`

## Next Steps

**Suggested Features:**
- [ ] Task due dates / scheduling
- [ ] Task priority levels
- [ ] Task tags / multiple categories per task
- [ ] Search/filter by text
- [ ] Task statistics / charts
- [ ] User accounts & multi-user sync
- [ ] Task notifications / reminders
- [ ] Recurring tasks

---

**Questions?** See [README.md](./README.md), [server/API.md](./server/API.md), or [MIGRATION.md](./MIGRATION.md).

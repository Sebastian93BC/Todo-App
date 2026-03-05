# Todo App

A modern, responsive task management application with local central storage, categorization, and offline support.


## Features

✨ **Core Features:**
- ✅ Create, read, update, delete tasks
- 📂 Three task categories: **Trabajo**, **Personal**, **Estudio**
- 🔄 Task states: Plan, To Do, Done
- ✏️ Inline editing for task text and category
- 🌙 Dark/light theme support

💾 **Storage & Sync:**
- 📱 **Client-side**: Browser localStorage (fast, offline)
- 🖥️ **Server-side**: Local Express + SQLite server (central storage, multi-browser)
- 🔄 Automatic sync with fallback to offline mode
- 📦 One-time migration from localStorage to server

## Quick Start

### Prerequisites
- **Frontend**: Any modern web browser
- **Backend (optional)**: Node.js v16+ and npm

### Option 1: Client-Only (localStorage)

1. Open `index.html` in your browser:
   ```bash
   # macOS: open index.html
   # Or use a simple server:
   python3 -m http.server 8000
   # Then visit http://localhost:8000
   ```

2. Start creating tasks—they persist in your browser.

**Note**: Tasks are stored per browser/profile. Opening in a different browser won't show the same tasks.

### Option 2: With Central Server (Recommended for multi-browser sync)

#### 1. Start the Server

```bash
cd server
npm install
npm run dev
```

Server starts on `http://localhost:3000`.

#### 2. Open the Client

```bash
# In another terminal, from project root:
python3 -m http.server 8000
# Visit http://localhost:8000
```

#### 3. Optional: Migrate Existing Tasks

If you have tasks in localStorage and the server is empty, they will be automatically migrated on first load.

For manual migration, see [MIGRATION.md](./MIGRATION.md).

## Project Structure

```
todo-app/
├── index.html              # Frontend HTML
├── script.js               # Frontend logic (browser + API sync)
├── style.css               # Styling (light & dark themes)
├── ARCHITECTURE.md         # High-level architecture overview
├── server/
│   ├── index.js            # Express server + endpoints
│   ├── package.json        # Server dependencies
│   ├── db.sqlite           # SQLite database (auto-created)
│   ├── README.md           # Server setup guide
│   └── API.md              # API specification
├── README.md               # This file
├── MIGRATION.md            # Data migration guide
└── DEVELOPMENT.md          # Development notes
```

## Usage

### Creating Tasks
1. Type in the input field: "What needs to be done?"
2. Select category from dropdown: Trabajo, Personal, or Estudio
3. Click **Add Task** or press Enter

### Managing Tasks
- **Change state**: Click the state badge (Plan → To Do → Done)
- **Edit text**: Click the task text to edit inline (press Enter or click away to save)
- **Change category**: Use the inline dropdown to reassign category
- **Delete**: Click the trash icon

### Filtering
- **By state**: Use filter buttons (All, Plan, To Do, Done)
- **By category**: Use the category filter dropdown (All categories, Trabajo, Personal, Estudio)
- **Combined**: Both filters work together

### Theme
- Click the 🌙/☀️ button to toggle between light and dark themes

## Server API

The backend provides REST endpoints for task management:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/todos` | List all tasks |
| POST | `/api/todos` | Create a new task |
| PUT | `/api/todos/:id` | Update a task |
| DELETE | `/api/todos/:id` | Delete a task |
| POST | `/api/sync` | Bulk replace all tasks |
| POST | `/api/migrate` | Import tasks from client |
| GET | `/api/health` | Server health check |

See [server/API.md](./server/API.md) for detailed endpoint documentation and examples.

## Offline Mode

If the server is unavailable:
- ✅ Tasks continue to work (stored in localStorage)
- ⏳ Changes sync to server automatically when it becomes available
- 🔔 App attempts sync every 10 seconds

## Data Persistence

### localStorage Structure
```json
[
  {
    "id": 1707336000000,
    "text": "Complete project",
    "state": "todo",
    "category": "trabajo"
  }
]
```

### Database Schema (Server)
```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,
  state TEXT DEFAULT 'plan',
  category TEXT DEFAULT 'personal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Development

For development setup, running tests, and extending the app, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Migration Guide

To migrate existing tasks from localStorage to the server, see [MIGRATION.md](./MIGRATION.md).

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Tasks not syncing to server?
1. Ensure server is running: `npm run dev` in `/server`
2. Check browser DevTools console for errors
3. Verify server is on `http://localhost:3000` (or update `API_URL` in `script.js`)

### Tasks missing after refresh?
- **With server**: Check that server DB has data: `sqlite3 server/db.sqlite "SELECT * FROM todos;"`
- **Without server**: Check browser's localStorage in DevTools (Application tab)

### Server won't start?
- Port 3000 already in use? `PORT=3001 npm start`
- Missing dependencies? `npm install` in `/server`
- SQLite build failed? On macOS, `xcode-select --install`

## License

MIT

---

**Need help?** See [server/README.md](./server/README.md), [MIGRATION.md](./MIGRATION.md), or [DEVELOPMENT.md](./DEVELOPMENT.md).

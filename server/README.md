# Todo App Server

Central storage backend for the Todo App using **Express** and **SQLite**.

## Prerequisites

- Node.js (v16+) and npm
- macOS, Linux, or Windows

## Installation

```bash
cd server
npm install
```

This installs:
- `express` - Web framework
- `cors` - CORS middleware  
- `morgan` - HTTP request logger
- `better-sqlite3` - SQLite database driver (Recommended)
- `nodemon` - Auto-reload in development (dev dependency)

**Note on better-sqlite3**: It has native C++ bindings. On macOS, Xcode Command Line Tools are required:
```bash
xcode-select --install
```

## Running the Server

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

The server starts on **http://localhost:3000** by default.

To use a different port:
```bash
PORT=5000 npm start
```

## Database

- **Location**: `server/db.sqlite` (created automatically on first run)
- **Schema**: Single table `todos` with columns:
  - `id` (INTEGER PRIMARY KEY)
  - `text` (TEXT, must be non-empty)
  - `state` (TEXT: 'plan', 'todo', 'done')
  - `category` (TEXT: 'trabajo', 'personal', 'estudio')
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

### Inspect the Database

```bash
# Using sqlite3 CLI (if installed)
sqlite3 server/db.sqlite

# Inside sqlite3 prompt
sqlite> SELECT * FROM todos;
sqlite> .quit
```

## API Endpoints

See [API.md](./API.md) for full endpoint documentation.

**Quick reference:**
- `GET /api/todos` — List all todos
- `POST /api/todos` — Create a new todo
- `PUT /api/todos/:id` — Update a todo
- `DELETE /api/todos/:id` — Delete a todo
- `POST /api/sync` — Bulk replace all todos
- `POST /api/migrate` — One-time import from client
- `GET /api/health` — Server health check

## CORS Configuration

CORS is enabled by default to allow requests from any origin. Modify the `cors()` middleware call in `server/index.js` if you need to restrict origins:

```javascript
app.use(cors({
  origin: 'http://localhost:8000'
}));
```

## Troubleshooting

### Port already in use
```bash
# Change port
PORT=3001 npm start
```

### Database locked / corruption
Delete `db.sqlite` and restart the server (data will be lost; use migration export if needed):
```bash
rm db.sqlite
npm start
```

### Module not found errors
Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development

For development notes, testing, and extending the server, see [../DEVELOPMENT.md](../DEVELOPMENT.md).

## Client Integration

The client ([../script.js](../script.js)) automatically syncs with this server when available, falling back to local `localStorage` if the server is unreachable.

To migrate existing localStorage todos to the server, see [../MIGRATION.md](../MIGRATION.md).

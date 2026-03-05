# Data Migration Guide

How to migrate existing tasks from browser localStorage to the central server.

## Automatic Migration (Recommended)

When you start the server and open the app:

1. **Server is empty** (first time): Client tasks are automatically imported via `POST /api/migrate`
2. **Both have data**: Manual merge required (see below)

If automatic migration succeeds, you'll see in the browser DevTools console:
```
✓ Migrated local todos to server
```

## Manual Migration

### Option 1: Using Browser Console

If automatic migration fails or you want explicit control:

1. Open the app in your browser
2. Open **DevTools** (F12 or Cmd+Option+I)
3. Go to **Console** tab
4. Run this script:

```javascript
(async function migrateToServer() {
  const local = JSON.parse(localStorage.getItem('todos') || '[]');
  
  if (!local.length) {
    return alert('No local todos found');
  }

  try {
    const res = await fetch('http://localhost:3000/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(local)
    });

    if (res.status === 409) {
      // Server has existing todos
      alert('Server already has todos. Use /api/sync endpoint instead or merge manually.');
      return;
    }

    if (res.ok) {
      const migrated = await res.json();
      localStorage.setItem('todos', JSON.stringify(migrated));
      alert(`✓ Migrated ${migrated.length} tasks to server`);
      window.location.reload();
    } else {
      alert('Migration failed: ' + res.statusText);
    }
  } catch (err) {
    alert('Migration error: ' + err.message);
  }
})();
```

5. Press Enter and follow the instructions

### Option 2: Using curl

Export and import tasks via command line:

1. **Export local tasks** (from DevTools console):
   ```javascript
   console.log(JSON.stringify(JSON.parse(localStorage.getItem('todos'))))
   ```
   Copy the output and save to a file: `todos.json`

2. **Import via curl**:
   ```bash
   curl -X POST http://localhost:3000/api/migrate \
     -H "Content-Type: application/json" \
     -d @todos.json
   ```

3. If successful, you'll see the imported tasks in the response

### Option 3: Using Postman or Thunder Client

1. Create a POST request to `http://localhost:3000/api/migrate`
2. Set header: `Content-Type: application/json`
3. Paste the JSON array from `localStorage.getItem('todos')` as the body
4. Send the request

## Handling Conflicts (Both Client and Server Have Data)

If the server already has todos when you try to migrate:

### Strategy A: Server is Canonical (Recommended)
Server data is authoritative; client data is discarded:
```javascript
// In browser console
location.reload(); // Reload app; it will sync with server
```

### Strategy B: Client Override (Merge & Replace)
Replace all server data with client data:
```javascript
const local = JSON.parse(localStorage.getItem('todos'));
fetch('http://localhost:3000/api/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(local)
}).then(r => r.json()).then(() => alert('Synced client to server'));
```

### Strategy C: Manual Merge
Combine both datasets:
1. Export server todos: `curl http://localhost:3000/api/todos`
2. Manually merge with local todos (by ID or timestamp)
3. Import merged result via `/api/sync`

## After Migration

1. **Verify**: Check DevTools → Application → Local Storage:
   - Should see key `todos` (array of objects)
   - Each object has: `id`, `text`, `state`, `category`

2. **Verify server**:
   ```bash
   sqlite3 server/db.sqlite "SELECT COUNT(*) FROM todos;"
   ```
   Should show the number of migrated tasks

3. **Test sync**:
   - Create a new task
   - Switch to a different browser
   - Refresh the page
   - New task should appear (if server is running)

## Troubleshooting

### "Server already has todos"
- Server `/api/migrate` endpoint only works when server is empty
- **Fix**: Use `/api/sync` instead (replaces all server data)
  ```bash
  curl -X POST http://localhost:3000/api/sync \
    -H "Content-Type: application/json" \
    -d @todos.json
  ```

### Migration appears successful but tasks don't appear
- Ensure the server is still running: `npm run dev` in `/server`
- Refresh the browser (`Cmd+R` or `Ctrl+F5`)
- Check `/api/health` endpoint: `curl http://localhost:3000/api/health`

### "Failed to migrate: CORS error"
- Server CORS is misconfigured
- Ensure `/server/index.js` has `app.use(cors())`
- Restart server: Stop and run `npm run dev` again

### Lost data after migration
- **Prevent this**: Always backup localStorage first
  ```javascript
  // Backup to file
  const backup = JSON.stringify(JSON.parse(localStorage.getItem('todos')));
  console.log('Backup:', backup);
  // Copy output to a text file
  ```

## Rollback

If you need to restore tasks to localStorage:

1. Get tasks from server:
   ```bash
   curl http://localhost:3000/api/todos > todos.json
   ```

2. Restore in browser DevTools console:
   ```javascript
   const todos = [/* paste server response here */];
   localStorage.setItem('todos', JSON.stringify(todos));
   window.location.reload();
   ```

---

**Questions?** See [README.md](./README.md) or [server/README.md](./server/README.md).

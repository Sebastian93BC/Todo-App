# Todo App API Specification

Base URL: `http://localhost:3000`

## Endpoints

### 1. GET /api/todos

Retrieve all todos.

**Request:**
```http
GET /api/todos
```

**Response:**
```json
[
  {
    "id": 1707336000000,
    "text": "Buy groceries",
    "state": "plan",
    "category": "personal"
  },
  {
    "id": 1707336001000,
    "text": "Complete project",
    "state": "todo",
    "category": "trabajo"
  }
]
```

**Status:** 200 OK

---

### 2. POST /api/todos

Create a new todo.

**Request:**
```http
POST /api/todos
Content-Type: application/json

{
  "text": "Learn Node.js",
  "state": "plan",
  "category": "estudio"
}
```

**Parameters:**
- `text` (required, string, non-empty): Task description
- `state` (optional, string): 'plan' | 'todo' | 'done' (default: 'plan')
- `category` (optional, string): 'trabajo' | 'personal' | 'estudio' (default: 'personal')

**Response:**
```json
{
  "id": 1707336002000,
  "text": "Learn Node.js",
  "state": "plan",
  "category": "estudio"
}
```

**Status:** 201 Created

**Error Responses:**
- 400 Bad Request — Missing or empty text field
- 500 Internal Server Error

---

### 3. PUT /api/todos/:id

Update an existing todo.

**Request:**
```http
PUT /api/todos/1707336001000
Content-Type: application/json

{
  "text": "Complete project urgently",
  "state": "todo",
  "category": "trabajo"
}
```

**Parameters:**
- `id` (URL param, required): Todo ID
- `text` (optional, string): Update task description
- `state` (optional, string): Update state
- `category` (optional, string): Update category

**Response:**
```json
{
  "id": 1707336001000,
  "text": "Complete project urgently",
  "state": "todo",
  "category": "trabajo"
}
```

**Status:** 200 OK

**Error Responses:**
- 400 Bad Request — No valid fields to update
- 404 Not Found — Todo ID does not exist
- 500 Internal Server Error

---

### 4. DELETE /api/todos/:id

Delete a todo.

**Request:**
```http
DELETE /api/todos/1707336002000
```

**Response:**
No content

**Status:** 204 No Content

**Error Responses:**
- 404 Not Found — Todo ID does not exist
- 500 Internal Server Error

---

### 5. POST /api/sync

Bulk replace all todos (full synchronization).

Use this endpoint when the client wants to push its complete state to the server, replacing all existing todos on the server.

**Request:**
```http
POST /api/sync
Content-Type: application/json

[
  {
    "id": 1707336000000,
    "text": "Buy groceries",
    "state": "plan",
    "category": "personal"
  },
  {
    "id": 1707336001000,
    "text": "Complete project",
    "state": "todo",
    "category": "trabajo"
  }
]
```

**Body:** Array of todo objects with `id`, `text`, `state`, `category`

**Response:**
```json
[
  {
    "id": 1707336000000,
    "text": "Buy groceries",
    "state": "plan",
    "category": "personal"
  },
  {
    "id": 1707336001000,
    "text": "Complete project",
    "state": "todo",
    "category": "trabajo"
  }
]
```

**Status:** 200 OK

---

### 6. POST /api/migrate

One-time migration endpoint for importing todos from client localStorage to the server.

**Request:**
```http
POST /api/migrate
Content-Type: application/json

[
  {
    "id": 1707336000000,
    "text": "Existing task",
    "state": "plan",
    "category": "personal"
  }
]
```

**Body:** Array of todo objects

**Response:**
```json
[
  {
    "id": 1707336000000,
    "text": "Existing task",
    "state": "plan",
    "category": "personal"
  }
]
```

**Status:** 200 OK

**Error Responses:**
- 409 Conflict — Server already has todos; use `/api/sync` instead
- 500 Internal Server Error

---

### 7. GET /api/health

Health check endpoint.

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T10:30:45.123Z"
}
```

**Status:** 200 OK

---

## Common Error Responses

### 400 Bad Request
```json
{
  "error": "Text is required and cannot be empty"
}
```

### 404 Not Found
```json
{
  "error": "Todo not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to retrieve todos"
}
```

---

## Usage Examples

### Using curl

**Get all todos:**
```bash
curl -X GET http://localhost:3000/api/todos
```

**Create a todo:**
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"text":"New task","state":"plan","category":"personal"}'
```

**Update a todo:**
```bash
curl -X PUT http://localhost:3000/api/todos/1707336001000 \
  -H "Content-Type: application/json" \
  -d '{"state":"done"}'
```

**Delete a todo:**
```bash
curl -X DELETE http://localhost:3000/api/todos/1707336001000
```

### Using JavaScript fetch

```javascript
// Get todos
fetch('/api/todos').then(r => r.json()).then(todos => console.log(todos));

// Create todo
fetch('/api/todos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'New task', category: 'trabajo' })
}).then(r => r.json()).then(todo => console.log(todo));

// Update todo
fetch('/api/todos/1707336001000', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ state: 'done' })
}).then(r => r.json()).then(todo => console.log(todo));

// Delete todo
fetch('/api/todos/1707336001000', { method: 'DELETE' });

// Sync all todos
fetch('/api/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(todosList)
}).then(r => r.json()).then(todos => console.log(todos));
```

---

## Notes

- All todo `id` values are timestamps (milliseconds since epoch) generated by the client
- Server enforces non-empty text fields
- State values: `plan`, `todo`, `done`
- Category values: `trabajo`, `personal`, `estudio`
- Timestamps are in ISO 8601 format with UTC timezone

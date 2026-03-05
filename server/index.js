const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const dbPath = path.join(__dirname, 'db.sqlite');
let db;

/* ===== CONFIGURATION ===== */
const TODOS_SELECT_QUERY = 'SELECT id, text, state, category, comments FROM todos';
const BCRYPT_ROUNDS = 10;

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

/* ===== DATABASE INITIALIZATION ===== */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      
      console.log('✓ Connected to SQLite database');
      
      // Create tables
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE NOT NULL COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY,
            text TEXT NOT NULL,
            state TEXT DEFAULT 'plan',
            category TEXT DEFAULT 'personal',
            comments TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Check and add comments column if it doesn't exist
        db.all("PRAGMA table_info('todos')", (err, rows) => {
          if (err) {
            console.error('Error checking table info:', err);
            reject(err);
            return;
          }
          
          const cols = rows.map(r => r.name);
          if (!cols.includes('comments')) {
            db.run("ALTER TABLE todos ADD COLUMN comments TEXT DEFAULT '[]'", (err) => {
              if (err) {
                console.error('Error adding comments column:', err);
                reject(err);
                return;
              }
              
              db.run("UPDATE todos SET comments = '[]' WHERE comments IS NULL", (err) => {
                if (err) {
                  console.error('Error updating comments column:', err);
                  reject(err);
                  return;
                }
                console.log('✓ Migrated: added comments column');
                resolve();
              });
            });
          } else {
            resolve();
          }
        });
      });
    });
  });
}

/* ===== UTILITIES ===== */
function parseComments(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

function hydrate(row) {
  if (!row) return row;
  row.comments = parseComments(row.comments);
  return row;
}

function hydrateMany(rows) {
  return rows.map(hydrate);
}

function normalizeEmail(email) {
  return email.toLowerCase();
}

/* ===== VALIDATION ===== */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  if (typeof password !== 'string' || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*\-_=+]/.test(password)) return false;
  return true;
}

async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/* ===== DATABASE HELPERS ===== */
function getTodoById(id, callback) {
  db.get(`${TODOS_SELECT_QUERY} WHERE id = ?`, [id], (err, row) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, row ? hydrate(row) : null);
  });
}

function getAllTodos(callback) {
  db.all(`${TODOS_SELECT_QUERY} ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, hydrateMany(rows));
  });
}

function insertTodo(text, state, category, comments, callback) {
  db.run(
    'INSERT INTO todos (text, state, category, comments) VALUES (?, ?, ?, ?)',
    [text, state, category, JSON.stringify(comments)],
    function(err) {
      if (err) {
        callback(err, null);
        return;
      }
      getTodoById(this.lastID, callback);
    }
  );
}

function userExists(email, callback) {
  db.get('SELECT id FROM users WHERE email = ?', [normalizeEmail(email)], (err, row) => {
    if (err) {
      callback(err, false);
      return;
    }
    callback(null, !!row);
  });
}

// Initialize database before setting up routes
initializeDatabase().then(() => {
  console.log('✓ Database initialized successfully');
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

/* ===== AUTH ROUTES ===== */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required and must be a string' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required and must be a string' });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character' });
    }

    // Check for duplicate
    const normalized = normalizeEmail(email);
    userExists(normalized, async (err, exists) => {
      if (err) {
        console.error('Error checking user existence:', err);
        return res.status(500).json({ error: 'Failed to register user' });
      }
      
      if (exists) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      try {
        // Hash and store
        const passwordHash = await hashPassword(password);
        db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [normalized, passwordHash], function(err) {
          if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ error: 'Failed to register user' });
          }

          res.status(201).json({
            id: this.lastID,
            email: normalized,
            created_at: new Date().toISOString()
          });
        });
      } catch (hashError) {
        console.error('Error hashing password:', hashError);
        res.status(500).json({ error: 'Failed to register user' });
      }
    });
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/* ===== TODO ROUTES ===== */
app.get('/api/todos', (req, res) => {
  getAllTodos((err, todos) => {
    if (err) {
      console.error('GET /api/todos error:', err);
      return res.status(500).json({ error: 'Failed to retrieve todos' });
    }
    res.json(todos);
  });
});

app.post('/api/todos', (req, res) => {
  try {
    const { text, state = 'plan', category = 'personal', comments = [] } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required and cannot be empty' });
    }

    insertTodo(text.trim(), state, category, comments, (err, todo) => {
      if (err) {
        console.error('POST /api/todos error:', err);
        return res.status(500).json({ error: 'Failed to create todo' });
      }
      res.status(201).json(todo);
    });
  } catch (error) {
    console.error('POST /api/todos error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    getTodoById(id, (err, todo) => {
      if (err) {
        console.error('PUT /api/todos/:id error:', err);
        return res.status(500).json({ error: 'Failed to update todo' });
      }
      
      if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
      }

      const { text, state, category, comments } = req.body;
      const updates = [];
      const values = [];

      if (text !== undefined && text.trim() !== '') {
        updates.push('text = ?');
        values.push(text.trim());
      }
      if (state !== undefined) {
        updates.push('state = ?');
        values.push(state);
      }
      if (category !== undefined) {
        updates.push('category = ?');
        values.push(category);
      }
      if (comments !== undefined) {
        updates.push('comments = ?');
        values.push(JSON.stringify(comments));
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      db.run(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
        if (err) {
          console.error('PUT /api/todos/:id error:', err);
          return res.status(500).json({ error: 'Failed to update todo' });
        }

        getTodoById(id, (err, updatedTodo) => {
          if (err) {
            console.error('PUT /api/todos/:id error:', err);
            return res.status(500).json({ error: 'Failed to update todo' });
          }
          res.json(updatedTodo);
        });
      });
    });
  } catch (error) {
    console.error('PUT /api/todos/:id error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;

    getTodoById(id, (err, todo) => {
      if (err) {
        console.error('DELETE /api/todos/:id error:', err);
        return res.status(500).json({ error: 'Failed to delete todo' });
      }
      
      if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
      }

      db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('DELETE /api/todos/:id error:', err);
          return res.status(500).json({ error: 'Failed to delete todo' });
        }
        res.status(204).send();
      });
    });
  } catch (error) {
    console.error('DELETE /api/todos/:id error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

/* ===== SYNC ROUTES ===== */
app.post('/api/sync', (req, res) => {
  try {
    const todosList = Array.isArray(req.body) ? req.body : [];

    db.serialize(() => {
      db.run('DELETE FROM todos', (err) => {
        if (err) {
          console.error('POST /api/sync error:', err);
          return res.status(500).json({ error: 'Failed to sync todos' });
        }
        
        if (todosList.length === 0) {
          return getAllTodos((err, todos) => {
            if (err) {
              console.error('POST /api/sync error:', err);
              return res.status(500).json({ error: 'Failed to sync todos' });
            }
            res.json(todos);
          });
        }
        
        const stmt = db.prepare('INSERT INTO todos (id, text, state, category, comments) VALUES (?, ?, ?, ?, ?)');
        let completed = 0;
        let hasError = false;
        
        todosList.forEach(todo => {
          if (todo.id && todo.text && !hasError) {
            stmt.run(todo.id, todo.text, todo.state || 'plan', todo.category || 'personal', JSON.stringify(todo.comments || []), (err) => {
              if (err && !hasError) {
                hasError = true;
                console.error('POST /api/sync error:', err);
                return res.status(500).json({ error: 'Failed to sync todos' });
              }
              
              completed++;
              if (completed === todosList.length && !hasError) {
                stmt.finalize();
                getAllTodos((err, todos) => {
                  if (err) {
                    console.error('POST /api/sync error:', err);
                    return res.status(500).json({ error: 'Failed to sync todos' });
                  }
                  res.json(todos);
                });
              }
            });
          } else {
            completed++;
            if (completed === todosList.length && !hasError) {
              stmt.finalize();
              getAllTodos((err, todos) => {
                if (err) {
                  console.error('POST /api/sync error:', err);
                  return res.status(500).json({ error: 'Failed to sync todos' });
                }
                res.json(todos);
              });
            }
          }
        });
      });
    });
  } catch (error) {
    console.error('POST /api/sync error:', error);
    res.status(500).json({ error: 'Failed to sync todos' });
  }
});

app.post('/api/migrate', (req, res) => {
  try {
    const todosList = Array.isArray(req.body) ? req.body : [];
    
    db.get('SELECT COUNT(*) as count FROM todos', [], (err, row) => {
      if (err) {
        console.error('POST /api/migrate error:', err);
        return res.status(500).json({ error: 'Failed to migrate todos' });
      }
      
      if (row.count > 0) {
        return res.status(409).json({ 
          error: 'Server already has todos. Use /api/sync to replace or handle merge manually.' 
        });
      }

      if (todosList.length === 0) {
        return getAllTodos((err, todos) => {
          if (err) {
            console.error('POST /api/migrate error:', err);
            return res.status(500).json({ error: 'Failed to migrate todos' });
          }
          res.json(todos);
        });
      }

      const stmt = db.prepare('INSERT INTO todos (id, text, state, category, comments) VALUES (?, ?, ?, ?, ?)');
      let completed = 0;
      let hasError = false;
      
      todosList.forEach(todo => {
        if (todo.id && todo.text && !hasError) {
          stmt.run(todo.id, todo.text, todo.state || 'plan', todo.category || 'personal', JSON.stringify(todo.comments || []), (err) => {
            if (err && !hasError) {
              hasError = true;
              console.error('POST /api/migrate error:', err);
              return res.status(500).json({ error: 'Failed to migrate todos' });
            }
            
            completed++;
            if (completed === todosList.length && !hasError) {
              stmt.finalize();
              getAllTodos((err, todos) => {
                if (err) {
                  console.error('POST /api/migrate error:', err);
                  return res.status(500).json({ error: 'Failed to migrate todos' });
                }
                res.json(todos);
              });
            }
          });
        } else {
          completed++;
          if (completed === todosList.length && !hasError) {
            stmt.finalize();
            getAllTodos((err, todos) => {
              if (err) {
                console.error('POST /api/migrate error:', err);
                return res.status(500).json({ error: 'Failed to migrate todos' });
              }
              res.json(todos);
            });
          }
        }
      });
    });
  } catch (error) {
    console.error('POST /api/migrate error:', error);
    res.status(500).json({ error: 'Failed to migrate todos' });
  }
});

/* ===== MISC ROUTES ===== */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ===== ERROR HANDLING ===== */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ===== SERVER START ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Todo App Server running on http://localhost:${PORT}`);
  console.log(`📁 Database: ${dbPath}`);
  console.log(`\nAPI endpoints:`);
  console.log(`  POST   /api/auth/register`);
  console.log(`  GET    /api/todos`);
  console.log(`  POST   /api/todos`);
  console.log(`  PUT    /api/todos/:id`);
  console.log(`  DELETE /api/todos/:id`);
  console.log(`  POST   /api/sync`);
  console.log(`  POST   /api/migrate`);
  console.log(`  GET    /api/health`);
});

module.exports = app;

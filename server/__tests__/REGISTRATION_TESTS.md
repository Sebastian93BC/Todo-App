# User Registration Tests - Implementation Guide

This test suite validates user registration functionality with comprehensive email validation and password requirements. All tests are currently in "Red" state and will fail until the registration feature is implemented.

## Test Structure

### Email Validation Tests
Tests verify that the registration endpoint properly validates email addresses:

- **Invalid formats**: Rejects emails missing `@`, domain, or local part
- **Empty/missing email**: Requires email field to be present and non-empty
- **Valid formats**: Accepts standard email patterns including dots, underscores, and plus addressing
- **Duplicate detection**: Rejects duplicate email addresses (case-insensitive)

### Password Complexity Tests

#### Length Requirements
- Minimum 8 characters
- Rejects passwords with 7 or fewer characters
- Accepts passwords of 8+ characters

#### Complexity Requirements
Passwords must contain ALL of the following:
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*-_=+)

### Success Cases
- Returns HTTP 201 on successful registration
- Returns user object with `id`, `email`, and `created_at`
- Never returns the plaintext password in the response
- Stores password as secure hash in the database

### Edge Cases
- Handles whitespace in email fields
- Rejects null/undefined values
- Validates data types (email and password must be strings)
- Safely ignores unknown request fields

## Required Implementation

To make these tests pass, you'll need to:

### 1. Database Schema
Add a `users` table to the SQLite database:
```javascript
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();
```

### 2. Email Validation Function
Create a validation utility:
```javascript
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### 3. Password Validation Function
Validate password meets all requirements:
```javascript
function isValidPassword(password) {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*\-_=+]/.test(password)) return false;
  return true;
}
```

### 4. Registration Endpoint
Implement `POST /api/auth/register`:
```javascript
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (!password || !isValidPassword(password)) {
    return res.status(400).json({ error: 'Password does not meet requirements' });
  }

  // Check for duplicates
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Hash password and store
  const passwordHash = hashPassword(password); // Use bcrypt or similar
  const result = db.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)'
  ).run(email.toLowerCase(), passwordHash);

  res.status(201).json({
    id: result.lastInsertRowid,
    email: email.toLowerCase(),
    created_at: new Date().toISOString()
  });
});
```

### 5. Password Hashing
Implement secure password hashing (recommended: bcrypt):
```bash
npm install bcrypt
```

```javascript
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- __tests__/auth.test.js

# Run specific test suite
npm test -- --testNamePattern="Email Validation"
```

## Test Expectations

Each test is designed to be specific and independent:
- **Isolation**: Each test can run independently
- **Clarity**: Error messages should match regex patterns
- **Coverage**: Edge cases and success paths are both validated
- **Type safety**: Tests verify proper data type handling

## Notes

- Email comparison should be case-insensitive (convert to lowercase before storing)
- Passwords should never be logged or returned to the client
- Error messages should be informative but not expose sensitive information
- Consider rate limiting on the registration endpoint in production
- Implement email verification in a subsequent iteration if needed

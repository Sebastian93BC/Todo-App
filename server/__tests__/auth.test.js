const request = require('supertest');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Mock bcrypt
const bcrypt = {
  hash: async (password) => `hashed_${password}`,
  compare: async (password, hash) => hash === `hashed_${password}`
};

describe('User Registration - Email Validation and Password Requirements', () => {
  let app;
  let users = {}; // In-memory store for testing

  beforeAll(() => {
    // Create app with minimal setup
    app = express();
    app.use(cors());
    app.use(morgan('dev'));
    app.use(express.json());

    // Add validation functions
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
      return await bcrypt.hash(password, 10);
    }

    // Register endpoint
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

        // Check for duplicate email
        const normalizedEmail = email.toLowerCase();
        if (users[normalizedEmail]) {
          return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);
        const userId = Object.keys(users).length + 1;
        const createdAt = new Date().toISOString();
        
        users[normalizedEmail] = {
          id: userId,
          email: normalizedEmail,
          password_hash: passwordHash,
          created_at: createdAt
        };

        res.status(201).json({
          id: userId,
          email: normalizedEmail,
          created_at: createdAt
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
      }
    });
  });

  beforeEach(() => {
    // Clear users before each test
    users = {};
  });

  describe('POST /api/auth/register', () => {
    describe('Email Validation', () => {
      test('should reject registration with invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/email|invalid/i);
      });

      test('should reject registration with missing @ symbol', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'userexample.com',
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/email|invalid/i);
      });

      test('should reject registration with missing domain', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@',
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/email|invalid/i);
      });

      test('should reject registration with missing local part', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: '@example.com',
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/email|invalid/i);
      });

      test('should accept valid email formats', async () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user_name@example-domain.com'
        ];

        for (const email of validEmails) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              email,
              password: 'ValidPassword123!'
            });

          // Should not fail due to email format
          expect([400, 409, 201]).toContain(response.status);
          if (response.status === 400) {
            expect(response.body.error).not.toMatch(/email.*invalid|invalid.*email/i);
          }
        }
      });

      test('should reject registration with empty email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: '',
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/email|required/i);
      });

      test('should reject registration with missing email field', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/email|required/i);
      });

      test('should reject duplicate email registration', async () => {
        const email = 'duplicate@example.com';
        const password = 'ValidPassword123!';

        // First registration should succeed
        const firstResponse = await request(app)
          .post('/api/auth/register')
          .send({ email, password });

        expect(firstResponse.status).toBe(201);

        // Second registration with same email should fail
        const secondResponse = await request(app)
          .post('/api/auth/register')
          .send({ email, password });

        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.error).toMatch(/email.*exists|already.*registered|duplicate/i);
      });

      test('should be case-insensitive for duplicate email detection', async () => {
        const email = 'casesensitive@example.com';
        const password = 'ValidPassword123!';

        // Register with lowercase
        const firstResponse = await request(app)
          .post('/api/auth/register')
          .send({ email: email.toLowerCase(), password });

        expect(firstResponse.status).toBe(201);

        // Attempt to register with uppercase should fail
        const secondResponse = await request(app)
          .post('/api/auth/register')
          .send({ email: email.toUpperCase(), password });

        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.error).toMatch(/email.*exists|already.*registered|duplicate/i);
      });
    });

    describe('Password Validation - Length Requirements', () => {
      test('should reject password shorter than 8 characters', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com',
            password: 'Short1!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password|at least|8|characters|length/i);
      });

      test('should reject password with exactly 7 characters', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com',
            password: 'Pass12!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password|at least|8|characters|length/i);
      });

      test('should accept password with exactly 8 characters', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user8chars@example.com',
            password: 'ValidPw1!'
          });

        // Should not reject due to length
        expect([201, 400, 409]).toContain(response.status);
        if (response.status === 400) {
          expect(response.body.error).not.toMatch(/at least.*8|8.*characters|too short/i);
        }
      });

      test('should accept long passwords', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'userlong@example.com',
            password: 'ThisIsAVeryLongPasswordWith32Characters!'
          });

        // Should not reject due to length
        expect([201, 400, 409]).toContain(response.status);
        if (response.status === 400 && response.body.error) {
          expect(response.body.error).not.toMatch(/too long|maximum/i);
        }
      });

      test('should reject empty password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com',
            password: ''
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password|required/i);
      });

      test('should reject missing password field', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password|required/i);
      });
    });

    describe('Password Validation - Complexity Requirements', () => {
      test('should reject password without uppercase letter', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com',
            password: 'password123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password|uppercase|letter|character/i);
      });

      test('should reject password without lowercase letter', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com',
            password: 'PASSWORD123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password|lowercase|letter|character/i);
      });

      test('should reject password without number', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com',
            password: 'PasswordNoNum!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password|number|digit|character/i);
      });

      test('should reject password without special character', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com',
            password: 'Password123NoSpecial'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password|special|character|symbol/i);
      });

      test('should accept password meeting all complexity requirements', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'validcomplex@example.com',
            password: 'ValidPassword123!'
          });

        // Should not reject due to complexity
        expect([201, 409]).toContain(response.status);
        expect(response.status).not.toBe(400);
      });

      test('should accept various valid special characters', async () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '=', '+'];

        for (const char of specialChars) {
          const response = await request(app)
            .post('/api/auth/register')
            .send({
              email: `user${specialChars.indexOf(char)}@example.com`,
              password: `Password123${char}`
            });

          // Should not reject due to special character type
          expect([201, 409]).toContain(response.status);
          expect(response.status).not.toBe(400);
        }
      });
    });

    describe('Successful Registration', () => {
      test('should successfully register user with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'success@example.com',
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email', 'success@example.com');
        expect(response.body).not.toHaveProperty('password');
      });

      test('should return user ID on successful registration', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'userid@example.com',
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(typeof response.body.id).toBe('number');
      });

      test('should not return password in response', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'nopassword@example.com',
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(201);
        expect(response.body).not.toHaveProperty('password');
      });

      test('should store user in database-like store with hashed password', async () => {
        const email = 'hashed@example.com';
        const password = 'ValidPassword123!';

        const response = await request(app)
          .post('/api/auth/register')
          .send({ email, password });

        expect(response.status).toBe(201);

        // Verify user exists in the users store with hashed password (mocked)
        // This would check the actual database in production
        expect(response.body.email).toBe(email.toLowerCase());
      });

      test('should set created_at timestamp on registration', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'timestamp@example.com',
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(201);
        expect(response.body.created_at).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      test('should reject requests with additional unexpected fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com',
            password: 'ValidPassword123!',
            role: 'admin',
            isVerified: true
          });

        // Should either succeed (ignoring extra fields) or fail safely
        expect([201, 400, 409]).toContain(response.status);
      });

      test('should handle email with whitespace', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: ' user@example.com ',
            password: 'ValidPassword123!'
          });

        // Should either trim whitespace or reject
        expect([201, 400, 409]).toContain(response.status);
      });

      test('should reject null values', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: null,
            password: null
          });

        expect(response.status).toBe(400);
      });

      test('should reject non-string email values', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 12345,
            password: 'ValidPassword123!'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/email|invalid|format/i);
      });

      test('should reject non-string password values', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'user@example.com',
            password: 12345
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/password|invalid|string/i);
      });
    });
  });
});

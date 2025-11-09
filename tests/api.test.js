// 1️⃣ --- Mock createJWT.js before importing anything else ---
jest.mock('../createJWT.js', () => ({
  createToken: jest.fn(() => ({
    accessToken: 'fake-token-123'
  })),
  isExpired: jest.fn(() => false),
  refresh: jest.fn((token) => token),
}));

// 2️⃣ --- Imports ---
const request = require('supertest');
const express = require('express');
const api = require('../api.js');

// 3️⃣ --- Mock MongoDB client ---
const mockToArray = jest.fn();
const mockFind = jest.fn(() => ({ toArray: mockToArray }));
const mockInsertOne = jest.fn();
const mockCollection = jest.fn(() => ({
  find: mockFind,
  insertOne: mockInsertOne
}));

const mockDb = { collection: mockCollection };
const mockClient = { db: () => mockDb };

// 4️⃣ --- Setup Express app ---
const app = express();
app.use(express.json());
api.setApp(app, mockClient);

// 5️⃣ --- TEST SUITE ---
describe('API routes', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- /api/login ---
  describe('POST /api/login', () => {

    it('returns user info and token for valid credentials', async () => {
      mockToArray.mockResolvedValueOnce([
        { 
          _id: '123',
          FirstName: 'John',
          LastName: 'Doe',
          friend_id: 'f001',
          Login: 'john@example.com',
          Password: 'password123'
        }
      ]);

      const res = await request(app)
        .post('/api/login')
        .send({ login: 'john@example.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe('123');
      expect(res.body.firstName).toBe('John');
      expect(res.body.lastName).toBe('Doe');
      expect(res.body.accessToken).toBeDefined();
    });

    it('returns error for invalid credentials', async () => {
      mockToArray.mockResolvedValueOnce([]); // no user found

      const res = await request(app)
        .post('/api/login')
        .send({ login: 'wrong@example.com', password: 'wrongpass' });

      expect(res.statusCode).toBe(200);
      expect(res.body.error).toBe('Login/Password incorrect');
    });
  });

  // --- /api/signup ---
  describe('POST /api/signup', () => {

    it('returns error if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/signup')
        .send({ Login: '', Password: '', FirstName: '', LastName: '', friend_id: '' });

      expect(res.statusCode).toBe(200);
      expect(res.body.error).toBe('All fields are required');
    });

    it('returns error if login already exists', async () => {
      mockCollection.mockReturnValueOnce({
        find: () => ({
          toArray: () => Promise.resolve([{ Login: 'john@example.com' }])
        })
      });

      const res = await request(app)
        .post('/api/signup')
        .send({
          Login: 'john@example.com',
          Password: 'password123',
          FirstName: 'John',
          LastName: 'Doe',
          friend_id: 'f001'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.error).toBe('Email already exists');
    });

    it('creates user successfully when fields are valid', async () => {
      // mock no existing login
      mockCollection.mockReturnValue({
        find: jest.fn(() => ({
          toArray: jest.fn()
            .mockResolvedValueOnce([]) // no login found
            .mockResolvedValueOnce([]) // no friend_id found
        })),
        insertOne: jest.fn(() => Promise.resolve({ insertedId: 'abc123' }))
      });

      const res = await request(app)
        .post('/api/signup')
        .send({
          Login: 'new@example.com',
          Password: 'password123',
          FirstName: 'New',
          LastName: 'User',
          friend_id: 'f002'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBe('fake-token-123');
      expect(res.body.firstName).toBe('New');
      expect(res.body.lastName).toBe('User');
      expect(res.body.error).toBe('');
    });
  });
});
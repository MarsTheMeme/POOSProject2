jest.mock('../createJWT.js', () => ({
  createToken: jest.fn(() => ({
    accessToken: 'fake-token-123'
  }))
}));

const request = require('supertest');
const express = require('express');
const api = require('../api.js');

const mockFind = jest.fn();
const mockDb = {
  collection: jest.fn().mockReturnValue({
    find: mockFind
  })
};
const mockClient = {
  db: () => mockDb
};

const app = express();
app.use(express.json());
api.setApp(app, mockClient);

describe('POST /api/login', () => {
  it('returns user info and token for valid credentials', async () => {
    mockFind.mockReturnValueOnce({
      toArray: () => Promise.resolve([
        { _id: 'abc123', FirstName: 'John', LastName: 'Doe', friend_id: 'f1' }
      ])
    });

    const res = await request(app)
      .post('/api/login')
      .send({ login: 'john@example.com', password: 'test123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.firstName).toBe('John');
    expect(res.body.lastName).toBe('Doe');
    expect(res.body.accessToken).toBeDefined();
  });

  it('returns error for invalid credentials', async () => {
    mockFind.mockReturnValueOnce({
      toArray: () => Promise.resolve([])
    });

    const res = await request(app)
      .post('/api/login')
      .send({ login: 'wrong@example.com', password: 'badpass' });

    expect(res.statusCode).toBe(200);
    expect(res.body.error).toBe('Login/Password incorrect');
  });
});

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const authRoutes = require('./auth');

// Mock the dependencies
jest.mock('../db', () => ({
  getDb: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compareSync: jest.fn(),
  hashSync: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('fake_jwt_token_123'),
}));

const app = express();
app.use(express.json());
app.use(authRoutes);

describe('Auth Routes', () => {
  describe('POST /login', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('TC-01: should return 400 if email is missing', async () => {
      const res = await request(app).post('/login').send({
        password: 'password123',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email and password required');
    });

    it('TC-02: should return 400 if password is missing', async () => {
      const res = await request(app).post('/login').send({
        email: 'test@example.com',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email and password required');
    });

    it('TC-03: should return 401 for invalid email', async () => {
      const mockDb = {
        get: jest.fn().mockResolvedValue(null),
      };
      getDb.mockResolvedValue(mockDb);

      const res = await request(app).post('/login').send({
        email: 'wrong@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('TC-04: should return 401 for incorrect password', async () => {
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashedPassword' };
      const mockDb = {
        get: jest.fn().mockResolvedValue(mockUser),
      };
      getDb.mockResolvedValue(mockDb);
      bcrypt.compareSync.mockReturnValue(false);

      const res = await request(app).post('/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('TC-05: should return 200 and a token for successful login', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', password: 'hashedPassword', role: 'student' };
      const mockDb = {
        get: jest.fn().mockResolvedValue(mockUser),
      };
      getDb.mockResolvedValue(mockDb);
      bcrypt.compareSync.mockReturnValue(true);

      const res = await request(app).post('/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe('fake_jwt_token_123');
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.name).toBe('Test User');
    });

    it('TC-06: should return 500 if a database error occurs', async () => {
      getDb.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app).post('/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Login failed');
    });
  });
});

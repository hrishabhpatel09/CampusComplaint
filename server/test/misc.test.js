const request = require('supertest');
const express = require('express');
const { getDb } = require('../db');
const miscRoutes = require('./misc');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Mock dependencies
jest.mock('../db', () => ({
  getDb: jest.fn(),
}));

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => {
  req.user = { id: 1, role: 'admin' }; // Default mock user
  next();
}));

jest.mock('../middleware/role', () => jest.fn(() => (req, res, next) => next()));

const app = express();
app.use(express.json());
app.use(miscRoutes);

describe('Misc Routes', () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      all: jest.fn().mockResolvedValue([]),
      get: jest.fn().mockResolvedValue({ c: 0 }),
      run: jest.fn().mockResolvedValue({}),
    };
    getDb.mockResolvedValue(mockDb);
  });

  describe('GET /notifications', () => {
    it('TC-01: should fetch notifications for a user', async () => {
      await request(app).get('/notifications');
      expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('SELECT id, title, message, read, created_at AS time FROM notifications'), 1);
    });

    it('TC-02: should return 500 on db error', async () => {
        mockDb.all.mockRejectedValue(new Error('DB Error'));
        const res = await request(app).get('/notifications');
        expect(res.status).toBe(500);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('TC-03: should mark a notification as read', async () => {
      const res = await request(app).patch('/notifications/1/read');
      expect(res.status).toBe(200);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE notifications SET read = 1'), '1', 1);
    });
  });

  describe('PATCH /notifications/read-all', () => {
    it('TC-04: should mark all notifications as read', async () => {
      const res = await request(app).patch('/notifications/read-all');
      expect(res.status).toBe(200);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE notifications SET read = 1 WHERE user_id = ?'), 1);
    });
  });

  describe('GET /users/staff', () => {
    it('TC-05: should fetch all staff users', async () => {
      await request(app).get('/users/staff');
      expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining("SELECT id, name, email FROM users WHERE role = 'staff'"));
    });
  });

  describe('GET /analytics/summary', () => {
    it('TC-06: should fetch analytics summary', async () => {
        mockDb.get
            .mockResolvedValueOnce({ c: 10 }) // total
            .mockResolvedValueOnce({ c: 2 })  // pending
            .mockResolvedValueOnce({ c: 3 })  // inProgress
            .mockResolvedValueOnce({ c: 5 })  // resolved
            .mockResolvedValueOnce({ c: 1 }); // unassigned
      mockDb.all.mockResolvedValue([]); // byCategory

      const res = await request(app).get('/analytics/summary');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(10);
    });
  });
});

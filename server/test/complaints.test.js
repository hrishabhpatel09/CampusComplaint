const request = require('supertest');
const express = require('express');
const { getDb } = require('../db');
const complaintsRoutes = require('./complaints');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// Mock dependencies
jest.mock('../db', () => ({
  getDb: jest.fn(),
}));

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => {
  req.user = { id: 1, role: 'student', name: 'Test Student' };
  next();
}));

jest.mock('../middleware/role', () => jest.fn(() => (req, res, next) => next()));

const app = express();
app.use(express.json());
app.use('/complaints', complaintsRoutes);

describe('Complaints Routes', () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      all: jest.fn().mockResolvedValue([]),
      get: jest.fn().mockResolvedValue(null),
      run: jest.fn().mockResolvedValue({ lastID: 1 }),
    };
    getDb.mockResolvedValue(mockDb);
  });

  describe('GET /complaints', () => {
    it('TC-01: should fetch all complaints for an admin', async () => {
      authMiddleware.mockImplementationOnce((req, res, next) => {
        req.user = { id: 100, role: 'admin', name: 'Test Admin' };
        next();
      });
      await request(app).get('/complaints');
      expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('SELECT c.*, u.name AS student_name, s.name AS assigned_name'));
    });

    it('TC-02: should fetch assigned complaints for a staff member', async () => {
      authMiddleware.mockImplementationOnce((req, res, next) => {
        req.user = { id: 200, role: 'staff', name: 'Test Staff' };
        next();
      });
      await request(app).get('/complaints');
      expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('WHERE c.assigned_to = ?'), 200);
    });

    it('TC-03: should fetch user-specific complaints for a student', async () => {
      await request(app).get('/complaints');
      expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('WHERE c.user_id = ?'), 1);
    });

    it('TC-04: should return 500 on database error', async () => {
        mockDb.all.mockRejectedValue(new Error('DB Error'));
        const res = await request(app).get('/complaints');
        expect(res.status).toBe(500);
    });
  });

  describe('POST /complaints', () => {
    it('TC-05: should fail if category is missing', async () => {
      const res = await request(app).post('/complaints').send({ description: 'Test' });
      expect(res.status).toBe(400);
    });

    it('TC-06: should fail if description is missing', async () => {
      const res = await request(app).post('/complaints').send({ category: 'Test' });
      expect(res.status).toBe(400);
    });

    it('TC-07: should create a complaint successfully', async () => {
      mockDb.all.mockResolvedValue([{ id: 100 }]); // For admin notifications
      const res = await request(app).post('/complaints').send({ category: 'Test', description: 'Test desc' });
      expect(res.status).toBe(201);
      expect(mockDb.run).toHaveBeenCalled();
    });
  });

  describe('PATCH /complaints/:id', () => {
    it('TC-08: should fail if complaint not found', async () => {
      mockDb.get.mockResolvedValue(null);
      const res = await request(app).patch('/complaints/999').send({ status: 'Resolved' });
      expect(res.status).toBe(404);
    });

    it('TC-09: should update a complaint status', async () => {
      mockDb.get.mockResolvedValue({ id: 1, user_id: 1 });
      const res = await request(app).patch('/complaints/1').send({ status: 'Resolved' });
      expect(res.status).toBe(200);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE complaints'), 'Resolved', '1');
    });
  });

  describe('DELETE /complaints/:id', () => {
    it('TC-10: should delete a complaint', async () => {
      const res = await request(app).delete('/complaints/1');
      expect(res.status).toBe(200);
      expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM complaints'), '1');
    });
  });
});

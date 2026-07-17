// Shared test bootstrap. Spins up an in-memory MongoDB so tests never touch
// a real database, and provides helpers for creating authenticated users.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-for-production';
process.env.JWT_EXPIRES_IN = '1h';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

let mongoServer;

const connectTestDb = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
};

const clearTestDb = async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

const disconnectTestDb = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Registers a user through the API and returns { token, user }.
const registerUser = async (app, overrides = {}) => {
  const payload = {
    name: 'Test User',
    email: `user${Date.now()}${Math.floor(Math.random() * 10000)}@example.com`,
    password: 'password123',
    role: 'regulatory',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { token: res.body.token, user: res.body.user, payload, res };
};

module.exports = { connectTestDb, clearTestDb, disconnectTestDb, registerUser };

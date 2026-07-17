const request = require('supertest');
const { connectTestDb, clearTestDb, disconnectTestDb, registerUser } = require('./setup');
const app = require('../src/app');
const User = require('../src/models/User');

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Asha Patel',
      email: 'asha@example.com',
      password: 'password123',
      role: 'qa',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('asha@example.com');
    expect(res.body.user.role).toBe('qa');
    expect(res.body.user.password).toBeUndefined();
  });

  it('hashes the password in the database', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Asha Patel',
      email: 'asha@example.com',
      password: 'password123',
    });

    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
    expect(stored.password).not.toBe('password123');
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email', async () => {
    await registerUser(app, { email: 'dup@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: 'dup@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
  });

  it('rejects invalid input with 422', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: '',
      email: 'not-an-email',
      password: 'short',
    });

    expect(res.status).toBe(422);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const { payload } = await registerUser(app, { email: 'login@example.com' });

    const res = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: payload.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('rejects a wrong password', async () => {
    const { payload } = await registerUser(app, { email: 'login2@example.com' });

    const res = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
  });

  it('rejects a deactivated user', async () => {
    const { payload, user } = await registerUser(app, { email: 'inactive@example.com' });
    await User.findByIdAndUpdate(user._id, { isActive: false });

    const res = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: payload.password,
    });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const { token, user } = await registerUser(app, { email: 'me@example.com' });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(user._id);
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

const request = require('supertest');
const { connectTestDb, clearTestDb, disconnectTestDb, registerUser } = require('./setup');
const app = require('../src/app');

const sampleProduct = {
  productName: 'Amoxicillin 500mg Capsules',
  activeIngredient: 'Amoxicillin trihydrate',
  dosageForm: 'capsule',
  strength: '500 mg',
  manufacturer: 'Example Pharma Ltd',
  mah: 'Example Pharma Ltd',
  atcCode: 'J01CA04',
};

beforeAll(async () => {
  await connectTestDb();
});

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

const createProduct = async (token, overrides = {}) =>
  request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...sampleProduct, ...overrides });

describe('POST /api/products', () => {
  it('lets a regulatory user create a product', async () => {
    const { token } = await registerUser(app, { role: 'regulatory' });
    const res = await createProduct(token);

    expect(res.status).toBe(201);
    expect(res.body.product.productName).toBe(sampleProduct.productName);
    expect(res.body.product.createdBy).toBeDefined();
  });

  it('blocks a qa user from creating a product', async () => {
    const { token } = await registerUser(app, { role: 'qa' });
    const res = await createProduct(token);

    expect(res.status).toBe(403);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/api/products').send(sampleProduct);
    expect(res.status).toBe(401);
  });

  it('rejects invalid payloads with 422', async () => {
    const { token } = await registerUser(app, { role: 'admin' });
    const res = await createProduct(token, { productName: '', dosageForm: 'nonsense' });

    expect(res.status).toBe(422);
  });
});

describe('GET /api/products', () => {
  it('lists products with pagination metadata', async () => {
    const { token } = await registerUser(app, { role: 'regulatory' });
    await createProduct(token);
    await createProduct(token, { productName: 'Paracetamol 500mg Tablets', dosageForm: 'tablet' });

    const res = await request(app)
      .get('/api/products?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.products.length).toBe(1);
    expect(res.body.total).toBe(2);
    expect(res.body.pages).toBe(2);
  });

  it('filters by search term', async () => {
    const { token } = await registerUser(app, { role: 'regulatory' });
    await createProduct(token);
    await createProduct(token, { productName: 'Paracetamol 500mg Tablets', dosageForm: 'tablet' });

    const res = await request(app)
      .get('/api/products?search=paracetamol')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.products[0].productName).toMatch(/Paracetamol/);
  });

  it('filters by dosage form', async () => {
    const { token } = await registerUser(app, { role: 'regulatory' });
    await createProduct(token);
    await createProduct(token, { productName: 'Paracetamol 500mg Tablets', dosageForm: 'tablet' });

    const res = await request(app)
      .get('/api/products?dosageForm=tablet')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.products[0].dosageForm).toBe('tablet');
  });
});

describe('GET /api/products/:id', () => {
  it('returns a single product', async () => {
    const { token } = await registerUser(app, { role: 'regulatory' });
    const created = await createProduct(token);

    const res = await request(app)
      .get(`/api/products/${created.body.product._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.product._id).toBe(created.body.product._id);
  });

  it('returns 404 for a missing product', async () => {
    const { token } = await registerUser(app, { role: 'regulatory' });
    const res = await request(app)
      .get('/api/products/64b000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/products/:id', () => {
  it('updates a product as admin', async () => {
    const { token } = await registerUser(app, { role: 'admin' });
    const created = await createProduct(token);

    const res = await request(app)
      .put(`/api/products/${created.body.product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...sampleProduct, strength: '250 mg' });

    expect(res.status).toBe(200);
    expect(res.body.product.strength).toBe('250 mg');
  });

  it('blocks a manufacturing user from updating', async () => {
    const { token: regToken } = await registerUser(app, { role: 'regulatory' });
    const created = await createProduct(regToken);

    const { token: mfgToken } = await registerUser(app, { role: 'manufacturing' });
    const res = await request(app)
      .put(`/api/products/${created.body.product._id}`)
      .set('Authorization', `Bearer ${mfgToken}`)
      .send({ ...sampleProduct, strength: '250 mg' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/products/:id', () => {
  it('deletes a product', async () => {
    const { token } = await registerUser(app, { role: 'regulatory' });
    const created = await createProduct(token);

    const res = await request(app)
      .delete(`/api/products/${created.body.product._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const check = await request(app)
      .get(`/api/products/${created.body.product._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(check.status).toBe(404);
  });

  it('refuses to delete a product with linked submissions', async () => {
    const { token } = await registerUser(app, { role: 'regulatory' });
    const created = await createProduct(token);

    await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: created.body.product._id,
        regulatoryAuthority: 'MHRA',
        submissionType: 'new',
        targetDate: '2026-12-01',
      });

    const res = await request(app)
      .delete(`/api/products/${created.body.product._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });
});

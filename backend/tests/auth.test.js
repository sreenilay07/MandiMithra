const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const FarmerProfile = require('../src/models/FarmerProfile');

describe('AUTH API - OTP & JWT Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({ phoneNumber: '9000011111' });
    await FarmerProfile.deleteMany({ phoneNumber: '9000011111' });
    await mongoose.connection.close();
  });

  it('should register a new farmer and return development OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Test Farmer',
        phoneNumber: '9000011111',
        village: 'Test Village',
        mandal: 'Test Mandal',
        district: 'Test District',
        state: 'Test State',
        pincode: '500001',
        aadhaarLast4: '1234',
        bankAccountLast4: '5678',
        landPassbookReference: 'PASS-123'
      });

    if (res.statusCode !== 201) console.log('AUTH TEST REGISTER ERROR:', res.statusCode, res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.otpInfo.devOtp).toBe('123456');
  });

  it('should verify OTP and issue JWT access tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '9000011111',
        otp: '123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
  });

  it('should reject invalid OTP codes', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '9000011111',
        otp: '999999'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

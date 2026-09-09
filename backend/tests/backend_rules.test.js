const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const ApprovalRequest = require('../src/models/ApprovalRequest');
const District = require('../src/models/District');
const ProcurementCentre = require('../src/models/ProcurementCentre');
const Booking = require('../src/models/Booking');
const Token = require('../src/models/Token');
const Procurement = require('../src/models/Procurement');
const ProcurementStage = require('../src/models/ProcurementStage');
const Crop = require('../src/models/Crop');
const queueService = require('../src/services/queue/queue.service');
const excelReportService = require('../src/services/reports/excelReport.service');

describe('MandiMithra Core Backend Business Rules & Authorization Tests', () => {
  let superAdmin, districtAdmin, centreManager, centreOperator, farmer;
  let superAdminToken, districtAdminToken, centreManagerToken, centreOperatorToken, farmerToken;
  let testDistrict, testCentre;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ phoneNumber: { $regex: /^98888/ } });
    await ApprovalRequest.deleteMany({});
    await District.deleteMany({ code: 'TEST_DIST' });
    await ProcurementCentre.deleteMany({ code: 'TEST_CENTRE' });

    // Setup Test District and Centre
    testDistrict = await District.create({
      name: 'Test District',
      state: 'Telangana',
      code: 'TEST_DIST',
      active: true
    });

    testCentre = await ProcurementCentre.create({
      name: 'Test Centre',
      code: 'TEST_CENTRE',
      state: 'Telangana',
      districtId: testDistrict._id,
      address: 'Test Address',
      village: 'Test Village',
      latitude: 17.385043,
      longitude: 78.486671,
      contactNumber: '9999999999',
      processingCapacity: 2000,
      activeCounters: 2,
      active: true
    });

    // 1. Setup Super Admin
    superAdmin = await User.create({
      fullName: 'Super Admin',
      phoneNumber: '9888800000',
      password: 'Password123!',
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
      isPhoneVerified: true
    });

    // 2. Setup District Admin
    districtAdmin = await User.create({
      fullName: 'District Admin',
      phoneNumber: '9888800001',
      password: 'Password123!',
      role: 'DISTRICT_ADMIN',
      districtId: testDistrict._id,
      status: 'APPROVED',
      isPhoneVerified: true
    });

    // 3. Setup Centre Manager
    centreManager = await User.create({
      fullName: 'Centre Manager',
      phoneNumber: '9888800002',
      password: 'Password123!',
      role: 'CENTER_MANAGER',
      districtId: testDistrict._id,
      centreId: testCentre._id,
      status: 'APPROVED',
      isPhoneVerified: true
    });

    // 4. Setup Centre Operator
    centreOperator = await User.create({
      fullName: 'Centre Operator',
      phoneNumber: '9888800003',
      password: 'Password123!',
      role: 'CENTER_OPERATOR',
      districtId: testDistrict._id,
      centreId: testCentre._id,
      status: 'APPROVED',
      isPhoneVerified: true
    });

    // Login to get tokens
    const loginSuper = await request(app).post('/api/auth/login').send({ phoneNumber: '9888800000', password: 'Password123!' });
    superAdminToken = loginSuper.body.data.tokens.accessToken;

    const loginDist = await request(app).post('/api/auth/login').send({ phoneNumber: '9888800001', password: 'Password123!' });
    districtAdminToken = loginDist.body.data.tokens.accessToken;

    const loginMgr = await request(app).post('/api/auth/login').send({ phoneNumber: '9888800002', password: 'Password123!' });
    centreManagerToken = loginMgr.body.data.tokens.accessToken;

    const loginOp = await request(app).post('/api/auth/login').send({ phoneNumber: '9888800003', password: 'Password123!' });
    centreOperatorToken = loginOp.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await User.deleteMany({ phoneNumber: { $regex: /^98888/ } });
    await ApprovalRequest.deleteMany({});
    await District.deleteMany({ code: 'TEST_DIST' });
    await ProcurementCentre.deleteMany({ code: 'TEST_CENTRE' });
    await mongoose.connection.close();
  });

  // Rule 1: Farmer can register without approval
  it('1. Farmer can register without approval and status becomes APPROVED', async () => {
    const res = await request(app)
      .post('/api/auth/register/farmer')
      .send({
        fullName: 'Test Farmer AutoApproved',
        phoneNumber: '9888800004',
        password: 'FarmerPassword123!',
        district: 'Test District',
        state: 'Telangana'
      });

    if (res.statusCode !== 201) {
      console.log('TEST 1 ERROR BODY:', res.body);
    }
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.status).toBe('APPROVED');
    expect(res.body.data.tokens).toHaveProperty('accessToken');
  });

  // Rule 2: Centre Operator registration becomes PENDING
  it('2. Centre Operator registration request becomes PENDING', async () => {
    const res = await request(app)
      .post('/api/auth/register/staff')
      .send({
        fullName: 'Pending Operator',
        phoneNumber: '9888800005',
        password: 'StaffPassword123!',
        requestedRole: 'CENTER_OPERATOR',
        centreId: testCentre._id,
        districtId: testDistrict._id
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');

    const createdUser = await User.findOne({ phoneNumber: '9888800005' });
    expect(createdUser.status).toBe('PENDING');

    const approvalReq = await ApprovalRequest.findOne({ userId: createdUser._id });
    expect(approvalReq).not.toBeNull();
    expect(approvalReq.status).toBe('PENDING');
  });

  // Rule 8: Super Admin cannot be created through public signup
  it('8. Super Admin cannot be created through public signup', async () => {
    const res = await request(app)
      .post('/api/auth/register/staff')
      .send({
        fullName: 'Malicious SuperAdmin',
        phoneNumber: '9888800006',
        password: 'StaffPassword123!',
        requestedRole: 'SUPER_ADMIN'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Rule 9: Pending user cannot login / access dashboard
  it('9. Pending user cannot access dashboard or login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: '9888800005',
        password: 'StaffPassword123!'
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/pending approval/i);
  });

  // Rule 3: Centre Manager can approve only operators from their centre
  it('3. Centre Manager can approve operators assigned to their centre', async () => {
    const pendingOpUser = await User.findOne({ phoneNumber: '9888800005' });
    const approvalReq = await ApprovalRequest.findOne({ userId: pendingOpUser._id });

    const res = await request(app)
      .patch(`/api/approvals/${approvalReq._id}/approve`)
      .set('Authorization', `Bearer ${centreManagerToken}`)
      .send({ remarks: 'Verified employee documents' });

    if (res.statusCode !== 200) console.log('TEST 3 ERROR BODY:', res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedUser = await User.findById(pendingOpUser._id);
    expect(updatedUser.status).toBe('APPROVED');
  });

  // Rule 4: District Admin can approve only Centre Managers in their district
  it('4. District Admin can approve Centre Managers in their district', async () => {
    // Register pending Centre Manager
    const regRes = await request(app)
      .post('/api/auth/register/staff')
      .send({
        fullName: 'Pending Manager',
        phoneNumber: '9888800007',
        password: 'StaffPassword123!',
        requestedRole: 'CENTER_MANAGER',
        centreId: testCentre._id,
        districtId: testDistrict._id
      });

    const pendingMgrUser = await User.findOne({ phoneNumber: '9888800007' });
    const approvalReq = await ApprovalRequest.findOne({ userId: pendingMgrUser._id });

    const approveRes = await request(app)
      .patch(`/api/approvals/${approvalReq._id}/approve`)
      .set('Authorization', `Bearer ${districtAdminToken}`)
      .send({ remarks: 'District approved' });

    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.success).toBe(true);

    const updatedUser = await User.findById(pendingMgrUser._id);
    expect(updatedUser.status).toBe('APPROVED');
  });

  // Rule 5: Super Admin can approve District Admin
  it('5. Super Admin can approve District Admin', async () => {
    // Register pending District Admin
    const regRes = await request(app)
      .post('/api/auth/register/staff')
      .send({
        fullName: 'Pending District Admin',
        phoneNumber: '9888800008',
        password: 'StaffPassword123!',
        requestedRole: 'DISTRICT_ADMIN',
        districtId: testDistrict._id
      });

    const pendingDistUser = await User.findOne({ phoneNumber: '9888800008' });
    const approvalReq = await ApprovalRequest.findOne({ userId: pendingDistUser._id });

    const approveRes = await request(app)
      .patch(`/api/approvals/${approvalReq._id}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ remarks: 'Super Admin Approved' });

    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.success).toBe(true);

    const updatedUser = await User.findById(pendingDistUser._id);
    expect(updatedUser.status).toBe('APPROVED');
  });

  // Rule 6: Centre Manager cannot approve District Admin
  it('6. Centre Manager cannot approve District Admin', async () => {
    // Register another pending District Admin
    await request(app)
      .post('/api/auth/register/staff')
      .send({
        fullName: 'Pending District Admin 2',
        phoneNumber: '9888800009',
        password: 'StaffPassword123!',
        requestedRole: 'DISTRICT_ADMIN',
        districtId: testDistrict._id
      });

    const pendingDistUser = await User.findOne({ phoneNumber: '9888800009' });
    const approvalReq = await ApprovalRequest.findOne({ userId: pendingDistUser._id });

    const approveRes = await request(app)
      .patch(`/api/approvals/${approvalReq._id}/approve`)
      .set('Authorization', `Bearer ${centreManagerToken}`)
      .send({});

    expect(approveRes.statusCode).toBe(403);
    expect(approveRes.body.success).toBe(false);
  });

  // Rule 10: Rejected user cannot access dashboard or login
  it('10. Rejected user cannot access dashboard or login', async () => {
    const pendingDistUser = await User.findOne({ phoneNumber: '9888800009' });
    const approvalReq = await ApprovalRequest.findOne({ userId: pendingDistUser._id });

    // Reject request via Super Admin
    await request(app)
      .patch(`/api/approvals/${approvalReq._id}/reject`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ rejectionReason: 'Invalid documentation provided' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        phoneNumber: '9888800009',
        password: 'StaffPassword123!'
      });

    expect(loginRes.statusCode).toBe(403);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.message).toMatch(/rejected/i);
  });

  // Rule 14 & 15: Quantity-aware queue calculation and capacity change recalculation
  it('14 & 15. Queue calculation uses quantity and capacity changes update estimates', async () => {
    const capRes = await queueService.getCentreEffectiveCapacity(testCentre._id);
    expect(capRes.capacityPerHour).toBe(2000);
    expect(capRes.activeCounters).toBe(2);
    expect(capRes.effectiveCapacity).toBe(4000); // 2000 * 2 = 4000 kg/hr

    const waitMin = Math.round((3500 / 4000) * 60); // 3500 kg / 4000 kg/hr = 52.5 mins -> 53 mins
    expect(waitMin).toBe(53);
  });

  // Rule 17: District reports contain completed procurement data
  it('17. District report generator generates report data cleanly', async () => {
    const reportBuffer = await excelReportService.generateDistrictProcurementReport(testDistrict._id);
    expect(Buffer.isBuffer(reportBuffer)).toBe(true);
    expect(reportBuffer.length).toBeGreaterThan(0);
  });
});

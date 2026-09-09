const mongoose = require('mongoose');
const env = require('../config/env');
const logger = require('../utils/logger');

// Import Models
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const District = require('../models/District');
const ProcurementCentre = require('../models/ProcurementCentre');
const Crop = require('../models/Crop');
const CentreCapacity = require('../models/CentreCapacity');
const Booking = require('../models/Booking');
const Token = require('../models/Token');
const Counter = require('../models/Counter');
const OfficerAssignment = require('../models/OfficerAssignment');
const Procurement = require('../models/Procurement');
const ProcurementStage = require('../models/ProcurementStage');
const DocumentVerification = require('../models/DocumentVerification');
const CentrePricing = require('../models/CentrePricing');
const Receipt = require('../models/Receipt');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { PROCUREMENT_STAGES } = require('../constants/stages');
const queueService = require('../services/queue/queue.service');

const seedDatabase = async () => {
  try {
    logger.info('Connecting to MongoDB for MandiMithra database seeding...');
    await mongoose.connect(env.MONGO_URI);
    logger.info('Clearing existing database collections...');

    await Promise.all([
      User.deleteMany({}),
      FarmerProfile.deleteMany({}),
      District.deleteMany({}),
      ProcurementCentre.deleteMany({}),
      Crop.deleteMany({}),
      CentreCapacity.deleteMany({}),
      Booking.deleteMany({}),
      Token.deleteMany({}),
      Counter.deleteMany({}),
      OfficerAssignment.deleteMany({}),
      Procurement.deleteMany({}),
      ProcurementStage.deleteMany({}),
      DocumentVerification.deleteMany({}),
      CentrePricing.deleteMany({}),
      Receipt.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    logger.info('Seeding Crops...');
    const paddy = await Crop.create({
      name: 'Paddy',
      code: 'PADDY',
      localNames: { en: 'Paddy', te: 'వరి ధాన్యం', hi: 'धान' },
      unit: 'KG',
      defaultProcessingCapacity: 2000,
      requiredDocuments: ['Aadhaar Card', 'Bank Passbook', 'Land Passbook']
    });

    const wheat = await Crop.create({
      name: 'Wheat',
      code: 'WHEAT',
      localNames: { en: 'Wheat', te: 'గోధుమలు', hi: 'गेहूं' },
      unit: 'KG',
      defaultProcessingCapacity: 1800,
      requiredDocuments: ['Aadhaar Card', 'Bank Passbook', 'Land Passbook']
    });

    const maize = await Crop.create({
      name: 'Maize',
      code: 'MAIZE',
      localNames: { en: 'Maize', te: 'మొక్కజొన్న', hi: 'मक्का' },
      unit: 'KG',
      defaultProcessingCapacity: 1500,
      requiredDocuments: ['Aadhaar Card', 'Bank Passbook']
    });

    logger.info('Seeding District...');
    const district = await District.create({
      name: 'Warangal Urban',
      code: 'WGL-URBAN',
      state: 'Telangana'
    });

    logger.info('Seeding Super Admin and District Officers...');
    const admin = await User.create({
      fullName: 'Super Administrator',
      phoneNumber: '9999999999',
      email: 'admin@mandimithra.gov.in',
      password: 'Password123',
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
      isPhoneVerified: true
    });

    const distOfficer1 = await User.create({
      fullName: 'Dr. K. Rama Rao (District Admin)',
      phoneNumber: '9888888881',
      email: 'dist.admin@mandimithra.gov.in',
      password: 'Password123',
      role: 'DISTRICT_ADMIN',
      status: 'APPROVED',
      districtId: district._id,
      isPhoneVerified: true
    });

    district.districtOfficerIds = [distOfficer1._id];
    await district.save();

    logger.info('Seeding Procurement Centres...');
    const centreABC = await ProcurementCentre.create({
      name: 'MandiMithra Demo Procurement Centre',
      code: 'ABC',
      districtId: district._id,
      address: 'Near Agriculture Market Yard, Hanumakonda',
      village: 'Hanumakonda',
      latitude: 17.9784,
      longitude: 79.5941,
      contactNumber: '0870-224455',
      workingHours: { openingTime: '08:00', closingTime: '18:00' },
      defaultCapacity: 2000,
      activeCounters: 2,
      totalCounters: 2,
      supportedCrops: [paddy._id, wheat._id, maize._id],
      requiredDocuments: [
        { name: 'Aadhaar Card', description: 'Original Aadhaar Card for identity verification', required: true },
        { name: 'Bank Passbook', description: 'Bank Passbook showing active IFSC and Account Number', required: true },
        { name: 'Land Passbook', description: 'Pattadar Passbook / Land Ownership Document', required: true }
      ]
    });

    logger.info('Seeding Centre Pricing...');
    await CentrePricing.create([
      {
        centreId: centreABC._id,
        cropId: paddy._id,
        cropName: 'Paddy',
        price: 2300,
        unit: 'Per Quintal',
        effectiveFrom: new Date('2026-09-01'),
        status: 'ACTIVE',
        createdBy: admin._id
      },
      {
        centreId: centreABC._id,
        cropId: wheat._id,
        cropName: 'Wheat',
        price: 2500,
        unit: 'Per Quintal',
        effectiveFrom: new Date('2026-09-01'),
        status: 'ACTIVE',
        createdBy: admin._id
      },
      {
        centreId: centreABC._id,
        cropId: maize._id,
        cropName: 'Maize',
        price: 2200,
        unit: 'Per Quintal',
        effectiveFrom: new Date('2026-09-01'),
        status: 'ACTIVE',
        createdBy: admin._id
      }
    ]);

    logger.info('Seeding Centre Managers & Operators...');
    const managerABC = await User.create({
      fullName: 'V. Ramesh (Centre Manager)',
      phoneNumber: '9777777771',
      email: 'manager.abc@mandimithra.gov.in',
      password: 'Password123',
      role: 'CENTER_MANAGER',
      status: 'APPROVED',
      centreId: centreABC._id,
      districtId: district._id,
      isPhoneVerified: true
    });

    const operatorABC = await User.create({
      fullName: 'S. Suresh (Centre Operator)',
      phoneNumber: '9666666661',
      email: 'operator.abc@mandimithra.gov.in',
      password: 'Password123',
      role: 'CENTER_OPERATOR',
      status: 'APPROVED',
      centreId: centreABC._id,
      districtId: district._id,
      isPhoneVerified: true
    });

    const counter1 = await Counter.create({
      centreId: centreABC._id,
      counterNumber: 1,
      status: 'OPEN',
      assignedOfficerId: operatorABC._id,
      capacityPerHour: 2000
    });

    await OfficerAssignment.create({
      officerId: operatorABC._id,
      centreId: centreABC._id,
      counterId: counter1._id,
      assignedBy: managerABC._id,
      status: 'ACTIVE'
    });

    logger.info('Seeding Farmers (P-001 to P-005 Demo Scenario)...');
    const farmerData = [
      { name: 'Farmer A (Ravi Kumar)', phone: '9111111111', qty: 1000, tokenNo: 'P-001' },
      { name: 'Farmer B (Suresh Varma)', phone: '9222222222', qty: 2000, tokenNo: 'P-002' },
      { name: 'Farmer C (Mahesh Reddy)', phone: '9333333333', qty: 500, tokenNo: 'P-003' },
      { name: 'Farmer D (Naresh Chary)', phone: '9444444444', qty: 1500, tokenNo: 'P-004' },
      { name: 'Farmer E (Demo Farmer)', phone: '9555555555', qty: 1000, tokenNo: 'P-005' }
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < farmerData.length; i++) {
      const f = farmerData[i];

      const farmerUser = await User.create({
        fullName: f.name,
        phoneNumber: f.phone,
        password: 'Password123',
        role: 'FARMER',
        status: 'APPROVED',
        language: 'en',
        isPhoneVerified: true
      });

      await FarmerProfile.create({
        userId: farmerUser._id,
        farmerId: `FARM-2026-${100 + i}`,
        fullName: f.name,
        phoneNumber: f.phone,
        village: 'Hanumakonda',
        mandal: 'Hanumakonda',
        district: 'Warangal Urban',
        state: 'Telangana',
        pincode: '506001',
        aadhaarLast4: `123${i}`,
        bankAccountLast4: `452${i}`,
        landPassbookReference: `PASSBOOK-00${i + 1}`,
        preferredLanguage: 'en',
        location: { latitude: 17.9784, longitude: 79.5941 }
      });

      const booking = await Booking.create({
        farmerId: farmerUser._id,
        centreId: centreABC._id,
        cropId: paddy._id,
        expectedQuantity: f.qty,
        preferredDate: today,
        status: 'CONFIRMED',
        bookingReference: `BK-ABC-DEMO-00${i + 1}`
      });

      const token = await Token.create({
        tokenNumber: f.tokenNo,
        bookingId: booking._id,
        farmerId: farmerUser._id,
        centreId: centreABC._id,
        cropId: paddy._id,
        expectedQuantity: f.qty,
        queuePosition: i + 1,
        status: 'WAITING',
        travelTimeMinutes: 30
      });

      const procurement = await Procurement.create({
        bookingId: booking._id,
        tokenId: token._id,
        farmerId: farmerUser._id,
        centreId: centreABC._id,
        cropId: paddy._id,
        expectedQuantity: f.qty,
        status: 'NOT_STARTED'
      });

      // Create 7 Procurement Stages
      const stageDocs = PROCUREMENT_STAGES.map(stg => ({
        procurementId: procurement._id,
        stageNumber: stg.stageNumber,
        stageName: stg.stageName,
        status: 'PENDING'
      }));

      await ProcurementStage.insertMany(stageDocs);
    }

    logger.info('Calculating initial queue metrics...');
    await queueService.recalculateQueue(centreABC._id);

    // Verify Demo Farmer P-005 Calculation
    const demoToken = await Token.findOne({ tokenNumber: 'P-005' });
    logger.info('==================================================');
    logger.info('🌾 MANDIMITRA SEED COMPLETED SUCCESSFULLY!');
    logger.info('Demo Credentials:');
    logger.info('Farmer Login: 9555555555 / OTP: 123456');
    logger.info('Centre Operator: 9666666661 / Password123');
    logger.info('Centre Manager: 9777777771 / Password123');
    logger.info('District Admin: 9888888881 / Password123');
    logger.info('Super Admin: 9999999999 / Password123');
    logger.info('==================================================');

    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`, error);
    process.exit(1);
  }
};

seedDatabase();

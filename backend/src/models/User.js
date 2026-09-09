const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ALL_ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/status');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    password: {
      type: String,
      select: false,
      default: null
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      default: ROLES.FARMER,
      index: true
    },
    language: {
      type: String,
      enum: ['en', 'te', 'hi'],
      default: 'en'
    },
    state: {
      type: String,
      default: ''
    },
    district: {
      type: String,
      default: ''
    },
    employeeId: {
      type: String,
      default: ''
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      default: null
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProcurementCentre',
      default: null
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ACTIVE'],
      default: 'APPROVED'
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    otpHash: {
      type: String,
      select: false
    },
    otpExpiresAt: {
      type: Date,
      select: false
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.compareOTP = async function (enteredOtp) {
  if (!this.otpHash) return false;
  return await bcrypt.compare(enteredOtp, this.otpHash);
};

module.exports = mongoose.model('User', userSchema);

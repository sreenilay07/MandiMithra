const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Crop name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Crop code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    localNames: {
      en: { type: String, required: true },
      te: { type: String, required: true },
      hi: { type: String, required: true }
    },
    unit: {
      type: String,
      enum: ['KG', 'QUINTAL', 'TONNE'],
      default: 'KG'
    },
    defaultProcessingCapacity: {
      type: Number,
      default: 2000 // kg per hour per counter
    },
    requiredDocuments: [
      { type: String }
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Crop', cropSchema);

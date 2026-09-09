const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'District code is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    districtOfficerIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
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

module.exports = mongoose.model('District', districtSchema);

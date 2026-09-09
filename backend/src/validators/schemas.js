const { z } = require('zod');

const sendOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(10, 'Valid phone number is required').max(15)
  })
});

const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(10).max(15),
    otp: z.string().length(6, 'OTP must be 6 digits')
  })
});

const farmerRegisterSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phoneNumber: z.string().min(10).max(15),
    village: z.string().optional(),
    mandal: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    aadhaarLast4: z.string().optional(),
    bankAccountLast4: z.string().optional(),
    landPassbookReference: z.string().optional(),
    preferredLanguage: z.enum(['en', 'te', 'hi']).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  })
});

const createBookingSchema = z.object({
  body: z.object({
    centreId: z.string().min(24, 'Valid Centre ID required'),
    cropId: z.string().min(24, 'Valid Crop ID required'),
    expectedQuantity: z.number().positive('Expected quantity must be greater than 0'),
    preferredDate: z.string().min(8, 'Preferred date is required'),
    preferredTimeSlot: z.string().optional()
  })
});

const scanArrivalQRSchema = z.object({
  body: z.object({
    qrData: z.string().min(10, 'QR code payload is required')
  })
});

const completeStageSchema = z.object({
  body: z.object({
    qrToken: z.string().optional(),
    remarks: z.string().optional(),
    actualWeight: z.number().positive().optional(),
    numberOfBags: z.number().positive().optional(),
    lorryNumber: z.string().optional(),
    testResult: z.string().optional(),
    documentNotes: z.string().optional(),
    metadata: z.record(z.any()).optional()
  })
});

const createCounterSchema = z.object({
  body: z.object({
    counterNumber: z.number().positive(),
    capacityPerHour: z.number().positive().optional()
  })
});

const assignOfficerSchema = z.object({
  body: z.object({
    officerId: z.string().min(24, 'Officer ID required'),
    counterId: z.string().optional()
  })
});

const chatbotMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message cannot be empty'),
    language: z.enum(['en', 'te', 'hi']).optional()
  })
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  farmerRegisterSchema,
  createBookingSchema,
  scanArrivalQRSchema,
  completeStageSchema,
  createCounterSchema,
  assignOfficerSchema,
  chatbotMessageSchema
};

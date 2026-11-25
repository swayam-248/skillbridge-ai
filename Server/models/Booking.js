const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  jobDescription: { type: String, required: true },
  serviceAddress: { type: String, default: '' },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [77.2090, 28.6139]
    }
  },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'escrow_held', 'released', 'refunded'],
    default: 'unpaid'
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  startOtp: { type: String },
  completionOtp: { type: String },
  startedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

BookingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Booking', BookingSchema);

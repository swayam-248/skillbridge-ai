const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: String,
  skills: [String],
  bio: String,
  isOnline: { type: Boolean, default: false },
  contactPhone: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  hourlyRate: { type: Number, default: 299 },
  baseFare: { type: Number, default: 149 },
  address: { type: String, default: '' },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [77.2090, 28.6139] // Standard default coordinates (New Delhi)
    }
  }
});

ProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Profile', ProfileSchema);

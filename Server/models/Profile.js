const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  // 👈 THIS IS THE MISSING LINK
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This must match the name you gave your User model
    required: true
  },
  fullName: String,
  skills: [String],
  bio: String,
  isOnline: { type: Boolean, default: false },
  contactPhone: String,
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Profile', ProfileSchema);
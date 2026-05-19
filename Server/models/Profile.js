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
  reviewCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Profile', ProfileSchema);
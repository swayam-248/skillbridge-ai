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
  // ... rest of your fields
});

module.exports = mongoose.model('Profile', ProfileSchema);
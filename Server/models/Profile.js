const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  name: {type: String, required: true},
  phone: {type: String, required: true},
  skills: [
    {
      professional_title: String,
      category: String
    }
  ],
  createdAt: {type: Date, default: Date.now}  
});

module.exports = mongoose.model('Profile', ProfileSchema);
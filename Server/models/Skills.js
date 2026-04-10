const mongoose = require('mongoose');


const skillSchema = new mongoose.Schema({
  id: {type: String, required: true, unique: true},
  professional_title: {type: String, required: true},
  keywords: {type: [String], required: true},
  category: {type: String, required: true}
});

module.exports = mongoose.model('Skill', skillSchema);
const mongoose = require('mongoose');
const Skill = require('./models/Skills');
const fs = require('fs');

const MONGO_URI = 'mongodb://127.0.0.1:27017/skillbridge';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("🍃 Connected to DB for import...");    
    const skills = JSON.parse(fs.readFileSync('./skills.json', 'utf-8'));

    await Skill.deleteMany({});  
    await Skill.insertMany(skills);
    
    console.log("✅ 47 Skills successfully moved to MongoDB!");
    process.exit();
  })
  .catch(err => console.error("❌ Import failed:", err));
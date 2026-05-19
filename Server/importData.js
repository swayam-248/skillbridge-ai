const mongoose = require('mongoose');
const Skill = require('./models/Skills');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillbridge';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("🍃 Connected to DB for import...");    
    const skillsFilePath = path.join(__dirname, '../Client/src/data/skills.json');
    const skills = JSON.parse(fs.readFileSync(skillsFilePath, 'utf-8'));

    await Skill.deleteMany({});  
    await Skill.insertMany(skills);
    
    console.log("✅ 47 Skills successfully moved to MongoDB!");
    process.exit();
  })
  .catch(err => console.error("❌ Import failed:", err));
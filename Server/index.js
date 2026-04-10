const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const Skill = require('./models/Skills');

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = 'mongodb://127.0.0.1:27017/skillbridge'; 

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch(err => console.error("MongoDB Connection Error:", err));

app.get('/api/skills', async(req, res)=>{
  try{
    const allSkills = await Skill.find();
    res.json(allSkills);
  }catch(err){
    console.log(err);
    res.status(500).json({ message: "Server Error: Could not fetch Skills"});
  }
});



app.get('/', (req, res) => {
  res.send('SkillBridge AI Server is Running and Database is connected!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server live on http://localhost:${PORT}`);
});
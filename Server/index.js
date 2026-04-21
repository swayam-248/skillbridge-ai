const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const Skill = require('./models/Skills');
const Profile = require('./models/Profile');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Otp = require('./models/Otp');
const sendEmail = require('./utils/sendEmail');
const cors = require('cors');

const JWT_SECRET = "skillbridge_secret_2026"

const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // Allow your React app
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

const MONGO_URI = 'mongodb://127.0.0.1:27017/skillbridge'; 

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch(err => console.error("MongoDB Connection Error:", err));



const protectRecruiter = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth Header Received:", authHeader); 

  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded Token Data:", decoded);
    
    if (decoded.role !== 'recruiter') {
      return res.status(403).json({ message: "Access denied. Recruiters only." });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT Error:", err.message); 
    res.status(401).json({ message: "Invalid Token" });
  }
};


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

app.post('/api/profiles', async(req, res) =>{
  try{
    const { name , phone, skills} = req.body;

    const newProfile = new Profile({
      name,
      phone,
      skills
    });
    const savedProfile = await await newProfile.save();
    res.status(201).json(savedProfile);
    console.log("New Profile Saved: ", savedProfile.name);
  }catch(err){
    console.log(err);
    res.status(500).json({message: "Error saving profile"});
  }
});

app.get('/api/profiles',protectRecruiter, async (req, res) => {
  try{
    const profiles = await Profile.find().sort({ createdAt: -1});
    res.json(profiles);
  }catch(err){
    res.status(500).json({message: "Error fetching profiles:"});
  }
});


app.post('/api/auth/send-otp', async(req, res) =>{
  const {email} = req.body;
  if(!email) return res.status(400).json({message: "Email is required"});

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  try{
    await Otp.findOneAndUpdate(
      {email},
      {code: otpCode, createdAt: Date.now()},
      {upsert: true}
    );
    await sendEmail(email, otpCode);
    res.status(200).json({message: "OTP sent successfully"});
  }catch(err){
    console.log(err);
    res.status(500).json({message: "Error sending OTP"});
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, code } = req.body;

  try {
    const otpRecord = await Otp.findOne({ email, code });
    if (!otpRecord) return res.status(400).json({ message: "Invalid or expired code" });

    // IDENTITY CHECK: Find or Create the permanent User
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, role: 'worker' }); // New users are workers by default
    }

    // ISSUE TOKEN: The Digital Passport
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Cleanup
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ 
      token, 
      user: { email: user.email, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ message: "Verification error" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server live on http://localhost:${PORT}`);
});
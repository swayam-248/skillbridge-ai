const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const Skill = require('./models/Skills');
const Profile = require('./models/Profile');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
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
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'recruiter') {
      return res.status(403).json({ message: "Access denied. Recruiters only." });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

const protectWorker = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'worker') {
      return res.status(403).json({ message: "Access denied. Workers only." });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

const protectAny = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
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

app.post('/api/profiles', protectWorker, async(req, res) =>{
  try{
    const { name , phone, skills} = req.body;

    const savedProfile = await Profile.findOneAndUpdate(
      { user: req.user.userId },
      {
        fullName: name,
        contactPhone: phone,
        skills: skills.map(s => s.professional_title)
      },
      { upsert: true, new: true }
    );
    res.status(201).json(savedProfile);
    console.log("Profile Saved/Updated: ", savedProfile.fullName);
  }catch(err){
    console.log(err);
    res.status(500).json({message: "Error saving profile"});
  }
});

app.get('/api/profiles', protectRecruiter, async (req, res) => {
  try {
    const { skill } = req.query; // Get skill from URL e.g., ?skill=Plumbing
    let query = {};
    if (skill) {
      // Use regex for a "flexible" search (case-insensitive)
      query = { skills: { $regex: skill, $options: 'i' } };
    }

    const profiles = await Profile.find(query).populate('user', 'email');
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


app.put('/api/profile/status', protectWorker, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.userId },
      { isOnline },
      { new: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Server error updating status" });
  }
});

app.get('/api/workers/active', protectRecruiter, async (req, res) => {
  try {
    const { skill } = req.query;
    let query = { isOnline: true };
    if (skill) {
      query.skills = { $regex: skill, $options: 'i' };
    }
    const profiles = await Profile.find(query).populate('user', 'email');
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post('/api/bookings', protectRecruiter, async (req, res) => {
  try {
    const { workerId, jobDescription } = req.body;
    const booking = new Booking({
      worker: workerId,
      recruiter: req.user.userId,
      jobDescription
    });
    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    res.status(500).json({ message: "Error creating booking" });
  }
});

app.get('/api/bookings', protectAny, async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query = {};
    if (role === 'worker') query.worker = userId;
    else if (role === 'recruiter') query.recruiter = userId;
    
    const bookings = await Booking.find(query)
      .populate('worker', 'email')
      .populate('recruiter', 'email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching bookings" });
  }
});

app.put('/api/bookings/:id/status', protectAny, async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    if (status === 'completed') updateData.completedAt = Date.now();
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: "Error updating booking status" });
  }
});

app.post('/api/reviews', protectRecruiter, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== 'completed') {
      return res.status(400).json({ message: "Booking must be completed to leave a review." });
    }
    
    const review = new Review({
      booking: bookingId,
      reviewer: req.user.userId,
      worker: booking.worker,
      rating,
      comment
    });
    await review.save();
    
    // Update worker profile rating
    const profile = await Profile.findOne({ user: booking.worker });
    if (profile) {
      const newCount = profile.reviewCount + 1;
      const newRating = ((profile.rating * profile.reviewCount) + rating) / newCount;
      profile.reviewCount = newCount;
      profile.rating = newRating;
      await profile.save();
    }
    
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: "Error submitting review" });
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
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const Skill = require('./models/Skills');
const Profile = require('./models/Profile');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Job = require('./models/Job');
const Application = require('./models/Application');
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

app.post('/api/profiles', protectAny, async(req, res) =>{
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

app.get('/api/profile/me', protectAny, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.userId }).populate('user', 'email');

    // 1. RECRUITERS ALWAYS SKIP (even without a profile record)
    if (req.user.role === 'recruiter') {
      return res.json({ isComplete: true });
    }

    if (!profile) {
      return res.json({ isComplete: false });
    }

    // Fetch reviews and calculate average (for workers)
    const reviews = await Review.find({ worker: req.user.userId }).sort({ createdAt: -1 });
    const avgRating = reviews.length > 0 
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
      : 0;

    // Fetch work history (for workers)
    const workHistory = await Booking.find({ worker: req.user.userId, status: 'completed' })
      .populate('recruiter', 'email')
      .sort({ completedAt: -1 });

    const user = profile.user;
    
    // 2. EXISTING USERS SKIP (account > 10s old)
    const isExistingUser = !user.createdAt || (new Date(user.createdAt).getTime() < (Date.now() - 10000));
    const isComplete = isExistingUser || !!(profile.fullName && profile.contactPhone);

    res.json({
      ...profile._doc,
      isComplete,
      averageRating: avgRating.toFixed(1),
      reviewCount: reviews.length,
      reviews,
      workHistory
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/api/profiles', protectRecruiter, async (req, res) => {
  try {
    const { skill } = req.query;
    
    // 1. Fetch all users who are 'workers'
    const workers = await User.find({ role: 'worker' });

    // 2. Fetch profiles for these workers and enrich them
    const enrichedProfiles = await Promise.all(workers.map(async (worker) => {
      // Find the profile (it might not exist if they skipped onboarding)
      let profile = await Profile.findOne({ user: worker._id });
      
      // If we are searching for a specific skill and this profile doesn't have it, skip
      if (skill) {
        const skillRegex = new RegExp(skill, 'i');
        const hasSkill = profile && profile.skills && profile.skills.some(s => skillRegex.test(s));
        if (!hasSkill) return null;
      }

      // Fetch reviews for rating
      const reviews = await Review.find({ worker: worker._id });
      const avgRating = reviews.length > 0 
        ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
        : 0;

      // Return a unified object
      return {
        _id: profile?._id || `temp_${worker._id}`,
        user: { _id: worker._id, email: worker.email },
        fullName: profile?.fullName || "Anonymous Worker",
        contactPhone: profile?.contactPhone || "Not provided",
        skills: profile?.skills || [],
        isOnline: profile?.isOnline || false,
        averageRating: avgRating.toFixed(1),
        reviewCount: reviews.length
      };
    }));

    // Filter out nulls (from the skill filter)
    res.json(enrichedProfiles.filter(p => p !== null));
  } catch (err) {
    console.error("Error fetching profiles:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.put('/api/profile/status', protectWorker, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.userId },
      { isOnline },
      { new: true, upsert: true } // Create profile if it doesn't exist
    );
    res.json(profile);
  } catch (err) {
    console.error("Error updating status:", err);
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

// Job Board Endpoints
app.post('/api/jobs', protectRecruiter, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, recruiter: req.user.userId });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: "Error creating job" });
  }
});

app.get('/api/jobs', protectAny, async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' }).populate('recruiter', 'email').sort({createdAt: -1});
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

app.post('/api/jobs/:id/apply', protectWorker, async (req, res) => {
  try {
    const existing = await Application.findOne({ job: req.params.id, worker: req.user.userId });
    if (existing) return res.status(400).json({ message: "Already applied to this job" });

    const application = await Application.create({
      job: req.params.id,
      worker: req.user.userId
    });
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: "Error applying for job" });
  }
});

app.get('/api/applications/me', protectWorker, async (req, res) => {
  try {
    const applications = await Application.find({ worker: req.user.userId })
      .populate({
        path: 'job',
        populate: { path: 'recruiter', select: 'email' }
      })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: "Error fetching applications" });
  }
});

app.get('/api/applications/job/:jobId', protectRecruiter, async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('worker', 'email')
      .sort({ createdAt: -1 });
    
    // We also need profile info for each worker
    const enriched = await Promise.all(applications.map(async (app) => {
      const profile = await Profile.findOne({ user: app.worker._id });
      return { ...app._doc, profile };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Error fetching applicants" });
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
  let {email} = req.body;
  if(!email) return res.status(400).json({message: "Email is required"});
  
  email = email.trim().toLowerCase();
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  try{
    await Otp.findOneAndUpdate(
      {email},
      {code: otpCode, createdAt: Date.now()},
      {upsert: true}
    );
    console.log(`OTP [${otpCode}] generated for [${email}]`);
    await sendEmail(email, otpCode);
    res.status(200).json({message: "OTP sent successfully"});
  }catch(err){
    console.error("Error in /send-otp:", err);
    res.status(500).json({message: "Error sending OTP"});
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  let { email, code, role } = req.body;
  if(!email || !code) return res.status(400).json({message: "Email and code are required"});

  email = email.trim().toLowerCase();
  code = code.trim();

  try {
    console.log(`Verifying OTP for [${email}] with code [${code}]`);
    const otpRecord = await Otp.findOne({ email, code });
    
    if (!otpRecord) {
      console.log(`Verification failed: No record found for [${email}] with code [${code}]`);
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // IDENTITY CHECK: Find or Create the permanent User
    let isNewUser = false;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, role: role || 'worker' }); 
      isNewUser = true;
      console.log(`New user created: [${email}] as [${user.role}]`);
    }

    // ISSUE TOKEN
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    // Cleanup
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log(`Verification successful for [${email}]`);

    // Check if profile exists
    const profile = await Profile.findOne({ user: user._id });
    
    // Recruiters always skip. Existing workers skip. New workers see onboarding.
    const isExistingUser = !isNewUser || !user.createdAt || (new Date(user.createdAt).getTime() < (Date.now() - 10000));
    const isComplete = user.role === 'recruiter' || isExistingUser; 

    res.status(200).json({ 
      token, 
      user: { 
        email: user.email, 
        role: user.role,
        isComplete,
        // Include any existing profile data
        fullName: profile?.fullName,
        contactPhone: profile?.contactPhone,
        skills: profile?.skills,
        isOnline: profile?.isOnline,
        averageRating: profile?.rating,
        reviewCount: profile?.reviewCount
      } 
    });
  } catch (error) {
    console.error("Error in /verify-otp:", error);
    res.status(500).json({ message: "Verification error" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server live on http://localhost:${PORT}`);
});
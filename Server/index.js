const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const Skill = require('./models/Skills');
const Profile = require('./models/Profile');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Job = require('./models/Job');
const Application = require('./models/Application');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Otp = require('./models/Otp');
const sendEmail = require('./utils/sendEmail');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { validateBookingTransition } = require('./utils/bookingStateMachine');

// Secure in-memory store for single-use OAuth authorization codes (TTL: 60 seconds)
const oauthAuthCodes = new Map();

function createOAuthExchangeCode(payload) {
  const code = crypto.randomBytes(32).toString('hex');
  oauthAuthCodes.set(code, {
    ...payload,
    expiresAt: Date.now() + 60000 // 60s
  });
  setTimeout(() => oauthAuthCodes.delete(code), 65000);
  return code;
}

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : "skillbridge_dev_secret");

const app = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
    origin: [clientUrl, 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

const distPath = path.join(__dirname, '../Client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skillbridge'; 

let mongoConnectionError = null;
let mongoConnectionPromise = null;

const connectMongo = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose.connection);
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000
    })
      .then(() => {
        mongoConnectionError = null;
        console.log("MongoDB Connected Successfully!");
        return mongoose.connection;
      })
      .catch(err => {
        mongoConnectionPromise = null;
        mongoConnectionError = err;
        console.error("MongoDB Connection Error:", err);
        throw err;
      });
  }

  return mongoConnectionPromise;
};

connectMongo().catch(err => {
    mongoConnectionError = err;
  });

const requireMongo = async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    res.status(503).json({
      message: 'Database connection unavailable',
      error: err.message
    });
  }
};



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
app.get('/api/skills', requireMongo, async(req, res)=>{
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

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mongoReadyState: mongoose.connection.readyState,
    hasMongoUri: Boolean(process.env.MONGO_URI || process.env.MONGODB_URI),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasEmailConfig: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    hasGoogleConfig: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    mongoError: mongoConnectionError
      ? { name: mongoConnectionError.name, message: mongoConnectionError.message }
      : null
  });
});

app.use('/api', requireMongo);

app.post('/api/profiles', protectAny, async(req, res) =>{
  try{
    const { name , phone, skills, bio } = req.body;

    const savedProfile = await Profile.findOneAndUpdate(
      { user: req.user.userId },
      {
        fullName: typeof name === 'string' ? name.trim() : name,
        contactPhone: typeof phone === 'string' ? phone.trim() : phone,
        bio: typeof bio === 'string' ? bio.trim() : '',
        skills: Array.isArray(skills) ? skills.map(s => typeof s === 'string' ? s : (s?.professional_title || '')) : []
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

app.get('/api/profiles/:userId', protectAny, async (req, res) => {
  try {
    const { userId } = req.params;
    
    let profile = await Profile.findOne({ user: userId }).populate('user', 'email');
    
    if (!profile) {
      const worker = await User.findById(userId);
      if (!worker) {
        return res.status(404).json({ message: "Worker not found" });
      }
      return res.json({
        fullName: "Anonymous Worker",
        user: { _id: worker._id, email: worker.email },
        skills: [],
        isOnline: false,
        contactPhone: "Not provided",
        bio: "",
        averageRating: "0.0",
        reviewCount: 0,
        reviews: [],
        workHistory: []
      });
    }

    const reviews = await Review.find({ worker: userId }).sort({ createdAt: -1 });
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
      : (profile.rating ? profile.rating.toFixed(1) : "0.0");

    const workHistory = await Booking.find({ worker: userId, status: 'completed' })
      .populate('recruiter', 'email')
      .sort({ completedAt: -1 });
    
    res.json({
      ...profile._doc,
      averageRating: avgRating,
      reviewCount: reviews.length,
      reviews,
      workHistory
    });
  } catch (err) {
    console.error("Error fetching profile details:", err);
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
    const { recruiter } = req.query;
    let query = { status: 'open' };
    if (req.user.role === 'recruiter' && recruiter === 'me') {
      query = { recruiter: req.user.userId };
    }
    const jobs = await Job.find(query).populate('recruiter', 'email').sort({createdAt: -1});
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

app.put('/api/applications/:id/status', protectRecruiter, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid application status" });
    }
    const updatedApp = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('worker', 'email').populate('job');

    if (!updatedApp) return res.status(404).json({ message: "Application not found" });
    res.json(updatedApp);
  } catch (err) {
    res.status(500).json({ message: "Error updating application status" });
  }
});

app.post('/api/bookings', protectRecruiter, async (req, res) => {
  try {
    const { workerId, jobDescription } = req.body;
    if (!workerId || !jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ message: "Worker ID and job description are required." });
    }

    const workerUser = await User.findById(workerId);
    if (!workerUser || workerUser.role !== 'worker') {
      return res.status(404).json({ message: "Worker profile not found." });
    }

    // Prevent duplicate concurrent pending/accepted booking requests between this recruiter and worker
    const existingActive = await Booking.findOne({
      worker: workerId,
      recruiter: req.user.userId,
      status: { $in: ['pending', 'accepted'] }
    });
    if (existingActive) {
      return res.status(409).json({
        message: `An active booking (${existingActive.status}) already exists with this worker.`
      });
    }

    const booking = new Booking({
      worker: workerId,
      recruiter: req.user.userId,
      jobDescription: jobDescription.trim(),
      status: 'pending'
    });
    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    console.error("Booking creation error:", err);
    res.status(500).json({ message: "Error creating booking." });
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
    if (!status) {
      return res.status(400).json({ message: "New status is required." });
    }

    const targetStatus = status.toLowerCase();

    // 1. Fetch current booking to verify state transition & authorization
    const existing = await Booking.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const transitionCheck = validateBookingTransition(
      existing.status,
      targetStatus,
      req.user,
      existing.worker,
      existing.recruiter
    );

    if (!transitionCheck.valid) {
      return res.status(transitionCheck.code || 400).json({ message: transitionCheck.message });
    }

    // 2. Atomic Compare-And-Swap update to prevent race conditions (e.g. concurrent accept/cancel)
    const updateData = { status: targetStatus };
    if (targetStatus === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        status: existing.status // Ensures atomic CAS; fails if state changed between read and write
      },
      { $set: updateData },
      { new: true }
    )
      .populate('worker', 'email')
      .populate('recruiter', 'email');

    if (!updatedBooking) {
      return res.status(409).json({
        message: "Concurrent update conflict: The booking status was modified by another operation. Please refresh."
      });
    }

    res.json(updatedBooking);
  } catch (err) {
    console.error("Booking status update error:", err);
    res.status(500).json({ message: "Error updating booking status." });
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
    
    // Update worker profile rating accurately
    const profile = await Profile.findOne({ user: booking.worker });
    if (profile) {
      const allWorkerReviews = await Review.find({ worker: booking.worker });
      const totalScore = allWorkerReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
      const avg = allWorkerReviews.length > 0 ? (totalScore / allWorkerReviews.length) : rating;
      profile.reviewCount = allWorkerReviews.length;
      profile.rating = Number(avg.toFixed(1));
      await profile.save();
    }
    
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: "Error submitting review" });
  }
});

// EMAIL & PASSWORD AUTHENTICATION
app.post('/api/auth/register', async (req, res) => {
  let { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  email = email.trim().toLowerCase();
  password = String(password).trim();

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.password) {
        return res.status(400).json({ message: "Email is already registered. Please log in." });
      } else {
        // Upgrade existing OAuth/OTP user with a password
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.password = hashedPassword;
        if (role) existingUser.role = role;
        await existingUser.save();

        const token = jwt.sign(
          { userId: existingUser._id, role: existingUser.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        const profile = await Profile.findOne({ user: existingUser._id });
        const isComplete = existingUser.role === 'recruiter' || Boolean(profile && profile.skills?.length > 0);

        return res.status(200).json({
          token,
          user: {
            email: existingUser.email,
            role: existingUser.role,
            isComplete,
            fullName: profile?.fullName,
            contactPhone: profile?.contactPhone,
            skills: profile?.skills,
            isOnline: profile?.isOnline,
            averageRating: profile?.rating,
            reviewCount: profile?.reviewCount
          }
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'recruiter' ? 'recruiter' : 'worker';
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: userRole
    });

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const isComplete = userRole === 'recruiter';

    res.status(201).json({
      token,
      user: {
        email: newUser.email,
        role: newUser.role,
        isComplete
      }
    });
  } catch (err) {
    console.error("Error in /register:", err);
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  email = email.trim().toLowerCase();
  password = String(password).trim();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Account not found. Please register first." });
    }

    if (!user.password) {
      return res.status(400).json({ message: "This account was signed up via Google. Please log in with Google." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password. Please try again." });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const profile = await Profile.findOne({ user: user._id });
    const isComplete = user.role === 'recruiter' || Boolean(profile && profile.skills?.length > 0);

    res.status(200).json({
      token,
      user: {
        email: user.email,
        role: user.role,
        isComplete,
        fullName: profile?.fullName,
        contactPhone: profile?.contactPhone,
        skills: profile?.skills,
        isOnline: profile?.isOnline,
        averageRating: profile?.rating,
        reviewCount: profile?.reviewCount
      }
    });
  } catch (err) {
    console.error("Error in /login:", err);
    res.status(500).json({ message: "Error logging in" });
  }
});

// Single-use OAuth authorization code exchange endpoint (moves tokens out of the URL)
app.post('/api/auth/exchange-code', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Authorization exchange code is required." });
  }

  const session = oauthAuthCodes.get(code);
  if (!session) {
    return res.status(400).json({ message: "Invalid or expired authorization code." });
  }

  if (Date.now() > session.expiresAt) {
    oauthAuthCodes.delete(code);
    return res.status(400).json({ message: "Authorization code has expired." });
  }

  // Single-use: immediately delete to prevent replay attacks
  oauthAuthCodes.delete(code);

  return res.json({
    token: session.token,
    user: session.user
  });
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


app.get('/api/auth/google', (req, res) => {
  const { role } = req.query;
  const userRole = role === 'recruiter' ? 'recruiter' : 'worker';

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).send("Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in your environment variables.");
  }

  const host = req.get('host');
  const protocol = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&state=${userRole}`;

  res.redirect(googleUrl);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state } = req.query; // state contains the role

  if (!code) {
    return res.status(400).send("Google authorization code missing.");
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).send("Google OAuth configuration is missing on the server.");
  }

  const host = req.get('host');
  const protocol = (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https';
  const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;

  try {
    // Exchange authorization code for tokens using native fetch
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Google Token Exchange Failed:", data);
      return res.status(400).send("Google token exchange failed: " + (data.error_description || data.error));
    }

    const { id_token } = data;
    const decoded = jwt.decode(id_token);
    if (!decoded || !decoded.email) {
      return res.status(400).send("Invalid Google ID token.");
    }

    const email = decoded.email.toLowerCase().trim();
    const name = decoded.name;

    // Find or create user
    let user = await User.findOne({ email });
    let isNewUser = false;
    if (!user) {
      const role = state === 'recruiter' ? 'recruiter' : 'worker';
      user = await User.create({ email, role });
      isNewUser = true;
      console.log(`OAuth: Created new user [${email}] as [${user.role}]`);
    }

    // Find or create profile
    let profile = await Profile.findOne({ user: user._id });
    if (!profile) {
      profile = await Profile.create({
        user: user._id,
        fullName: name || 'Anonymous User',
        skills: [],
        isOnline: false,
        contactPhone: ''
      });
      console.log(`OAuth: Created new profile for [${email}]`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Determine profile completeness
    const isExistingUser = !isNewUser || !user.createdAt || (new Date(user.createdAt).getTime() < (Date.now() - 10000));
    // Generate short-lived single-use authorization code so JWT never touches the URL query string
    const exchangeCode = createOAuthExchangeCode({
      token,
      user: {
        email: user.email,
        role: user.role,
        isComplete,
        fullName: profile?.fullName,
        contactPhone: profile?.contactPhone,
        skills: profile?.skills,
        isOnline: profile?.isOnline,
        averageRating: profile?.rating,
        reviewCount: profile?.reviewCount
      }
    });

    // Dynamic redirect back to the client app with one-time exchange code
    const redirectOrigin = (host.includes('localhost') || host.includes('127.0.0.1')) ? clientUrl : `${protocol}://${host}`;
    res.redirect(`${redirectOrigin}/login?code=${exchangeCode}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.status(500).send("Internal server error during Google OAuth callback.");
  }
});


if (fs.existsSync(distPath)) {
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get(/.*/, (req, res) => {
    res.send('SkillBridge AI Server is Running! (Frontend build directory not found)');
  });
}

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server live on port ${PORT}`);
  });
}

module.exports = app;

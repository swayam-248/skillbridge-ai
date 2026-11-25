const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');
const { JWT_SECRET } = require('../middleware/authMiddleware');

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

// REGISTER
router.post('/register', async (req, res) => {
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
            _id: existingUser._id,
            userId: existingUser._id,
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
        _id: newUser._id,
        userId: newUser._id,
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

// LOGIN
router.post('/login', async (req, res) => {
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
        _id: user._id,
        userId: user._id,
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

// SINGLE-USE OAUTH AUTHORIZATION CODE EXCHANGE
router.post('/exchange-code', (req, res) => {
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

// SEND OTP
router.post('/send-otp', async (req, res) => {
  let { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  email = email.trim().toLowerCase();
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await Otp.findOneAndUpdate(
      { email },
      { code: otpCode, createdAt: Date.now() },
      { upsert: true }
    );
    console.log(`OTP [${otpCode}] generated for [${email}]`);
    await sendEmail(email, otpCode);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error in /send-otp:", err);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  let { email, code, role } = req.body;
  if (!email || !code) return res.status(400).json({ message: "Email and code are required" });

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
        _id: user._id,
        userId: user._id,
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
  } catch (error) {
    console.error("Error in /verify-otp:", error);
    res.status(500).json({ message: "Verification error" });
  }
});

// GOOGLE OAUTH INITIATE
router.get('/google', (req, res) => {
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

// GOOGLE OAUTH CALLBACK
router.get('/google/callback', async (req, res) => {
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
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  try {
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
    const isComplete = user.role === 'recruiter' || isExistingUser;

    const exchangeCode = createOAuthExchangeCode({
      token,
      user: {
        _id: user._id,
        userId: user._id,
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

    const redirectOrigin = (host.includes('localhost') || host.includes('127.0.0.1')) ? clientUrl : `${protocol}://${host}`;
    res.redirect(`${redirectOrigin}/login?code=${exchangeCode}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.status(500).send("Internal server error during Google OAuth callback.");
  }
});

module.exports = router;


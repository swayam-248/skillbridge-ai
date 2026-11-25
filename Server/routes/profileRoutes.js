const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const User = require('../models/User');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { protectAny, protectRecruiter, protectWorker } = require('../middleware/authMiddleware');
const { broadcastAll } = require('../sockets/socketManager');

// SAVE OR UPDATE PROFILE
router.post('/profiles', protectAny, async (req, res) => {
  try {
    const { name, phone, skills, bio, address, location, hourlyRate, baseFare } = req.body;

    const updateFields = {
      fullName: typeof name === 'string' ? name.trim() : name,
      contactPhone: typeof phone === 'string' ? phone.trim() : phone,
      bio: typeof bio === 'string' ? bio.trim() : '',
      skills: Array.isArray(skills)
        ? skills.map(s => (typeof s === 'string' ? s : s?.professional_title || '')).filter(Boolean)
        : []
    };

    if (address !== undefined) updateFields.address = address;
    if (hourlyRate !== undefined) updateFields.hourlyRate = Number(hourlyRate) || 0;
    if (baseFare !== undefined) updateFields.baseFare = Number(baseFare) || 0;

    // Optional GeoJSON coordinates [longitude, latitude]
    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      updateFields.location = {
        type: 'Point',
        coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
      };
    } else if (req.body.lng !== undefined && req.body.lat !== undefined) {
      updateFields.location = {
        type: 'Point',
        coordinates: [Number(req.body.lng), Number(req.body.lat)]
      };
    }

    const savedProfile = await Profile.findOneAndUpdate(
      { user: req.user.userId },
      updateFields,
      { upsert: true, new: true }
    );
    res.status(201).json(savedProfile);
    console.log("Profile Saved/Updated: ", savedProfile.fullName);
  } catch (err) {
    console.error("Error saving profile:", err);
    res.status(500).json({ message: "Error saving profile" });
  }
});

// GET CURRENT USER'S PROFILE DOSSIER
router.get('/profile/me', protectAny, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.userId }).populate('user', 'email');

    // Recruiters always skip onboarding
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

    // Existing users skip
    const isExistingUser = !user?.createdAt || (new Date(user.createdAt).getTime() < (Date.now() - 10000));
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
    console.error("Error in /profile/me:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL VERIFIED WORKERS (RECRUITER VIEW)
router.get('/profiles', protectRecruiter, async (req, res) => {
  try {
    const { skill } = req.query;

    const workers = await User.find({ role: 'worker' });

    const enrichedProfiles = await Promise.all(workers.map(async (worker) => {
      let profile = await Profile.findOne({ user: worker._id });

      if (skill) {
        const skillRegex = new RegExp(skill, 'i');
        const hasSkill = profile && profile.skills && profile.skills.some(s => skillRegex.test(s));
        if (!hasSkill) return null;
      }

      const reviews = await Review.find({ worker: worker._id });
      const avgRating = reviews.length > 0
        ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
        : 0;

      return {
        _id: profile?._id || `temp_${worker._id}`,
        user: { _id: worker._id, email: worker.email },
        fullName: profile?.fullName || "Anonymous Worker",
        contactPhone: profile?.contactPhone || "Not provided",
        skills: profile?.skills || [],
        isOnline: profile?.isOnline || false,
        hourlyRate: profile?.hourlyRate || 299,
        baseFare: profile?.baseFare || 149,
        address: profile?.address || "",
        location: profile?.location || { type: 'Point', coordinates: [77.2090, 28.6139] },
        averageRating: avgRating.toFixed(1),
        reviewCount: reviews.length
      };
    }));

    res.json(enrichedProfiles.filter(p => p !== null));
  } catch (err) {
    console.error("Error fetching profiles:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GEOSPATIAL SEARCH: GET NEARBY ONLINE WORKERS
router.get('/workers/nearby', protectAny, async (req, res) => {
  try {
    const { lng, lat, radius = 15, skill } = req.query; // radius in km (default 15 km)

    if (!lng || !lat) {
      return res.status(400).json({ message: "Coordinates lng and lat are required" });
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);
    const maxDistanceMeters = parseFloat(radius) * 1000;

    let query = {
      isOnline: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceMeters
        }
      }
    };

    if (skill) {
      query.skills = { $regex: skill, $options: 'i' };
    }

    const nearbyProfiles = await Profile.find(query).populate('user', 'email');

    // Enrich with ratings
    const results = await Promise.all(nearbyProfiles.map(async (prof) => {
      const reviews = await Review.find({ worker: prof.user._id });
      const avg = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : (prof.rating || 0).toFixed(1);

      return {
        _id: prof._id,
        user: prof.user,
        fullName: prof.fullName,
        skills: prof.skills,
        bio: prof.bio,
        isOnline: prof.isOnline,
        hourlyRate: prof.hourlyRate || 299,
        baseFare: prof.baseFare || 149,
        address: prof.address,
        location: prof.location,
        averageRating: avg,
        reviewCount: reviews.length
      };
    }));

    res.json(results);
  } catch (err) {
    console.error("Error finding nearby workers:", err);
    res.status(500).json({ message: "Server error finding nearby workers", error: err.message });
  }
});

// GET ACTIVE ONLINE WORKERS (RADAR)
router.get('/workers/active', protectRecruiter, async (req, res) => {
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

// GET SPECIFIC WORKER PROFILE DOSSIER
router.get('/profiles/:userId', protectAny, async (req, res) => {
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
        hourlyRate: 299,
        baseFare: 149,
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

// TOGGLE WORKER STATUS (ONLINE / OFFLINE)
router.put('/profile/status', protectWorker, async (req, res) => {
  try {
    const { isOnline, location } = req.body;
    const updateData = { isOnline };

    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      updateData.location = {
        type: 'Point',
        coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
      };
    }

    const profile = await Profile.findOneAndUpdate(
      { user: req.user.userId },
      updateData,
      { new: true, upsert: true }
    );

    // Broadcast live worker status change to all connected clients (recruiters & talent pool)
    broadcastAll('worker:status_changed', {
      userId: req.user.userId,
      isOnline,
      profile
    });

    res.json(profile);
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "Server error updating status" });
  }
});

module.exports = router;


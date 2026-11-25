const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const Review = require('../models/Review');
const Profile = require('../models/Profile');
const { protectRecruiter, protectAny } = require('../middleware/authMiddleware');
const { validateBookingTransition } = require('../utils/bookingStateMachine');
const { notifyUser, latestBookingLocations } = require('../sockets/socketManager');

// CREATE DIRECT BOOKING / UBER-STYLE DISPATCH
router.post('/bookings', protectRecruiter, async (req, res) => {
  try {
    const { workerId, jobDescription, serviceAddress, location, totalAmount } = req.body;
    if (!workerId || !jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ message: "Worker ID and job description are required." });
    }

    const workerUser = await User.findById(workerId);
    if (!workerUser || workerUser.role !== 'worker') {
      return res.status(404).json({ message: "Worker profile not found." });
    }

    // Prevent duplicate concurrent active booking requests between this recruiter and worker
    const existingActive = await Booking.findOne({
      worker: workerId,
      recruiter: req.user.userId,
      status: { $in: ['pending', 'accepted', 'in_progress'] }
    });
    if (existingActive) {
      return res.status(409).json({
        message: `An active booking (${existingActive.status}) already exists with this worker.`
      });
    }

    const bookingData = {
      worker: workerId,
      recruiter: req.user.userId,
      jobDescription: jobDescription.trim(),
      status: 'pending',
      serviceAddress: serviceAddress || '',
      totalAmount: Number(totalAmount) || 299
    };

    if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      bookingData.location = {
        type: 'Point',
        coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])]
      };
    }

    // Generate random 4-digit doorstep verification start OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    bookingData.startOtp = generatedOtp;

    const booking = new Booking(bookingData);
    const savedBooking = await booking.save();

    // Populate for response and socket dispatch
    const populated = await Booking.findById(savedBooking._id)
      .populate('worker', 'email')
      .populate('recruiter', 'email');

    // Real-Time Socket Dispatch to the Worker: Trigger 30s Alert Popup
    notifyUser(workerId, 'dispatch:incoming_request', {
      bookingId: savedBooking._id,
      recruiter: populated.recruiter,
      jobDescription: savedBooking.jobDescription,
      serviceAddress: savedBooking.serviceAddress,
      location: savedBooking.location,
      totalAmount: savedBooking.totalAmount,
      timeoutSeconds: 30,
      createdAt: savedBooking.createdAt
    });

    // Also notify both users that a new booking was created in real time
    notifyUser(workerId.toString(), 'booking:created', populated);
    notifyUser(req.user.userId.toString(), 'booking:created', populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error("Booking creation error:", err);
    res.status(500).json({ message: "Error creating booking." });
  }
});

// GET USER BOOKINGS
router.get('/bookings', protectAny, async (req, res) => {
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

// ATOMIC STATE TRANSITION WITH DOORSTEP OTP & REAL-TIME WEBSOCKET NOTIFICATION
router.put('/bookings/:id/status', protectAny, async (req, res) => {
  try {
    const { status, otp } = req.body;
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

    // Doorstep verification OTP check when starting work
    if (targetStatus === 'in_progress') {
      if (!otp) {
        return res.status(400).json({ message: "Recruiter doorstep start OTP is required to start the job." });
      }
      if (String(otp).trim() !== String(existing.startOtp).trim()) {
        return res.status(400).json({ message: "Incorrect OTP. Please ask the recruiter for the 4-digit start code." });
      }
    }

    // 2. Atomic Compare-And-Swap update to prevent race conditions
    const updateData = { status: targetStatus };
    if (targetStatus === 'in_progress') {
      updateData.startedAt = new Date();
    } else if (targetStatus === 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        status: existing.status // Ensures atomic CAS
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

    if (targetStatus === 'completed' || targetStatus === 'cancelled') {
      latestBookingLocations.delete(String(req.params.id));
    }

    // Broadcast real-time status update to both the worker and recruiter rooms
    notifyUser(existing.worker.toString(), 'booking:status_changed', updatedBooking);
    notifyUser(existing.recruiter.toString(), 'booking:status_changed', updatedBooking);

    res.json(updatedBooking);
  } catch (err) {
    console.error("Booking status update error:", err);
    res.status(500).json({ message: "Error updating booking status." });
  }
});

// SUBMIT REVIEW
router.post('/reviews', protectRecruiter, async (req, res) => {
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
      const avg = allWorkerReviews.length > 0 ? totalScore / allWorkerReviews.length : rating;
      profile.reviewCount = allWorkerReviews.length;
      profile.rating = Number(avg.toFixed(1));
      await profile.save();

      // Notify the worker in real time that they received a verified 5-star review
      notifyUser(booking.worker.toString(), 'review:received', {
        bookingId,
        rating,
        comment,
        newRating: profile.rating,
        reviewCount: profile.reviewCount
      });
    }

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: "Error submitting review" });
  }
});

module.exports = router;

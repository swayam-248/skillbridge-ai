const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const ChatMessage = require('../models/ChatMessage');
const { protectAny } = require('../middleware/authMiddleware');
const { getIO, notifyUser } = require('../sockets/socketManager');

// GET CHAT HISTORY FOR A BOOKING
router.get('/chat/:bookingId', protectAny, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const userIdStr = String(req.user.userId);
    const isWorker = userIdStr === String(booking.worker);
    const isRecruiter = userIdStr === String(booking.recruiter);

    if (!isWorker && !isRecruiter) {
      return res.status(403).json({ message: "Access denied to chat for this booking" });
    }

    const messages = await ChatMessage.find({ booking: bookingId })
      .populate('sender', 'email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching chat messages:", err);
    res.status(500).json({ message: "Error fetching chat messages" });
  }
});

// SEND A CHAT MESSAGE
router.post('/chat/:bookingId', protectAny, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Only allow chat while job is actively accepted or in progress
    if (booking.status !== 'accepted' && booking.status !== 'in_progress') {
      return res.status(400).json({
        message: `Chat is disabled because this job is ${booking.status}.`
      });
    }

    const userIdStr = String(req.user.userId);
    const isWorker = userIdStr === String(booking.worker);
    const isRecruiter = userIdStr === String(booking.recruiter);

    if (!isWorker && !isRecruiter) {
      return res.status(403).json({ message: "Access denied: Not a participant of this booking" });
    }

    const senderRole = isWorker ? 'worker' : 'recruiter';
    const recipientId = isWorker ? String(booking.recruiter) : String(booking.worker);

    const chatMsg = await ChatMessage.create({
      booking: bookingId,
      sender: req.user.userId,
      senderRole,
      message: message.trim()
    });

    const populated = await ChatMessage.findById(chatMsg._id).populate('sender', 'email');

    // Broadcast in real time to the booking chat room
    const io = getIO();
    if (io) {
      io.to(`booking:chat:${bookingId}`).emit('chat:message', populated);
    }

    // Also notify recipient's personal user room so they see an unread badge/notification
    notifyUser(recipientId, 'chat:notification', {
      bookingId,
      message: populated
    });

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Error sending message" });
  }
});

module.exports = router;


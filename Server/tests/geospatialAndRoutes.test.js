const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Profile = require('../models/Profile');
const Booking = require('../models/Booking');
const authRoutes = require('../routes/authRoutes');
const profileRoutes = require('../routes/profileRoutes');
const bookingRoutes = require('../routes/bookingRoutes');
const jobRoutes = require('../routes/jobRoutes');
const skillRoutes = require('../routes/skillRoutes');
const chatRoutes = require('../routes/chatRoutes');
const ChatMessage = require('../models/ChatMessage');
const { validateBookingTransition } = require('../utils/bookingStateMachine');
const { getIO, notifyUser, latestBookingLocations } = require('../sockets/socketManager');

describe('Modular Architecture & Route Integrity', () => {
  it('exports valid express router instances for all modules', () => {
    assert.equal(typeof authRoutes, 'function');
    assert.equal(typeof profileRoutes, 'function');
    assert.equal(typeof bookingRoutes, 'function');
    assert.equal(typeof jobRoutes, 'function');
    assert.equal(typeof skillRoutes, 'function');
    assert.equal(typeof chatRoutes, 'function');
  });

  it('exports socket manager utility functions and location cache', () => {
    assert.equal(typeof getIO, 'function');
    assert.equal(typeof notifyUser, 'function');
    assert.ok(latestBookingLocations instanceof Map);
    
    // Test cache set/get/delete
    latestBookingLocations.set('booking-test-1', [28.6139, 77.2090]);
    assert.deepEqual(latestBookingLocations.get('booking-test-1'), [28.6139, 77.2090]);
    latestBookingLocations.delete('booking-test-1');
    assert.equal(latestBookingLocations.has('booking-test-1'), false);
  });

  it('ChatMessage model defines required schema fields', () => {
    const msg = new ChatMessage({
      booking: '507f1f77bcf86cd799439011',
      sender: '507f1f77bcf86cd799439012',
      senderRole: 'worker',
      message: 'Hello, I am on my way!'
    });
    assert.equal(msg.senderRole, 'worker');
    assert.equal(msg.message, 'Hello, I am on my way!');
    assert.ok(msg.createdAt);
  });
});

describe('Geospatial Model & Schema Validation', () => {
  it('Profile model defines 2dsphere index and GeoJSON location defaults', () => {
    const indexes = Profile.schema.indexes();
    const has2dSphere = indexes.some(idx => idx[0] && idx[0].location === '2dsphere');
    assert.equal(has2dSphere, true, 'Profile must have a 2dsphere index on location');

    const sampleProfile = new Profile({
      user: '507f1f77bcf86cd799439011',
      fullName: 'John Plumber',
      hourlyRate: 350
    });

    assert.equal(sampleProfile.location.type, 'Point');
    assert.equal(sampleProfile.location.coordinates.length, 2);
    assert.equal(sampleProfile.hourlyRate, 350);
  });

  it('Booking model defines GeoJSON location, OTP, and payment status defaults', () => {
    const indexes = Booking.schema.indexes();
    const has2dSphere = indexes.some(idx => idx[0] && idx[0].location === '2dsphere');
    assert.equal(has2dSphere, true, 'Booking must have a 2dsphere index on location');

    const sampleBooking = new Booking({
      worker: '507f1f77bcf86cd799439011',
      recruiter: '507f1f77bcf86cd799439012',
      jobDescription: 'Fix bathroom pipe leak'
    });

    assert.equal(sampleBooking.status, 'pending');
    assert.equal(sampleBooking.paymentStatus, 'unpaid');
    assert.equal(sampleBooking.location.type, 'Point');
  });
});

describe('Extended In-Flight Booking Transitions', () => {
  const workerId = 'worker-101';
  const recruiterId = 'recruiter-202';
  const workerActor = { userId: workerId, role: 'worker' };
  const recruiterActor = { userId: recruiterId, role: 'recruiter' };

  it('allows transition from accepted to in_progress (doorstep OTP start)', () => {
    const res = validateBookingTransition('accepted', 'in_progress', workerActor, workerId, recruiterId);
    assert.equal(res.valid, true);
    assert.equal(res.nextStatus, 'in_progress');
  });

  it('allows completing a job from in_progress status', () => {
    const resWorker = validateBookingTransition('in_progress', 'completed', workerActor, workerId, recruiterId);
    assert.equal(resWorker.valid, true);

    const resRecruiter = validateBookingTransition('in_progress', 'completed', recruiterActor, workerId, recruiterId);
    assert.equal(resRecruiter.valid, true);
  });

  it('allows cancelling an in_progress job', () => {
    const res = validateBookingTransition('in_progress', 'cancelled', recruiterActor, workerId, recruiterId);
    assert.equal(res.valid, true);
  });

  it('rejects reverting in_progress back to pending', () => {
    const res = validateBookingTransition('in_progress', 'pending', workerActor, workerId, recruiterId);
    assert.equal(res.valid, false);
    assert.equal(res.code, 400);
  });
});

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateBookingTransition, VALID_BOOKING_TRANSITIONS } = require('../utils/bookingStateMachine');

describe('Booking State Machine Transitions', () => {
  const workerId = 'worker-123';
  const recruiterId = 'recruiter-456';
  const thirdPartyId = 'stranger-789';

  const workerActor = { userId: workerId, role: 'worker' };
  const recruiterActor = { userId: recruiterId, role: 'recruiter' };
  const thirdPartyActor = { userId: thirdPartyId, role: 'recruiter' };

  it('allows worker to accept a pending booking', () => {
    const result = validateBookingTransition('pending', 'accepted', workerActor, workerId, recruiterId);
    assert.equal(result.valid, true);
    assert.equal(result.nextStatus, 'accepted');
  });

  it('rejects recruiter attempting to accept a pending booking (only worker can accept)', () => {
    const result = validateBookingTransition('pending', 'accepted', recruiterActor, workerId, recruiterId);
    assert.equal(result.valid, false);
    assert.equal(result.code, 403);
    assert.match(result.message, /Only the assigned worker can accept/);
  });

  it('allows worker or recruiter to cancel a pending booking', () => {
    const workerCancel = validateBookingTransition('pending', 'cancelled', workerActor, workerId, recruiterId);
    assert.equal(workerCancel.valid, true);

    const recruiterCancel = validateBookingTransition('pending', 'cancelled', recruiterActor, workerId, recruiterId);
    assert.equal(recruiterCancel.valid, true);
  });

  it('allows completing an accepted booking', () => {
    const workerComplete = validateBookingTransition('accepted', 'completed', workerActor, workerId, recruiterId);
    assert.equal(workerComplete.valid, true);

    const recruiterComplete = validateBookingTransition('accepted', 'completed', recruiterActor, workerId, recruiterId);
    assert.equal(recruiterComplete.valid, true);
  });

  it('rejects skipping from pending directly to completed', () => {
    const result = validateBookingTransition('pending', 'completed', workerActor, workerId, recruiterId);
    assert.equal(result.valid, false);
    assert.equal(result.code, 400);
    assert.match(result.message, /cannot transition booking from 'pending' to 'completed'/i);
  });

  it('rejects any transition out of terminal state: completed', () => {
    const tryReopen = validateBookingTransition('completed', 'pending', workerActor, workerId, recruiterId);
    assert.equal(tryReopen.valid, false);

    const tryCancel = validateBookingTransition('completed', 'cancelled', workerActor, workerId, recruiterId);
    assert.equal(tryCancel.valid, false);
  });

  it('rejects any transition out of terminal state: cancelled', () => {
    const tryReopen = validateBookingTransition('cancelled', 'pending', workerActor, workerId, recruiterId);
    assert.equal(tryReopen.valid, false);

    const tryAccept = validateBookingTransition('cancelled', 'accepted', workerActor, workerId, recruiterId);
    assert.equal(tryAccept.valid, false);
  });

  it('rejects identical same-state transition', () => {
    const result = validateBookingTransition('accepted', 'accepted', workerActor, workerId, recruiterId);
    assert.equal(result.valid, false);
    assert.equal(result.code, 400);
  });

  it('rejects actions by unauthorized third-party users', () => {
    const result = validateBookingTransition('pending', 'cancelled', thirdPartyActor, workerId, recruiterId);
    assert.equal(result.valid, false);
    assert.equal(result.code, 403);
  });
});

describe('Atomic Race Condition Simulation', () => {
  it('simulates atomic findOneAndUpdate prevention of concurrent double-accept', () => {
    // In-memory atomic collection mock modeling MongoDB findOneAndUpdate({ _id, status: 'pending' })
    let mockBookingInDb = {
      _id: 'booking-999',
      worker: 'worker-123',
      recruiter: 'recruiter-456',
      status: 'pending'
    };

    function atomicAccept(bookingId, actingUserId) {
      // Simulating findOneAndUpdate({ _id: bookingId, worker: actingUserId, status: 'pending' }, { status: 'accepted' })
      if (
        mockBookingInDb._id === bookingId &&
        mockBookingInDb.worker === actingUserId &&
        mockBookingInDb.status === 'pending'
      ) {
        mockBookingInDb.status = 'accepted';
        return { matched: true, doc: { ...mockBookingInDb } };
      }
      return { matched: false, doc: null };
    }

    // First request arrives: succeeds
    const firstCall = atomicAccept('booking-999', 'worker-123');
    assert.equal(firstCall.matched, true);
    assert.equal(firstCall.doc.status, 'accepted');

    // Concurrent duplicate request arrives for same pending booking: fails atomically with 0 matches
    const secondCall = atomicAccept('booking-999', 'worker-123');
    assert.equal(secondCall.matched, false);
    assert.equal(secondCall.doc, null);
  });
});

/**
 * Booking State Machine & Transition Rules
 *
 * State flow:
 *   pending ──(accept)──> accepted ──(complete)──> completed
 *      │                     │
 *   (cancel)              (cancel)
 *      │                     │
 *      ▼                     ▼
 *   cancelled             cancelled
 *
 * Terminal states: 'completed' and 'cancelled' cannot transition to any other status.
 */

const VALID_BOOKING_TRANSITIONS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

/**
 * Validates whether a state transition is permitted for a booking.
 * @param {string} currentStatus - Current booking status
 * @param {string} nextStatus - Requested new status
 * @param {Object} actor - Information about the acting user
 * @param {string} actor.userId - Current user's ID
 * @param {string} actor.role - Current user's role ('worker' | 'recruiter')
 * @param {string} workerId - Booking's assigned worker ID
 * @param {string} recruiterId - Booking's recruiter ID
 */
function validateBookingTransition(currentStatus, nextStatus, actor, workerId, recruiterId) {
  const normCurrent = (currentStatus || '').toLowerCase();
  const normNext = (nextStatus || '').toLowerCase();

  const allowedNext = VALID_BOOKING_TRANSITIONS[normCurrent];
  if (!allowedNext) {
    return { valid: false, code: 400, message: `Invalid current booking state: '${currentStatus}'` };
  }

  if (normCurrent === normNext) {
    return { valid: false, code: 400, message: `Booking is already in state '${normNext}'` };
  }

  if (!allowedNext.includes(normNext)) {
    return {
      valid: false,
      code: 400,
      message: `Invalid transition: cannot transition booking from '${normCurrent}' to '${normNext}'.`
    };
  }

  const userIdStr = String(actor.userId);
  const workerIdStr = String(workerId);
  const recruiterIdStr = String(recruiterId);

  const isWorker = userIdStr === workerIdStr;
  const isRecruiter = userIdStr === recruiterIdStr;

  if (!isWorker && !isRecruiter) {
    return { valid: false, code: 403, message: "Forbidden: You are neither the assigned worker nor recruiter for this booking." };
  }

  // Acceptance rule: Only the worker assigned can accept the booking
  if (normNext === 'accepted' && !isWorker) {
    return { valid: false, code: 403, message: "Only the assigned worker can accept this booking." };
  }

  return { valid: true, currentStatus: normCurrent, nextStatus: normNext };
}

module.exports = {
  VALID_BOOKING_TRANSITIONS,
  validateBookingTransition
};

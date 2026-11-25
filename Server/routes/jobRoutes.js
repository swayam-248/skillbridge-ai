const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const Profile = require('../models/Profile');
const { protectRecruiter, protectWorker, protectAny } = require('../middleware/authMiddleware');

// POST NEW JOB
router.post('/jobs', protectRecruiter, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, recruiter: req.user.userId });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: "Error creating job" });
  }
});

// GET JOBS
router.get('/jobs', protectAny, async (req, res) => {
  try {
    const { recruiter } = req.query;
    let query = { status: 'open' };
    if (req.user.role === 'recruiter' && recruiter === 'me') {
      query = { recruiter: req.user.userId };
    }
    const jobs = await Job.find(query).populate('recruiter', 'email').sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// APPLY FOR JOB
router.post('/jobs/:id/apply', protectWorker, async (req, res) => {
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

// GET WORKER'S APPLICATIONS
router.get('/applications/me', protectWorker, async (req, res) => {
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

// GET APPLICATIONS FOR A SPECIFIC JOB
router.get('/applications/job/:jobId', protectRecruiter, async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('worker', 'email')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(applications.map(async (app) => {
      const profile = await Profile.findOne({ user: app.worker._id });
      return { ...app._doc, profile };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Error fetching applicants" });
  }
});

// UPDATE APPLICATION STATUS
router.put('/applications/:id/status', protectRecruiter, async (req, res) => {
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

module.exports = router;


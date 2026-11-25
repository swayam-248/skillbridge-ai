const express = require('express');
const router = express.Router();
const Skill = require('../models/Skills');

// GET ALL STANDARDIZED SKILLS
router.get('/skills', async (req, res) => {
  try {
    const allSkills = await Skill.find();
    res.json(allSkills);
  } catch (err) {
    console.error("Error fetching skills:", err);
    res.status(500).json({ message: "Server Error: Could not fetch Skills" });
  }
});

module.exports = router;


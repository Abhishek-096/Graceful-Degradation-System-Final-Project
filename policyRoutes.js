// Express Routes: Degradation Policies (Git-tracked)
const express = require('express');
const router = express.Router();
const DegradationPolicy = require('../models/DegradationPolicy');

// GET /api/policies - Retrieve all policies from MongoDB
router.get('/', async (req, res) => {
  try {
    const policies = await DegradationPolicy.find().sort({ createdAt: -1 }).exec();
    res.json({ success: true, count: policies.length, source: 'MongoDB collection: degradation_policies', data: policies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/policies - Create policy (synced from Git)
router.post('/', async (req, res) => {
  try {
    const policy = new DegradationPolicy(req.body);
    const saved = await policy.save();
    res.status(201).json({ success: true, message: 'Policy stored in MongoDB', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;

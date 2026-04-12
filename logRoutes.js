// Express Routes: Activity Logs from MongoDB
const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

// GET /api/logs - Retrieve recent activity logs from MongoDB
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    res.json({ success: true, count: logs.length, source: 'MongoDB collection: activity_logs', data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/logs/service/:serviceId - Get logs for specific service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const logs = await ActivityLog.find({ serviceId: req.params.serviceId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

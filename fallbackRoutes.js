// Express Routes: Fallback Configuration CRUD
// These routes interact with MongoDB via Mongoose to manage fallback configs

const express = require('express');
const router = express.Router();
const FallbackConfig = require('../models/FallbackConfig');

// GET /api/fallbacks - Retrieve all fallback configs from MongoDB
router.get('/', async (req, res) => {
  try {
    const configs = await FallbackConfig.find()
      .sort({ serviceId: 1, priority: 1 })
      .exec();
    
    res.json({
      success: true,
      count: configs.length,
      source: 'MongoDB collection: fallback_configs',
      data: configs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fallbacks/service/:serviceId - Get fallbacks for specific service
router.get('/service/:serviceId', async (req, res) => {
  try {
    const configs = await FallbackConfig.getRankedFallbacks(req.params.serviceId);
    res.json({
      success: true,
      serviceId: req.params.serviceId,
      count: configs.length,
      data: configs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fallbacks/best/:serviceId - Get best available fallback (Node.js selection logic)
router.get('/best/:serviceId', async (req, res) => {
  try {
    const best = await FallbackConfig.findBestFallback(req.params.serviceId);
    if (!best) {
      return res.status(404).json({
        success: false,
        message: 'No enabled fallback found for this service',
      });
    }
    res.json({
      success: true,
      message: `Best fallback selected: "${best.label}" (quality: ${best.qualityScore}%)`,
      data: best,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/fallbacks - Create new fallback config in MongoDB
router.post('/', async (req, res) => {
  try {
    const config = new FallbackConfig(req.body);
    const saved = await config.save();
    res.status(201).json({
      success: true,
      message: 'Fallback config stored in MongoDB',
      data: saved,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/fallbacks/:id - Update fallback config in MongoDB
router.put('/:id', async (req, res) => {
  try {
    const updated = await FallbackConfig.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }
    res.json({
      success: true,
      message: 'Fallback config updated in MongoDB',
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/fallbacks/:id/toggle - Toggle enable/disable
router.patch('/:id/toggle', async (req, res) => {
  try {
    const config = await FallbackConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }
    config.enabled = !config.enabled;
    config.lastUpdated = new Date();
    await config.save();
    res.json({
      success: true,
      message: `Fallback "${config.label}" ${config.enabled ? 'enabled' : 'disabled'}`,
      data: config,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/fallbacks/:id - Remove fallback config from MongoDB
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await FallbackConfig.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }
    res.json({
      success: true,
      message: 'Fallback config removed from MongoDB',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fallbacks/grouped - Aggregation: grouped by service
router.get('/grouped', async (req, res) => {
  try {
    const grouped = await FallbackConfig.getAllGroupedByService();
    res.json({
      success: true,
      source: 'MongoDB Aggregation Pipeline',
      data: grouped,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

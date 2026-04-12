// Express Routes: Service Health Monitoring
// Detects downstream service failures and applies fallbacks

const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const FallbackConfig = require('../models/FallbackConfig');
const ActivityLog = require('../models/ActivityLog');

// GET /api/services - Retrieve all services from MongoDB
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ serviceId: 1 }).exec();
    res.json({
      success: true,
      count: services.length,
      source: 'MongoDB collection: services',
      data: services,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/services/:serviceId/fail - Simulate service failure
router.post('/:serviceId/fail', async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { serviceId: req.params.serviceId },
      {
        status: 'failed',
        circuitState: 'open',
        errorRate: 85 + Math.random() * 15,
        latency: 5000 + Math.random() * 5000,
        lastChecked: new Date(),
      },
      { new: true }
    );

    // Find best fallback from MongoDB
    const fallback = await FallbackConfig.findBestFallback(req.params.serviceId);

    // Log to MongoDB
    await ActivityLog.create([
      {
        type: 'failure-detected',
        message: `Express detected failure on ${service.name}`,
        serviceId: req.params.serviceId,
        severity: 'critical',
      },
      {
        type: 'circuit-opened',
        message: `Circuit breaker OPENED for ${service.name}`,
        serviceId: req.params.serviceId,
        severity: 'warning',
      },
      {
        type: 'fallback-activated',
        message: `Activated fallback: "${fallback?.label}" (quality: ${fallback?.qualityScore}%)`,
        serviceId: req.params.serviceId,
        severity: 'warning',
      },
    ]);

    res.json({
      success: true,
      message: `Service ${service.name} marked as failed`,
      service,
      activeFallback: fallback,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/services/:serviceId/recover - Recover a failed service
router.post('/:serviceId/recover', async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { serviceId: req.params.serviceId },
      {
        status: 'healthy',
        circuitState: 'closed',
        errorRate: Math.random() * 0.5,
        latency: 10 + Math.random() * 80,
        lastChecked: new Date(),
      },
      { new: true }
    );

    await ActivityLog.create({
      type: 'service-recovered',
      message: `${service.name} recovered, circuit breaker closed`,
      serviceId: req.params.serviceId,
      severity: 'info',
    });

    res.json({ success: true, message: `Service ${service.name} recovered`, service });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

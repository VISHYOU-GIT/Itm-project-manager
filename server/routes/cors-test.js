const express = require('express');
const router = express.Router();

// Test API endpoint that returns basic info
router.get('/', (req, res) => {
  res.json({
    message: 'CORS test endpoint',
    success: true,
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      'access-control-request-method': req.headers['access-control-request-method'],
      'access-control-request-headers': req.headers['access-control-request-headers']
    }
  });
});

module.exports = router;
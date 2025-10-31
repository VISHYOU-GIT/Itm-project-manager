const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateStudent } = require('../middleware/auth');
const { validateRequest, projectUpdateSchema } = require('../middleware/validation');
const {
  getProfile,
  updateProject,
  editUpdate,
  requestIncharge,
  requestPartner,
  getProgress,
  getDailyUpdates,
  getTeachers,
  respondToPartnerRequest,
  getPartnerRequests,
  getAvailableStudents,
  sendPartnerRequest,
  respondPartnerRequest
} = require('../controllers/studentController');

// Apply authentication middleware to all student routes
router.use(authenticateToken, authenticateStudent);

// Student profile
router.get('/profile', getProfile);

// Project management
router.put('/project/update', validateRequest(projectUpdateSchema), updateProject);
router.put('/project/update/:updateId', editUpdate);
router.get('/project/progress', getProgress);

// Daily updates
router.get('/daily-updates', getDailyUpdates);

// Requests
router.post('/request/incharge', requestIncharge);
router.post('/request/partner', requestPartner);
router.post('/request/partner/respond', respondToPartnerRequest);
router.get('/partner-requests', getPartnerRequests);

// Get available teachers and students
router.get('/teachers', getTeachers);
router.get('/available-students', getAvailableStudents);

// Partner functionality
router.post('/send-partner-request', sendPartnerRequest);
router.post('/respond-partner-request', respondPartnerRequest);

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateTeacher } = require('../middleware/auth');
const {
  getProfile,
  getLatestUpdates,
  getProjects,
  getProjectDetails,
  commentOnUpdate,
  updateTargets,
  getRequests,
  acceptRequest,
  rejectRequest,
  updateProfile,
  createProject,
  updateProjectDetails,
  getProjectUpdates,
  getStudentUpdates,
  addUpdateComment,
  getTeacherStats,
  getInchargeRequests,
  respondToInchargeRequest
} = require('../controllers/teacherController');

// Apply authentication middleware to all teacher routes
router.use(authenticateToken, authenticateTeacher);

// Teacher profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Latest updates
router.get('/updates/latest', getLatestUpdates);

// Projects
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.put('/projects/:projectId', updateProjectDetails);
router.get('/project/:projectId', getProjectDetails);
router.get('/project/:projectId/updates', getProjectUpdates);

// Student updates management  
router.get('/student-updates', getStudentUpdates);
router.post('/update-comment', addUpdateComment);

// Statistics and analytics
router.get('/stats', getTeacherStats);

// Incharge requests
router.get('/incharge-requests', getInchargeRequests);
router.post('/respond-incharge-request', respondToInchargeRequest);

// Project management
router.put('/project/:projectId/update/:updateId/comment', commentOnUpdate);
router.put('/project/:projectId/targets', updateTargets);

// Requests
router.get('/requests', getRequests);
router.post('/request/:requestId/accept', acceptRequest);
router.post('/request/:requestId/reject', rejectRequest);

module.exports = router;

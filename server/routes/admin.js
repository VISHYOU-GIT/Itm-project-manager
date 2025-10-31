const express = require('express');
const router = express.Router();
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const {
  getAllProjects,
  assignIncharge,
  updateProjectStudents,
  getAllTeachers,
  getAllStudents,
  createProject,
  deleteProject,
  getDashboardStats
} = require('../controllers/adminController');

// Apply authentication middleware to all admin routes
router.use(authenticateToken, authenticateAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Projects management
router.get('/projects', getAllProjects);
router.post('/projects', createProject);
router.put('/project/:projectId/assign-incharge', assignIncharge);
router.put('/project/:projectId/update-students', updateProjectStudents);
router.delete('/project/:projectId', deleteProject);

// Teachers management
router.get('/teachers', getAllTeachers);

// Students management
router.get('/students', getAllStudents);

module.exports = router;

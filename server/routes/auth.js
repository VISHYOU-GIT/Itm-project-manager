const express = require('express');
const router = express.Router();
const { 
  registerStudent, 
  loginStudent, 
  registerTeacher, 
  loginTeacher, 
  loginAdmin 
} = require('../controllers/authController');
const { validateRequest, studentRegisterSchema, studentLoginSchema, teacherRegisterSchema, teacherLoginSchema, adminLoginSchema } = require('../middleware/validation');

// Student auth routes
router.post('/student/register', validateRequest(studentRegisterSchema), registerStudent);
router.post('/student/login', validateRequest(studentLoginSchema), loginStudent);

// Teacher auth routes
router.post('/teacher/register', validateRequest(teacherRegisterSchema), registerTeacher);
router.post('/teacher/login', validateRequest(teacherLoginSchema), loginTeacher);

// Admin auth route
router.post('/admin/login', validateRequest(adminLoginSchema), loginAdmin);

module.exports = router;

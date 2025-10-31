const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// General authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token.' });
  }
};

// Role-specific authentication middleware
const authenticateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student || req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Student role required.' });
    }
    req.student = student;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

const authenticateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher || req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher role required.' });
    }
    req.teacher = teacher;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

const authenticateAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  authenticateStudent,
  authenticateTeacher,
  authenticateAdmin
};

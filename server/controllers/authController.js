const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Student Registration
const registerStudent = async (req, res) => {
  try {
    const { rollNo, password, username, department, class: studentClass } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ rollNo });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student with this roll number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create student
    const student = new Student({
      rollNo,
      password: hashedPassword,
      username,
      department,
      class: studentClass
    });

    await student.save();

    // Generate token
    const token = generateToken({ 
      id: student._id, 
      role: 'student',
      rollNo: student.rollNo 
    });

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: {
        id: student._id,
        rollNo: student.rollNo,
        username: student.username,
        department: student.department,
        class: student.class,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Student Login
const loginStudent = async (req, res) => {
  try {
    const { rollNo, password } = req.body;

    // Find student
    const student = await Student.findOne({ rollNo }).populate('project');
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ 
      id: student._id, 
      role: 'student',
      rollNo: student.rollNo 
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: student._id,
        rollNo: student.rollNo,
        username: student.username,
        department: student.department,
        class: student.class,
        project: student.project,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Teacher Registration
const registerTeacher = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Teacher with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create teacher
    const teacher = new Teacher({
      username,
      email,
      password: hashedPassword
    });

    await teacher.save();

    // Generate token
    const token = generateToken({ 
      id: teacher._id, 
      role: 'teacher',
      email: teacher.email 
    });

    res.status(201).json({
      message: 'Teacher registered successfully',
      token,
      user: {
        id: teacher._id,
        username: teacher.username,
        email: teacher.email,
        role: 'teacher'
      }
    });
  } catch (error) {
    console.error('Teacher registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Teacher Login
const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find teacher
    const teacher = await Teacher.findOne({ email }).populate('assignedProjects');
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, teacher.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ 
      id: teacher._id, 
      role: 'teacher',
      email: teacher.email 
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: teacher._id,
        username: teacher.username,
        email: teacher.email,
        assignedProjects: teacher.assignedProjects,
        role: 'teacher'
      }
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    // Check credentials against environment variables
    if (adminId !== process.env.ADMIN_ID || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Generate token
    const token = generateToken({ 
      id: 'admin', 
      role: 'admin',
      adminId: adminId 
    });

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: 'admin',
        role: 'admin',
        adminId: adminId
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  registerTeacher,
  loginTeacher,
  loginAdmin
};

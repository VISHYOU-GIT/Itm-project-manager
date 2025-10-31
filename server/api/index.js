// All-in-one serverless API for Vercel deployment
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create Express app
const app = express();

// Set JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_for_development';

// Simple CORS configuration that works with any origin
app.use(cors({
  origin: true, // Allow any origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Add explicit CORS headers to ensure they're applied
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
let isMongoConnected = false;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      console.log('Connected to MongoDB');
      isMongoConnected = true;
    })
    .catch(err => {
      console.error('Could not connect to MongoDB:', err);
      // Continue without database connection
    });
}

// Define schemas and models directly here to avoid import issues
const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  section: {
    type: String
  }
});

const TeacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  }
});

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'creatorModel'
  },
  creatorModel: {
    type: String,
    enum: ['Student', 'Teacher']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Initialize models
let Student, Teacher, Project;

try {
  // Only create models if MongoDB is available
  if (mongoose.connection.readyState !== 0) {
    Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
    Teacher = mongoose.models.Teacher || mongoose.model('Teacher', TeacherSchema);
    Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
  }
} catch (error) {
  console.error('Error creating models:', error);
}

// Authentication middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

// AUTH ROUTES

// Student login
app.post('/auth/student/login', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ message: 'Database connection not available' });
    }
    
    const { rollNo, password } = req.body;
    
    if (!rollNo || !password) {
      return res.status(400).json({ message: 'Roll number and password are required' });
    }
    
    const student = await Student.findOne({ rollNo });
    
    if (!student) {
      return res.status(401).json({ message: 'Invalid roll number or password' });
    }
    
    // In a real app, use bcrypt to compare passwords
    if (password !== student.password) {
      return res.status(401).json({ message: 'Invalid roll number or password' });
    }
    
    const token = jwt.sign(
      { 
        id: student._id, 
        role: 'student',
        name: student.name,
        rollNo: student.rollNo
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        email: student.email,
        course: student.course,
        semester: student.semester,
        section: student.section
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher login
app.post('/auth/teacher/login', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ message: 'Database connection not available' });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const teacher = await Teacher.findOne({ email });
    
    if (!teacher) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // In a real app, use bcrypt to compare passwords
    if (password !== teacher.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { 
        id: teacher._id, 
        role: 'teacher',
        name: teacher.name,
        email: teacher.email
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// STUDENT ROUTES

// Get student profile
app.get('/student/profile', auth, async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ message: 'Database connection not available' });
    }
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const student = await Student.findById(req.user.id).select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// TEACHER ROUTES

// Get teacher profile
app.get('/teacher/profile', auth, async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ message: 'Database connection not available' });
    }
    
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const teacher = await Teacher.findById(req.user.id).select('-password');
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    res.json(teacher);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PROJECT ROUTES

// Get all projects
app.get('/projects', auth, async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ message: 'Database connection not available' });
    }
    
    let projects;
    
    if (req.user.role === 'teacher') {
      // Teachers can see all projects
      projects = await Project.find();
    } else {
      // Students can only see their own projects
      projects = await Project.find({
        createdBy: req.user.id,
        creatorModel: 'Student'
      });
    }
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific project
app.get('/projects/:id', auth, async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ message: 'Database connection not available' });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (req.user.role !== 'teacher' && 
        (project.createdBy.toString() !== req.user.id || 
         project.creatorModel !== 'Student')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new project
app.post('/projects', auth, async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ message: 'Database connection not available' });
    }
    
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    
    const newProject = new Project({
      title,
      description,
      createdBy: req.user.id,
      creatorModel: req.user.role === 'teacher' ? 'Teacher' : 'Student'
    });
    
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a project
app.put('/projects/:id', auth, async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ message: 'Database connection not available' });
    }
    
    const { title, description, status } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (req.user.role !== 'teacher' && 
        (project.createdBy.toString() !== req.user.id || 
         project.creatorModel !== 'Student')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (status) project.status = status;
    project.updatedAt = Date.now();
    
    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a project
app.delete('/projects/:id', auth, async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ message: 'Database connection not available' });
    }
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check permission
    if (req.user.role !== 'teacher' && 
        (project.createdBy.toString() !== req.user.id || 
         project.creatorModel !== 'Student')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await Project.deleteOne({ _id: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// HEALTH AND TEST ROUTES

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check - publicly accessible without authentication
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: isMongoConnected ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV || 'development'
  });
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString()
  });
});

// Catch-all for 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested URL ${req.originalUrl} was not found`,
    availableRoutes: [
      '/auth/student/login',
      '/auth/teacher/login',
      '/student/profile',
      '/teacher/profile',
      '/projects',
      '/health',
      '/cors-test'
    ]
  });
});

// Export for Vercel serverless deployment
module.exports = app;
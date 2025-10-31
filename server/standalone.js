// Standalone Express server with CORS handling
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Set default environment variables if not provided
const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret_for_development';
process.env.JWT_SECRET = JWT_SECRET;

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const projectRoutes = require('./routes/project');

// Create the Express app
const app = express();

// Configure CORS before anything else
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get client URL from environment variable
    const clientUrl = process.env.CLIENT_URL || 'https://client-mu-nine-82.vercel.app';
    
    // Check against our whitelist
    const allowedOrigins = [
      clientUrl,
      'https://client-mu-nine-82.vercel.app',
      'https://client-vishyougits-projects.vercel.app',
      // Add more origins if needed
    ];
    
    // Filter out any empty or undefined entries
    const validOrigins = allowedOrigins.filter(o => o);
    
    // Debug origin checks
    console.log(`Request origin: ${origin}`);
    console.log(`CLIENT_URL from env: ${process.env.CLIENT_URL}`);
    
    // Always allow the client origin from env var if it exists
    if (validOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Don't reject with error, just don't add CORS headers
      console.log(`Origin blocked: ${origin}`);
      console.log(`Allowed origins: ${validOrigins.join(', ')}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Enable preflight requests for all routes with proper CORS handling
app.options('*', (req, res) => {
  // Get client URL from environment variable
  const clientUrl = process.env.CLIENT_URL || 'https://client-mu-nine-82.vercel.app';
  
  // Check if the origin is in our whitelist
  const allowedOrigins = [
    clientUrl,
    'https://client-mu-nine-82.vercel.app',
    'https://client-vishyougits-projects.vercel.app',
    // Add more origins if needed
  ].filter(o => o);
  
  const origin = req.headers.origin;
  
  // Debug preflight requests
  console.log(`Preflight request from origin: ${origin}`);
  console.log(`CLIENT_URL from env: ${process.env.CLIENT_URL}`);
  
  // Always allow the origins in our whitelist
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours caching for preflight
    res.status(204).end();
  } else {
    console.log(`Preflight blocked for origin: ${origin}`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
    // Still respond with 204 but don't send CORS headers
    res.status(204).end();
  }
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Could not connect to MongoDB:', err);
    // Don't exit the process to allow the API to still run for non-database routes
    console.log('Running without database connection. Some routes may not work.');
  });

// Mount the route files
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/projects', projectRoutes);

// Simple routes for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running',
    cors: 'Enabled for specific origin: https://client-mu-nine-82.vercel.app',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful',
    headers: req.headers,
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString()
  });
});

// Health check - publicly accessible without authentication
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    message: 'Server is running correctly'
  });
});

// Public test endpoint for checking CORS
app.get('/api/public-test', (req, res) => {
  res.json({
    message: 'Public API endpoint is working',
    cors: 'CORS is properly configured',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Start the server
const PORT = process.env.PORT || 5000;

// Make sure all models are registered - with error handling
try {
  require('./models/Student');
  require('./models/Teacher');
  require('./models/Project');
  console.log('All models registered successfully');
} catch (error) {
  console.error('Error loading models:', error);
}

// Catch-all route for debugging
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested URL ${req.originalUrl} was not found`,
    availableRoutes: [
      '/api/auth/student/login',
      '/api/auth/teacher/login',
      '/api/student/profile',
      '/api/student/partner-requests',
      '/api/health'
    ]
  });
});

// Start the server if not being imported (for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
// Load environment variables
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Environment variables
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS);
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS);
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE);

// Import modules
const { passport, requireAuth, requireTeacher, requireTeacherCode } = require('./auth');
const { testConnection, initDatabase } = require('./db');

// Import routes
const qrcodeRoutes = require('./routes/qrcode');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/users');

const app = express();

// Trust proxy for accurate IP addresses (เฉพาะใน production)
// app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [BACKEND_URL, FRONTEND_URL, 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS, // 15 minutes default
  max: RATE_LIMIT_MAX_REQUESTS // 500 requests per windowMs default
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: SESSION_MAX_AGE // 1 ชั่วโมง default
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// API-only server - Vue.js frontend runs separately on port 3001
// Backend serves only API endpoints, no static files

// Auth routes
app.get('/login', passport.authenticate('auth0', {
  scope: 'openid email profile'
}));

app.get('/callback', 
  passport.authenticate('auth0', { 
    failureRedirect: `${FRONTEND_URL}/`,
    failureFlash: true 
  }),
  (req, res) => {
    // Check if teacher has teacher_code
    if (req.user && req.user.teacher_code) {
      res.redirect(`${FRONTEND_URL}/dashboard`);
    } else {
      res.redirect(`${FRONTEND_URL}/teacher-setup`);
    }
  }
);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect(`${FRONTEND_URL}/`);
  });
});

// Vue.js handles all frontend routes - these are now handled by Vue Router
// Backend only serves API endpoints

// API routes
app.get('/api/user', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    teacher_code: req.user.teacher_code
  });
});

// Update teacher code
app.post('/api/user/teacher-code', requireAuth, async (req, res) => {
  try {
    const { teacher_code } = req.body;
    
    if (!teacher_code) {
      return res.status(400).json({ error: 'Teacher code is required' });
    }

    // Validate teacher code format
    if (!/^[A-Z0-9]+$/.test(teacher_code)) {
      return res.status(400).json({ error: 'Teacher code must contain only letters and numbers' });
    }

    // Check if teacher code already exists
    const connection = await require('./db').pool.getConnection();
    const [existingRows] = await connection.execute(
      'SELECT id FROM teachers WHERE teacher_code = ? AND id != ?',
      [teacher_code, req.user.id]
    );

    if (existingRows.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Teacher code already exists' });
    }

    // Update teacher code
    await connection.execute(
      'UPDATE teachers SET teacher_code = ?, updated_at = NOW() WHERE id = ?',
      [teacher_code, req.user.id]
    );

    connection.release();

    res.json({ 
      message: 'Teacher code updated successfully',
      teacher_code: teacher_code
    });
  } catch (error) {
    console.error('Error updating teacher code:', error);
    res.status(500).json({ error: 'Failed to update teacher code' });
  }
});

// QR Code routes
app.use('/api/qrcode', qrcodeRoutes);

// Attendance routes
app.use('/api/attendance', attendanceRoutes);

// User routes
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    authenticated: req.isAuthenticated()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize database tables
    await initDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: Connected to qrcheck`);
      console.log(`🔐 Auth0: dev-tte8v56bmpl3e46o.us.auth0.com`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

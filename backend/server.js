const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import modules
const { passport, requireAuth, requireTeacher, requireTeacherCode } = require('./auth');
const { testConnection, initDatabase } = require('./db');

// Import routes
const qrcodeRoutes = require('./routes/qrcode');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/users');

const app = express();
const PORT = 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

// Rate limiting - เพิ่มขึ้นสำหรับ development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // เพิ่มจาก 100 เป็น 500 requests per windowMs สำหรับ development
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'bac3cb47c2d9e2ce1a0cbd21ef2fd8a4',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1 * 60 * 60 * 1000 // 1 ชั่วโมง (session จะหมดอายุอัตโนมัติหลังจาก 1 ชั่วโมง)
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Auth routes
app.get('/login', passport.authenticate('auth0', {
  scope: 'openid email profile'
}));

app.get('/callback', 
  passport.authenticate('auth0', { 
    failureRedirect: '/login',
    failureFlash: true 
  }),
  (req, res) => {
    // Check if teacher has teacher_code
    if (req.user && req.user.teacher_code) {
    res.redirect('/dashboard');
    } else {
      res.redirect('/setup-teacher-code');
    }
  }
);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// Setup Teacher Code page
app.get('/setup-teacher-code', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/setup-teacher-code.html'));
});

// Protected route - Dashboard (requires teacher code)
app.get('/dashboard', requireTeacherCode, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// Public route - Scan QR Code
app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/scan.html'));
});

// Public route - Register Face
app.get('/foraddface', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/foraddface.html'));
});

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

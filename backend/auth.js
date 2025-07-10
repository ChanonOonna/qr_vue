const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const { pool } = require('./db');

// Auth0 Strategy configuration
const strategy = new Auth0Strategy(
  {
    domain: 'dev-tte8v56bmpl3e46o.us.auth0.com',
    clientID: 'sxtFvquBeJ3X3Ez39GihsJayVwOO3mMU',
    clientSecret: '_1dv2E_XLFMI-yE3MN4Y9clOzbPDfMhh4-s24ASiyY6fG7lWHCoCRqJT4SKe7fMV',
    callbackURL: 'http://localhost:3000/callback',
    scope: 'openid email profile'
  },
  async (accessToken, refreshToken, extraParams, profile, done) => {
    try {
      // Check if email ends with @ku.th
      const email = profile.emails[0].value;
      if (!email.endsWith('@ku.th')) {
        return done(null, false, { message: 'Only @ku.th emails are allowed' });
      }

      // Check if teacher exists in database
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM teachers WHERE auth0_id = ?',
        [profile.id]
      );

      if (rows.length === 0) {
        // Create new teacher without teacher_code (will be filled later)
        const teacherId = `T${Date.now()}`;
        await connection.execute(
          'INSERT INTO teachers (id, name, email, auth0_id) VALUES (?, ?, ?, ?)',
          [teacherId, profile.displayName || profile.name.givenName, email, profile.id]
        );
        
        const newTeacher = {
          id: teacherId,
          name: profile.displayName || profile.name.givenName,
          email: email,
          auth0_id: profile.id,
          teacher_code: null // Will be filled later
        };
        
        connection.release();
        return done(null, newTeacher);
      } else {
        // Teacher exists
        const teacher = rows[0];
        connection.release();
        return done(null, teacher);
      }
    } catch (error) {
      console.error('Auth0 strategy error:', error);
      return done(error, null);
    }
  }
);

passport.use(strategy);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM teachers WHERE id = ?',
      [id]
    );
    connection.release();
    
    if (rows.length > 0) {
      done(null, rows[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Middleware to check if user is teacher
const requireTeacher = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(403).json({ error: 'Teacher access required' });
};

// Middleware to check if teacher has teacher_code
const requireTeacherCode = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    if (req.user.teacher_code) {
      return next();
    } else {
      // Redirect to teacher code setup page
      return res.redirect('/setup-teacher-code');
    }
  }
  res.status(403).json({ error: 'Teacher access required' });
};

module.exports = {
  passport,
  requireAuth,
  requireTeacher,
  requireTeacherCode
};

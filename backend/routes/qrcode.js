const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const QRCodeSession = require('../models/qrcodeSession');
const { requireTeacher } = require('../auth');

const router = express.Router();

// Get all QR sessions for the teacher
router.get('/sessions', requireTeacher, async (req, res) => {
  try {
    const sessions = await QRCodeSession.getByTeacher(req.user.id);
    res.json(sessions);
  } catch (error) {
    console.error('Error getting QR sessions:', error);
    res.status(500).json({ error: 'Failed to get QR sessions' });
  }
});

// Get specific QR session
router.get('/sessions/:id', requireTeacher, async (req, res) => {
  try {
    const session = await QRCodeSession.getById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'QR session not found' });
    }
    
    // Check if the session belongs to the teacher
    if (session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error getting QR session:', error);
    res.status(500).json({ error: 'Failed to get QR session' });
  }
});

// Create new QR session
router.post('/sessions', requireTeacher, async (req, res) => {
  function toMySQLDateTime(dt) {
    if (!dt) return null;
    if (dt instanceof Date) {
      return dt.toISOString().slice(0, 19).replace('T', ' ');
    }
    // dt: '2024-07-10T11:00' หรือ '2024-07-10T11:00:00'
    return dt.replace('T', ' ') + (dt.length === 16 ? ':00' : '');
  }
  try {
    const {
      subject_code,
      subject_name,
      teacher_code,
      class_group,
      year,
      semester,
      start_time,
      late_minute,
      expire_time,
      description
    } = req.body;

    // Validate required fields
    if (!subject_code || !subject_name || !class_group || !year || !start_time || !expire_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique QR token
    const qr_token = crypto.randomBytes(32).toString('hex');

    // Generate QR code image
    const qrCodeDataURL = await QRCode.toDataURL(qr_token);

    // แปลงวันที่
    const startDateTime = toMySQLDateTime(start_time);
    const expireDateTime = toMySQLDateTime(expire_time);

    const sessionData = {
      teacher_id: req.user.id,
      subject_code,
      subject_name,
      teacher_code,
      class_group,
      year,
      semester: semester || 1,
      start_time: startDateTime,
      late_minute: late_minute || 15,
      expire_time: expireDateTime,
      qr_token,
      description: description || '',
      qr_code_image: qrCodeDataURL
    };

    const sessionId = await QRCodeSession.create(sessionData);

    res.json({
      id: sessionId,
      qr_token,
      qr_code_image: qrCodeDataURL,
      expire_time: expireDateTime
    });
  } catch (error) {
    console.error('Error creating QR session:', error);
    res.status(500).json({ error: 'Failed to create QR session' });
  }
});

// Deactivate QR session
router.put('/sessions/:id/deactivate', requireTeacher, async (req, res) => {
  try {
    const session = await QRCodeSession.getById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'QR session not found' });
    }
    
    if (session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await QRCodeSession.deactivate(req.params.id);
    res.json({ message: 'QR session deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating QR session:', error);
    res.status(500).json({ error: 'Failed to deactivate QR session' });
  }
});

// Delete QR session
router.delete('/sessions/:id', requireTeacher, async (req, res) => {
  try {
    const session = await QRCodeSession.getById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'QR session not found' });
    }
    
    if (session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await QRCodeSession.delete(req.params.id);
    res.json({ message: 'QR session deleted successfully' });
  } catch (error) {
    console.error('Error deleting QR session:', error);
    res.status(500).json({ error: 'Failed to delete QR session' });
  }
});

// Get QR code image for a session
router.get('/sessions/:id/qr-code', requireTeacher, async (req, res) => {
  try {
    const session = await QRCodeSession.getById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'QR session not found' });
    }
    
    if (session.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const qrCodeDataURL = await QRCode.toDataURL(session.qr_token);
    res.json({ qr_code_image: qrCodeDataURL });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

module.exports = router;

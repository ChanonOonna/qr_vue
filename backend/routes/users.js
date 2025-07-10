const express = require('express');
const Student = require('../models/student');
const { requireTeacher } = require('../auth');

const router = express.Router();

// Get all students
router.get('/students', requireTeacher, async (req, res) => {
  try {
    const students = await Student.getAll();
    res.json(students);
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

// Get students by class
router.get('/students/class/:classGroup', requireTeacher, async (req, res) => {
  try {
    const students = await Student.getByClass(req.params.classGroup);
    res.json(students);
  } catch (error) {
    console.error('Error getting students by class:', error);
    res.status(500).json({ error: 'Failed to get students by class' });
  }
});

// Create new student
router.post('/students', requireTeacher, async (req, res) => {
  try {
    const {
      id,
      firstname,
      lastname,
      student_code,
      class_group,
      year
    } = req.body;

    // Validate required fields
    if (!id || !firstname || !lastname || !student_code || !class_group || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const studentId = await Student.create({
      id,
      firstname,
      lastname,
      student_code,
      class_group,
      year
    });

    res.json({ id: studentId, message: 'Student created successfully' });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Update student
router.put('/students/:id', requireTeacher, async (req, res) => {
  try {
    const studentId = req.params.id;
    const {
      firstname,
      lastname,
      student_code,
      class_group,
      year
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !student_code || !class_group || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await Student.create({
      id: studentId,
      firstname,
      lastname,
      student_code,
      class_group,
      year
    });

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/students/:id', requireTeacher, async (req, res) => {
  try {
    const studentId = req.params.id;
    await Student.delete(studentId);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Bulk create students
router.post('/students/bulk', requireTeacher, async (req, res) => {
  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Invalid students data' });
    }

    await Student.bulkCreate(students);
    res.json({ message: 'Students created successfully' });
  } catch (error) {
    console.error('Error bulk creating students:', error);
    res.status(500).json({ error: 'Failed to create students' });
  }
});

// Get student by code (for QR scanning)
router.get('/students/code/:studentCode', async (req, res) => {
  try {
    const student = await Student.getByCode(req.params.studentCode);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error getting student by code:', error);
    res.status(500).json({ error: 'Failed to get student' });
  }
});

module.exports = router;

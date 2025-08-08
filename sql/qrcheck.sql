-- QR Attendance System Database Schema

-- Teachers table
CREATE TABLE teachers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    auth0_id VARCHAR(100) UNIQUE NOT NULL,
    teacher_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE students (
    id VARCHAR(20) PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    student_code VARCHAR(20) UNIQUE NOT NULL,
    class_group VARCHAR(20),
    year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Student Face Recognition table (สำหรับเก็บข้อมูลใบหน้านักเรียน)
CREATE TABLE studentface (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    face_descriptor TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_id (student_id)
);

-- QR Sessions table (for each QR code created by teacher)
CREATE TABLE qr_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id VARCHAR(64) NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    teacher_code VARCHAR(20),
    class_group VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    semester INT DEFAULT 1,
    start_time DATETIME NOT NULL,
    late_minute INT DEFAULT 15,
    expire_time DATETIME NOT NULL,
    qr_token VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- Student Attendance table (records when students scan QR)
CREATE TABLE student_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    qr_session_id INT NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    checkin_time DATETIME NOT NULL,
    status ENUM('มา', 'สาย', 'ขาด') NOT NULL,
    extra_score INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (qr_session_id) REFERENCES qr_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_session (qr_session_id, student_id)
);

-- Student Data Submission Log (เก็บข้อมูลการส่งข้อมูลของนักเรียนไปหาแต่ละครู)
CREATE TABLE student_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(20) NOT NULL,
    teacher_id VARCHAR(64) NOT NULL,
    qr_session_id INT NOT NULL,
    submission_time DATETIME NOT NULL,
    data_type ENUM('attendance') DEFAULT 'attendance',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_qr_sessions_teacher ON qr_sessions(teacher_id);
CREATE INDEX idx_qr_sessions_token ON qr_sessions(qr_token);
CREATE INDEX idx_qr_sessions_active ON qr_sessions(is_active);
CREATE INDEX idx_student_attendance_session ON student_attendance(qr_session_id);
CREATE INDEX idx_student_attendance_student ON student_attendance(student_id);
CREATE INDEX idx_student_attendance_time ON student_attendance(checkin_time);
CREATE INDEX idx_student_submissions_student ON student_submissions(student_id);
CREATE INDEX idx_student_submissions_teacher ON student_submissions(teacher_id);
CREATE INDEX idx_student_submissions_time ON student_submissions(submission_time);
CREATE INDEX idx_studentface_student_id ON studentface(student_id);
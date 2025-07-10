-- Sample data for testing QR Attendance System

-- Sample teachers (will be created automatically via Auth0)
-- No need to insert manually

-- Sample students
INSERT INTO students (id, firstname, lastname, student_code, class_group, year) VALUES
('ST001', 'สมชาย', 'ใจดี', '6400000001', '1/1', 2024),
('ST002', 'สมหญิง', 'รักเรียน', '6400000002', '1/1', 2024),
('ST003', 'วิชัย', 'ขยัน', '6400000003', '1/1', 2024),
('ST004', 'นิดา', 'สวยงาม', '6400000004', '1/1', 2024),
('ST005', 'มานะ', 'อดทน', '6400000005', '1/1', 2024),
('ST006', 'มาลี', 'ใจเย็น', '6400000006', '1/2', 2024),
('ST007', 'ประยุทธ', 'กล้าหาญ', '6400000007', '1/2', 2024),
('ST008', 'รัตนา', 'มีสุข', '6400000008', '1/2', 2024),
('ST009', 'สุชาติ', 'รักชาติ', '6400000009', '1/2', 2024),
('ST010', 'วันดี', 'มีสุข', '6400000010', '1/2', 2024);

-- Sample QR sessions (will be created by teachers via the system)
-- No need to insert manually

-- Sample attendance records (will be created when students scan QR codes)
-- No need to insert manually 
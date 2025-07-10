const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  try {
    console.log('🌱 เริ่มเพิ่มข้อมูลตัวอย่าง...');
    
    // Read sample data SQL file
    const sqlPath = path.join(__dirname, '../sql/sample_data.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    const connection = await pool.getConnection();
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✅ รัน SQL statement สำเร็จ');
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log('⚠️  ข้อมูลซ้ำ (ข้ามไป)');
          } else {
            console.error('❌ เกิดข้อผิดพลาด:', error.message);
          }
        }
      }
    }
    
    connection.release();
    console.log('🎉 เพิ่มข้อมูลตัวอย่างเสร็จสิ้น!');
    
    // Test the data
    await testSampleData();
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูลตัวอย่าง:', error);
  } finally {
    process.exit(0);
  }
}

async function testSampleData() {
  try {
    console.log('\n🧪 ทดสอบข้อมูลตัวอย่าง...');
    
    const connection = await pool.getConnection();
    
    // Test students count
    const [students] = await connection.execute('SELECT COUNT(*) as count FROM students');
    console.log(`📚 จำนวนนักเรียน: ${students[0].count} คน`);
    
    // Test QR sessions count
    const [sessions] = await connection.execute('SELECT COUNT(*) as count FROM qr_sessions');
    console.log(`📱 จำนวน QR Sessions: ${sessions[0].count} อัน`);
    
    // Test attendance count
    const [attendance] = await connection.execute('SELECT COUNT(*) as count FROM student_attendance');
    console.log(`✅ จำนวนการเช็คชื่อ: ${attendance[0].count} ครั้ง`);
    
    // Show sample students
    const [sampleStudents] = await connection.execute('SELECT * FROM students LIMIT 5');
    console.log('\n👥 ตัวอย่างนักเรียน:');
    sampleStudents.forEach(student => {
      console.log(`  - ${student.student_code}: ${student.firstname} ${student.lastname} (${student.class_group})`);
    });
    
    connection.release();
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบข้อมูล:', error);
  }
}

// Run the seed function
seedDatabase(); 
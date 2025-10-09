require('dotenv').config();
const { pool } = require('./db');

async function fixDatabase() {
  try {
    console.log('🔧 กำลังแก้ไข database schema...');
    
    // แก้ไข teacher_code column
    await pool.execute('ALTER TABLE teachers MODIFY COLUMN teacher_code varchar(20) DEFAULT NULL');
    console.log('✅ teacher_code column updated');
    
    // ดู table structure
    const [columns] = await pool.execute('DESCRIBE teachers');
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // ดูข้อมูลใน table
    const [teachers] = await pool.execute('SELECT * FROM teachers LIMIT 5');
    console.log('\n👥 Teachers data:');
    teachers.forEach(teacher => {
      console.log(`${teacher.id}: ${teacher.name} (${teacher.email}) - teacher_code: ${teacher.teacher_code}`);
    });
    
    console.log('\n🎉 Database fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDatabase();

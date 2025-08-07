const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS_DIR = path.join(__dirname, '../public/models');
const FACE_API_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const models = [
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_recognition_model-weights_manifest.json'
];

// สร้างโฟลเดอร์ models ถ้ายังไม่มี
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log('✅ Created models directory');
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // ลบไฟล์ที่เสียหาย
        reject(err);
      });
    }).on('error', reject);
  });
}

async function downloadModels() {
  console.log('🚀 Starting face-api.js models download...\n');
  
  for (const model of models) {
    const url = `${FACE_API_BASE_URL}/${model}`;
    const filepath = path.join(MODELS_DIR, model);
    
    try {
      console.log(`📥 Downloading ${model}...`);
      await downloadFile(url, filepath);
      console.log(`✅ Downloaded ${model}`);
    } catch (error) {
      console.error(`❌ Failed to download ${model}:`, error.message);
    }
  }
  
  console.log('\n🎉 Download completed!');
  console.log(`📁 Models saved to: ${MODELS_DIR}`);
  
  // แสดงรายการไฟล์ที่ download
  const files = fs.readdirSync(MODELS_DIR);
  console.log('\n📋 Downloaded files:');
  files.forEach(file => {
    const stats = fs.statSync(path.join(MODELS_DIR, file));
    const size = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`  - ${file} (${size} MB)`);
  });
}

// รัน script
downloadModels().catch(console.error); 
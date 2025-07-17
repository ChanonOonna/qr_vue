const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const overlay = document.getElementById('overlay');
const statusDiv = document.getElementById('status');
const verifyBtn = document.getElementById('verifyBtn');
const startLivenessBtn = document.getElementById('startLivenessBtn');

let stream = null;
let isLivenessCheckPassed = false;
let blinkCount = 0;
let headMovements = 0;
let smileDetected = false;

function showStatus(msg, type) {
  statusDiv.textContent = msg;
  statusDiv.className = 'status ' + (type || '');
}

async function loadModels() {
  showStatus('กำลังโหลดโมเดล...', '');
  // Force CPU backend
  if (faceapi.tf && faceapi.tf.setBackend) {
    await faceapi.tf.setBackend('cpu');
    await faceapi.tf.ready();
  }
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  await faceapi.nets.faceExpressionNet.loadFromUri('/models');
  showStatus('โหลดโมเดลสำเร็จ', 'success');
}

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

// สร้างฟังก์ชัน euclideanDistance เอง
function customEuclideanDistance(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// คำนวณ EAR (Eye Aspect Ratio) สำหรับการตรวจจับการกระพริบตา
function calculateEAR(eye) {
  // ตรวจสอบว่า eye landmarks มีข้อมูลครบหรือไม่
  if (!eye || eye.length < 6) {
    console.log('EAR Calculation: Invalid eye landmarks', eye);
    return 0;
  }
  
  // Debug: แสดงจุด landmarks ของตา
  console.log('Eye landmarks:', eye.map((point, index) => `Point ${index}: (${point.x}, ${point.y})`));
  
  const A = customEuclideanDistance(eye[1], eye[5]);
  const B = customEuclideanDistance(eye[2], eye[4]);
  const C = customEuclideanDistance(eye[0], eye[3]);
  
  // Debug: แสดงค่า A, B, C ก่อนตรวจสอบ
  console.log('EAR Calculation Raw:', { A, B, C });
  
  // ตรวจสอบว่า C ไม่เป็น 0 หรือ NaN
  if (C === 0 || isNaN(C)) {
    console.log('EAR Calculation: C is zero or NaN', { A, B, C });
    return 0;
  }
  
  const ear = (A + B) / (2.0 * C);
  
  // ตรวจสอบว่า EAR ไม่เป็น NaN
  if (isNaN(ear)) {
    console.log('EAR Calculation: Result is NaN', { A, B, C, ear });
    return 0;
  }
  
  console.log('EAR Calculation:', { A: A.toFixed(4), B: B.toFixed(4), C: C.toFixed(4), EAR: ear.toFixed(4) });
  return ear;
}

// ตรวจสอบการกระพริบตา
function detectBlink(landmarks) {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  
  // ตรวจสอบว่า landmarks มีข้อมูลครบหรือไม่
  if (!leftEye || !rightEye || leftEye.length < 6 || rightEye.length < 6) {
    console.log('Blink Detection: Invalid eye landmarks', { leftEye, rightEye });
    return false;
  }
  
  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  
  // ตรวจสอบว่า EAR มีค่าที่ถูกต้อง
  if (leftEAR === 0 || rightEAR === 0) {
    console.log('Blink Detection: Invalid EAR values', { leftEAR, rightEAR });
    return false;
  }
  
  const avgEAR = (leftEAR + rightEAR) / 2.0;
  const EAR_THRESHOLD = 0.32; // ปรับให้สูงขึ้นเพื่อให้ตรวจจับได้ง่ายขึ้น
  
  const isBlinking = avgEAR < EAR_THRESHOLD;
  console.log('Blink Detection:', {
    leftEAR: leftEAR.toFixed(4),
    rightEAR: rightEAR.toFixed(4),
    avgEAR: avgEAR.toFixed(4),
    threshold: EAR_THRESHOLD,
    isBlinking: isBlinking
  });
  
  return isBlinking;
}

// ตรวจสอบการยิ้ม
function detectSmile(expressions) {
  const happyScore = expressions.happy;
  const threshold = 0.1; // ลด threshold จาก 0.7 เป็น 0.1 เพื่อให้ไวขึ้น
  
  const isSmiling = happyScore > threshold;
  
  console.log('Smile Detection:', {
    happyScore: happyScore.toFixed(4),
    threshold: threshold,
    isSmiling: isSmiling,
    allExpressions: {
      neutral: expressions.neutral.toFixed(4),
      happy: expressions.happy.toFixed(4),
      sad: expressions.sad.toFixed(4),
      angry: expressions.angry.toFixed(4),
      fearful: expressions.fearful.toFixed(4),
      disgusted: expressions.disgusted.toFixed(4),
      surprised: expressions.surprised.toFixed(4)
    }
  });
  
  return isSmiling;
}

// ตรวจสอบการเคลื่อนไหวศีรษะ
let lastHeadPosition = null;
function detectHeadMovement(landmarks) {
  const nose = landmarks.getNose()[3]; // จุดกลางจมูก
  
  if (lastHeadPosition) {
    const distance = customEuclideanDistance(nose, lastHeadPosition);
    const threshold = 15; // ปรับเป็น 15 pixels เพื่อให้ขยับศีรษะปานกลาง
    const isMoving = distance > threshold;
    
    console.log('Head Movement Detection:', {
      currentNose: { x: nose.x.toFixed(2), y: nose.y.toFixed(2) },
      lastNose: { x: lastHeadPosition.x.toFixed(2), y: lastHeadPosition.y.toFixed(2) },
      distance: distance.toFixed(4),
      threshold: threshold,
      isMoving: isMoving
    });
    
    if (isMoving) {
      lastHeadPosition = nose;
      return true;
    }
  } else {
    console.log('Head Movement Detection: First position set');
    lastHeadPosition = nose;
  }
  return false;
}

// เริ่มการตรวจสอบ Liveness
async function startLivenessCheck() {
  const studentId = document.getElementById('studentId').value;
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  
  if (!studentId || !firstName || !lastName) {
    showStatus('❌ กรุณากรอกข้อมูลนิสิตให้ครบก่อน', 'error');
    return;
  }
  
  // ตรวจสอบข้อมูลนิสิตในฐานข้อมูลก่อน
  showStatus('กำลังตรวจสอบข้อมูลนิสิต...', '');
  try {
    const checkResponse = await fetch('http://localhost:3000/check-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        firstName,
        lastName
      })
    });
    
    const checkData = await checkResponse.json();
    if (!checkData.exists) {
      showStatus('❌ ไม่พบข้อมูลนิสิตในระบบ กรุณาตรวจสอบข้อมูลหรือลงทะเบียนก่อน', 'error');
      return;
    }
    
    showStatus('✅ พบข้อมูลนิสิต - เริ่มการตรวจสอบ Liveness...', 'success');
  } catch (error) {
    showStatus('❌ เกิดข้อผิดพลาดในการตรวจสอบข้อมูลนิสิต', 'error');
    return;
  }
  
  // แสดงคำแนะนำการทำ Liveness Check
  setTimeout(() => {
    showStatus('📋 คำแนะนำ: กระพริบตา 3 ครั้ง, เคลื่อนไหวศีรษะซ้าย-ขวา 2 ครั้ง, ยิ้ม 1 ครั้ง', '');
  }, 1000);
  
  setTimeout(() => {
    showStatus('🎯 เริ่มต้น: วางใบหน้าในกรอบกล้อง และเริ่มทำตามคำแนะนำ', '');
  }, 3000);
  
  isLivenessCheckPassed = false;
  blinkCount = 0;
  headMovements = 0;
  smileDetected = false; // รีเซ็ตเป็น false เสมอ
  lastHeadPosition = null;
  
  // เปิดกล้องถ้ายังไม่ได้เปิด
  if (!stream) {
    await startCamera();
  }
  
  const checkInterval = setInterval(async () => {
    try {
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      
      if (detection) {
        console.log('=== Liveness Check Cycle ===');
        console.log('Current Counts:', { blinkCount, headMovements, smileDetected });
        
        // Debug: แสดง landmarks structure
        console.log('Landmarks structure:', {
          leftEye: detection.landmarks.getLeftEye(),
          rightEye: detection.landmarks.getRightEye(),
          nose: detection.landmarks.getNose(),
          leftEyeLength: detection.landmarks.getLeftEye().length,
          rightEyeLength: detection.landmarks.getRightEye().length
        });
        
        // Test euclideanDistance function
        const testPoint1 = { x: 0, y: 0 };
        const testPoint2 = { x: 3, y: 4 };
        const testDistance = customEuclideanDistance(testPoint1, testPoint2);
        console.log('Test euclideanDistance:', { testPoint1, testPoint2, testDistance });
        
        // ตรวจสอบการกระพริบตา
        const blinkDetected = detectBlink(detection.landmarks);
        if (blinkDetected) {
          blinkCount++;
          console.log('✅ Blink detected! New count:', blinkCount);
        }
        
        // ตรวจสอบการเคลื่อนไหวศีรษะ
        const headMovementDetected = detectHeadMovement(detection.landmarks);
        if (headMovementDetected) {
          headMovements++;
          console.log('✅ Head movement detected! New count:', headMovements);
        }
        
        // ตรวจสอบการยิ้ม
        const smileDetectedNow = detectSmile(detection.expressions);
        console.log('Smile check:', { 
          smileDetectedNow, 
          smileDetected, 
          willUpdate: smileDetectedNow && !smileDetected 
        });
        if (smileDetectedNow && !smileDetected) {
          smileDetected = true;
          console.log('✅ Smile detected!');
        }
        
        // แสดงสถานะปัจจุบันตลอดเวลา
        showStatus(`👁️ กระพริบตา: ${blinkCount}/3${blinkCount >= 3 ? ' ✅' : ''}, 🤸 เคลื่อนไหวศีรษะ: ${headMovements}/2${headMovements >= 2 ? ' ✅' : ''}, 😊 ยิ้ม: ${smileDetected ? '✓ ✅' : '✗'}`, '');
        
        console.log('Updated Counts:', { blinkCount, headMovements, smileDetected });
        
        // ตรวจสอบว่าผ่านเกณฑ์หรือไม่
        if (blinkCount >= 3 && headMovements >= 2 && smileDetected) {
          console.log('🎉 ALL REQUIREMENTS MET! Liveness check passed!');
          isLivenessCheckPassed = true;
          clearInterval(checkInterval);
          showStatus('🎉 ✅ ผ่านการตรวจสอบ Liveness ทั้งหมด!', 'success');
          verifyBtn.disabled = false;
          startLivenessBtn.disabled = true;
        }
      } else {
        console.log('❌ No face detected');
        showStatus('❌ ไม่พบใบหน้า กรุณาวางใบหน้าในกรอบกล้อง', 'error');
      }
    } catch (error) {
      console.error('Error in liveness check:', error);
    }
  }, 100);
  
  // หยุดการตรวจสอบหลังจาก 30 วินาที
  setTimeout(() => {
    if (!isLivenessCheckPassed) {
      clearInterval(checkInterval);
      showStatus('❌ ไม่ผ่านการตรวจสอบ Liveness (หมดเวลา)', 'error');
    }
  }, 30000);
}

// เพิ่ม event listener สำหรับปุ่มเริ่ม Liveness Check
if (startLivenessBtn) {
  startLivenessBtn.onclick = startLivenessCheck;
}

verifyBtn.onclick = async () => {
  if (!isLivenessCheckPassed) {
    showStatus('❌ กรุณาผ่านการตรวจสอบ Liveness ก่อน', 'error');
    return;
  }
  
  const studentId = document.getElementById('studentId').value;
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  
  if (!studentId || !firstName || !lastName) {
    showStatus('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }
  
  showStatus('กำลังตรวจจับใบหน้า...', '');
  const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  if (!detection) {
    showStatus('❌ ไม่พบใบหน้า กรุณาวางใบหน้าในกรอบกล้อง', 'error');
    return;
  }
  
  // วาดกรอบใบหน้าบน overlay
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  const { box } = detection.detection;
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  // ถ่ายภาพ
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvas.toDataURL('image/jpeg');
  const faceDescriptor = detection.descriptor ? Array.from(detection.descriptor) : null;
  
  if (!imageData || !faceDescriptor) {
    showStatus('เกิดข้อผิดพลาดในการอ่านข้อมูลใบหน้า', 'error');
    return;
  }

  // ส่งข้อมูลไป backend
  showStatus('กำลังยืนยันตัวตน...', '');
  try {
    const res = await fetch('http://localhost:3000/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        firstName,
        lastName,
        image: imageData,
        faceDescriptor
      })
    });
    const data = await res.json();
    if (data.success) {
      showStatus(`✅ ${data.message} (ความเชื่อมั่น: ${data.confidence}%, ระยะห่าง: ${data.distance})`, 'success');
    } else {
      showStatus(`❌ ${data.message} (ความเชื่อมั่น: ${data.confidence}%, ระยะห่าง: ${data.distance})`, 'error');
    }
  } catch (e) {
    showStatus('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  }
};

window.onload = async () => {
  await loadModels();
  showStatus('กรุณากรอกข้อมูลนิสิต แล้วกดปุ่ม "เริ่มตรวจสอบ Liveness"', 'success');
  verifyBtn.disabled = true;
  if (startLivenessBtn) {
    startLivenessBtn.disabled = false;
  }
}; 
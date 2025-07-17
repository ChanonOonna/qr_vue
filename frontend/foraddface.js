const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const overlay = document.getElementById('overlay');
const statusDiv = document.getElementById('status');
const registerBtn = document.getElementById('registerBtn');
const toggleCameraBtn = document.getElementById('toggleCameraBtn');

let stream = null;

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
  showStatus('โหลดโมเดลสำเร็จ', 'success');
}

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

async function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
  }
}

async function toggleCamera() {
  if (stream) {
    await stopCamera();
    toggleCameraBtn.textContent = 'เปิดกล้อง';
    showStatus('กล้องถูกปิด', '');
  } else {
    await startCamera();
    toggleCameraBtn.textContent = 'ปิดกล้อง';
    showStatus('เปิดกล้องแล้ว', 'success');
  }
}

toggleCameraBtn.onclick = toggleCamera;

const studentIdInput = document.getElementById('studentId');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');

function checkFormFilled() {
  registerBtn.disabled = !(
    studentIdInput.value.trim() &&
    firstNameInput.value.trim() &&
    lastNameInput.value.trim()
  );
}
studentIdInput.addEventListener('input', checkFormFilled);
firstNameInput.addEventListener('input', checkFormFilled);
lastNameInput.addEventListener('input', checkFormFilled);
checkFormFilled();

registerBtn.onclick = async () => {
  const studentId = studentIdInput.value.trim();
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  showStatus('กำลังตรวจจับใบหน้า...', '');
  const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!studentId || !firstName || !lastName) {
    showStatus('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }
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

  // ส่งข้อมูลไป backend (studentface)
  showStatus('กำลังลงทะเบียน...', '');
  try {
    const res = await fetch('/api/attendance/student/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        first_name: firstName,
        last_name: lastName,
        face_descriptor: JSON.stringify(faceDescriptor)
      })
    });
    const data = await res.json();
    if (data.success) {
      showStatus('✅ ลงทะเบียนสำเร็จ', 'success');
    } else {
      showStatus('❌ ' + data.message, 'error');
    }
  } catch (e) {
    showStatus('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  }
};

window.onload = async () => {
  await loadModels();
  // ไม่ต้อง startCamera()
  toggleCameraBtn.textContent = 'เปิดกล้อง';
  showStatus('กรุณาเปิดกล้องเพื่อเริ่มลงทะเบียน', '');
};

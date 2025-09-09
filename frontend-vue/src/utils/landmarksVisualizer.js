/**
 * 68-Point Face Landmarks Visualizer
 * ใช้สำหรับแสดงจุดสำคัญบนใบหน้าในโปรเจค Vue
 */

export class LandmarksVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.landmarks = [];
    this.showLabels = false;
    this.showConnections = false;
  }

  /**
   * ตั้งค่าขนาด Canvas
   */
  setCanvasSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * ตั้งค่าจุดสำคัญ
   */
  setLandmarks(landmarks) {
    this.landmarks = landmarks;
  }

  /**
   * เปิด/ปิดการแสดงป้ายชื่อ
   */
  toggleLabels(show) {
    this.showLabels = show;
  }

  /**
   * เปิด/ปิดการแสดงเส้นเชื่อม
   */
  toggleConnections(show) {
    this.showConnections = show;
  }

  /**
   * วาดจุดสำคัญทั้งหมด
   */
  draw() {
    this.clear();
    
    if (this.landmarks.length === 0) return;

    // วาดเส้นเชื่อม (ถ้าเปิด)
    if (this.showConnections) {
      this.drawConnections();
    }

    // วาดจุดสำคัญ
    this.drawPoints();

    // วาดป้ายชื่อ (ถ้าเปิด)
    if (this.showLabels) {
      this.drawLabels();
    }
  }

  /**
   * วาดจุดสำคัญแต่ละจุด
   */
  drawPoints() {
    this.landmarks.forEach((point, index) => {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      
      // กำหนดสีตามกลุ่มจุด
      const color = this.getPointColor(index);
      this.ctx.fillStyle = color;
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    });
  }

  /**
   * วาดเส้นเชื่อมระหว่างจุด
   */
  drawConnections() {
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;

    // เชื่อม Jawline (จุด 0-16)
    this.drawLineSequence(0, 16);

    // เชื่อม Right Eyebrow (จุด 17-21)
    this.drawLineSequence(17, 21);

    // เชื่อม Left Eyebrow (จุด 22-26)
    this.drawLineSequence(22, 26);

    // เชื่อม Right Eye (จุด 36-41) - วงกลม
    this.drawEyeConnections(36, 41);

    // เชื่อม Left Eye (จุด 42-47) - วงกลม
    this.drawEyeConnections(42, 47);

    // เชื่อมปากบน (จุด 48-55)
    this.drawLineSequence(48, 55);

    // เชื่อมปากล่าง (จุด 56-63)
    this.drawLineSequence(56, 63);
  }

  /**
   * วาดเส้นเชื่อมตามลำดับ
   */
  drawLineSequence(start, end) {
    for (let i = start; i < end; i++) {
      if (this.landmarks[i] && this.landmarks[i + 1]) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.landmarks[i].x, this.landmarks[i].y);
        this.ctx.lineTo(this.landmarks[i + 1].x, this.landmarks[i + 1].y);
        this.ctx.stroke();
      }
    }
  }

  /**
   * วาดเส้นเชื่อมตา (วงกลม)
   */
  drawEyeConnections(start, end) {
    // เชื่อมจุดตามลำดับ
    this.drawLineSequence(start, end);
    
    // เชื่อมจุดสุดท้ายกับจุดแรก
    if (this.landmarks[start] && this.landmarks[end]) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.landmarks[end].x, this.landmarks[end].y);
      this.ctx.lineTo(this.landmarks[start].x, this.landmarks[start].y);
      this.ctx.stroke();
    }
  }

  /**
   * วาดป้ายชื่อจุดสำคัญ
   */
  drawLabels() {
    this.landmarks.forEach((point, index) => {
      // แสดงหมายเลขจุด
      this.ctx.fillStyle = '#333';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(index.toString(), point.x, point.y - 8);

      // แสดงป้ายชื่อสำหรับจุดสำคัญ
      if (this.isKeyPoint(index)) {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillText(this.getPointLabel(index), point.x, point.y + 20);
      }
    });
  }

  /**
   * ตรวจสอบว่าเป็นจุดสำคัญหรือไม่
   */
  isKeyPoint(index) {
    return [0, 27, 36, 42, 48].includes(index);
  }

  /**
   * รับป้ายชื่อจุดสำคัญ
   */
  getPointLabel(index) {
    const labels = {
      0: 'คาง (Chin)',
      27: 'ปลายจมูก (Nose Tip)',
      36: 'ตาขวา (Right Eye)',
      42: 'ตาซ้าย (Left Eye)',
      48: 'ปาก (Mouth)'
    };
    return labels[index] || '';
  }

  /**
   * รับสีตามกลุ่มจุด
   */
  getPointColor(index) {
    if (index <= 16) return '#ff6b6b';      // Jawline - แดง
    if (index <= 21) return '#4ecdc4';      // Right Eyebrow - เขียว
    if (index <= 26) return '#45b7d1';      // Left Eyebrow - น้ำเงิน
    if (index <= 35) return '#96ceb4';      // Nose - เขียวอ่อน
    if (index <= 41) return '#feca57';      // Right Eye - เหลือง
    if (index <= 47) return '#ff9ff3';      // Left Eye - ชมพู
    return '#a55eea';                        // Mouth - ม่วง
  }

  /**
   * ล้าง Canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * สร้างข้อมูลจุดสำคัญตัวอย่าง (สำหรับทดสอบ)
   */
  static createSampleLandmarks() {
    return [
      // Jawline (ขอบกราม) - 17 จุด
      {x: 400, y: 500}, {x: 380, y: 490}, {x: 420, y: 490},
      {x: 360, y: 470}, {x: 440, y: 470}, {x: 340, y: 450},
      {x: 460, y: 450}, {x: 320, y: 430}, {x: 480, y: 430},
      {x: 300, y: 410}, {x: 500, y: 410}, {x: 280, y: 390},
      {x: 520, y: 390}, {x: 260, y: 370}, {x: 540, y: 370},
      {x: 240, y: 350}, {x: 560, y: 350},
      
      // Right Eyebrow (คิ้วขวา) - 5 จุด
      {x: 480, y: 200}, {x: 500, y: 195}, {x: 520, y: 190},
      {x: 540, y: 195}, {x: 560, y: 200},
      
      // Left Eyebrow (คิ้วซ้าย) - 5 จุด
      {x: 320, y: 200}, {x: 300, y: 195}, {x: 280, y: 190},
      {x: 260, y: 195}, {x: 240, y: 200},
      
      // Nose (จมูก) - 9 จุด
      {x: 400, y: 280}, {x: 400, y: 300}, {x: 390, y: 290},
      {x: 410, y: 290}, {x: 400, y: 320}, {x: 390, y: 325},
      {x: 410, y: 325}, {x: 400, y: 330}, {x: 400, y: 335},
      
      // Right Eye (ตาขวา) - 6 จุด
      {x: 480, y: 250}, {x: 490, y: 240}, {x: 520, y: 250},
      {x: 490, y: 260}, {x: 480, y: 260}, {x: 480, y: 240},
      
      // Left Eye (ตาซ้าย) - 6 จุด
      {x: 320, y: 250}, {x: 310, y: 240}, {x: 280, y: 250},
      {x: 310, y: 260}, {x: 320, y: 260}, {x: 320, y: 240},
      
      // Mouth (ปาก) - 20 จุด
      // ริมฝีปากบน (8 จุด)
      {x: 320, y: 380}, {x: 340, y: 375}, {x: 380, y: 370},
      {x: 420, y: 375}, {x: 480, y: 380}, {x: 460, y: 375},
      {x: 420, y: 370}, {x: 380, y: 375},
      
      // ริมฝีปากล่าง (8 จุด)
      {x: 320, y: 400}, {x: 340, y: 405}, {x: 380, y: 410},
      {x: 420, y: 405}, {x: 480, y: 400}, {x: 460, y: 405},
      {x: 420, y: 410}, {x: 380, y: 405},
      
      // ริมฝีปากด้านใน (4 จุด)
      {x: 380, y: 385}, {x: 420, y: 385}, {x: 380, y: 395}, {x: 340, y: 385}
    ];
  }
}

/**
 * ฟังก์ชันช่วยสำหรับการใช้งาน
 */

// สร้าง Canvas และ Visualizer
export function createLandmarksVisualizer(canvasId, width = 800, height = 600) {
  const visualizer = new LandmarksVisualizer(canvasId);
  visualizer.setCanvasSize(width, height);
  return visualizer;
}

// แสดงจุดสำคัญจากข้อมูล Face-API
export function visualizeFaceLandmarks(canvasId, detection) {
  if (!detection || !detection.landmarks) return;
  
  const visualizer = createLandmarksVisualizer(canvasId);
  
  // แปลง landmarks เป็นรูปแบบที่ต้องการ
  const landmarks = detection.landmarks.positions.map(pos => ({
    x: pos.x,
    y: pos.y
  }));
  
  visualizer.setLandmarks(landmarks);
  visualizer.toggleLabels(true);
  visualizer.toggleConnections(true);
  visualizer.draw();
  
  return visualizer;
} 
<template>
  <div class="landmarks-demo-container">
    <div class="demo-card">
      <div class="demo-header">
        <h1>🎭 68-Point Face Landmarks Demo</h1>
        <p>แสดงจุดสำคัญบนใบหน้าแบบ Interactive</p>
      </div>

      <div class="demo-content">
        <!-- Canvas สำหรับแสดงจุดสำคัญ -->
        <div class="canvas-section">
          <h3>📊 แผนภาพจุดสำคัญ</h3>
          <div class="canvas-container">
            <canvas 
              id="landmarksCanvas" 
              ref="landmarksCanvas"
              width="800" 
              height="600"
            ></canvas>
          </div>
        </div>

        <!-- ตัวควบคุมการแสดงผล -->
        <div class="controls-section">
          <h3>🎛️ ตัวควบคุม</h3>
          <div class="control-buttons">
            <button 
              @click="drawLandmarks" 
              class="btn btn-primary"
            >
              🎨 วาดจุดสำคัญ
            </button>
            <button 
              @click="toggleLabels" 
              class="btn"
              :class="showLabels ? 'btn-success' : 'btn-secondary'"
            >
              {{ showLabels ? '🏷️ ซ่อนป้ายชื่อ' : '🏷️ แสดงป้ายชื่อ' }}
            </button>
            <button 
              @click="toggleConnections" 
              class="btn"
              :class="showConnections ? 'btn-success' : 'btn-secondary'"
            >
              {{ showConnections ? '🔗 ซ่อนเส้นเชื่อม' : '🔗 แสดงเส้นเชื่อม' }}
            </button>
            <button 
              @click="clearCanvas" 
              class="btn btn-danger"
            >
              🧹 ล้างภาพ
            </button>
          </div>
        </div>

        <!-- ข้อมูลจุดสำคัญ -->
        <div class="info-section">
          <h3>📋 ข้อมูลจุดสำคัญ</h3>
          <div class="landmarks-grid">
            <div class="landmark-group jawline">
              <h4>Jawline (ขอบกราม) - 17 จุด</h4>
              <p>จุด 0-16: ขอบกรามจากคางถึงหู</p>
              <div class="point-list">
                <span class="point">0: คาง</span>
                <span class="point">1-2: ด้านล่างกราม</span>
                <span class="point">3-4: ด้านข้างกราม</span>
                <span class="point">5-6: ด้านบนกราม</span>
                <span class="point">7-8: ด้านข้างกราม</span>
                <span class="point">9-10: ด้านบนกราม</span>
                <span class="point">11-12: ด้านข้างกราม</span>
                <span class="point">13-14: ด้านบนกราม</span>
                <span class="point">15-16: ด้านข้างกราม (ใกล้หู)</span>
              </div>
            </div>

            <div class="landmark-group eyebrows">
              <h4>Eyebrows (คิ้ว) - 10 จุด</h4>
              <p>จุด 17-21: คิ้วขวา | จุด 22-26: คิ้วซ้าย</p>
              <div class="point-list">
                <span class="point">17: ปลายคิ้วขวาด้านใน</span>
                <span class="point">19: กลางคิ้วขวา</span>
                <span class="point">21: ปลายคิ้วขวาด้านนอก</span>
                <span class="point">22: ปลายคิ้วซ้ายด้านใน</span>
                <span class="point">24: กลางคิ้วซ้าย</span>
                <span class="point">26: ปลายคิ้วซ้ายด้านนอก</span>
              </div>
            </div>

            <div class="landmark-group nose">
              <h4>Nose (จมูก) - 9 จุด</h4>
              <p>จุด 27-35: จมูกและจุดเชื่อม</p>
              <div class="point-list">
                <span class="point">27: ปลายจมูก</span>
                <span class="point">28: ปลายจมูกด้านล่าง</span>
                <span class="point">29-30: ปลายจมูกด้านซ้าย-ขวา</span>
                <span class="point">31-35: จุดเชื่อมจมูก-ปาก</span>
              </div>
            </div>

            <div class="landmark-group eyes">
              <h4>Eyes (ตา) - 12 จุด</h4>
              <p>จุด 36-41: ตาขวา | จุด 42-47: ตาซ้าย</p>
              <div class="point-list">
                <span class="point">36: มุมตาขวาด้านใน</span>
                <span class="point">38: มุมตาขวาด้านนอก</span>
                <span class="point">39: มุมตาขวาด้านล่าง</span>
                <span class="point">42: มุมตาซ้ายด้านใน</span>
                <span class="point">44: มุมตาซ้ายด้านนอก</span>
                <span class="point">45: มุมตาซ้ายด้านล่าง</span>
              </div>
            </div>

            <div class="landmark-group mouth">
              <h4>Mouth (ปาก) - 20 จุด</h4>
              <p>จุด 48-67: ปากและริมฝีปาก</p>
              <div class="point-list">
                <span class="point">48: มุมปากซ้าย</span>
                <span class="point">50: ริมฝีปากบนกลาง</span>
                <span class="point">52: มุมปากขวา</span>
                <span class="point">56: มุมปากซ้าย</span>
                <span class="point">58: ริมฝีปากล่างกลาง</span>
                <span class="point">60: มุมปากขวา</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { LandmarksVisualizer } from '../utils/landmarksVisualizer'

export default {
  name: 'LandmarksDemo',
  setup() {
    const landmarksCanvas = ref(null)
    let visualizer = null
    const showLabels = ref(true)
    const showConnections = ref(true)

    onMounted(() => {
      // สร้าง Visualizer
      visualizer = new LandmarksVisualizer('landmarksCanvas')
      visualizer.setCanvasSize(800, 600)
      
      // ตั้งค่าจุดสำคัญตัวอย่าง
      const sampleLandmarks = LandmarksVisualizer.createSampleLandmarks()
      visualizer.setLandmarks(sampleLandmarks)
      
      // ตั้งค่าการแสดงผล
      visualizer.toggleLabels(showLabels.value)
      visualizer.toggleConnections(showConnections.value)
      
      // วาดจุดสำคัญ
      visualizer.draw()
    })

    const drawLandmarks = () => {
      if (visualizer) {
        visualizer.draw()
      }
    }

    const toggleLabels = () => {
      showLabels.value = !showLabels.value
      if (visualizer) {
        visualizer.toggleLabels(showLabels.value)
        visualizer.draw()
      }
    }

    const toggleConnections = () => {
      showConnections.value = !showConnections.value
      if (visualizer) {
        visualizer.toggleConnections(showConnections.value)
        visualizer.draw()
      }
    }

    const clearCanvas = () => {
      if (visualizer) {
        visualizer.clear()
      }
    }

    return {
      landmarksCanvas,
      showLabels,
      showConnections,
      drawLandmarks,
      toggleLabels,
      toggleConnections,
      clearCanvas
    }
  }
}
</script>

<style scoped>
.landmarks-demo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.demo-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.demo-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 40px 20px;
}

.demo-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.demo-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.demo-content {
  padding: 40px 30px;
}

.canvas-section {
  margin-bottom: 40px;
}

.canvas-section h3 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.5rem;
}

.canvas-container {
  text-align: center;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  border: 2px solid #e9ecef;
}

#landmarksCanvas {
  border: 2px solid #333;
  border-radius: 10px;
  background: white;
}

.controls-section {
  margin-bottom: 40px;
}

.controls-section h3 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.5rem;
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-2px);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #1e7e34;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-2px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.info-section h3 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.5rem;
}

.landmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.landmark-group {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  border-left: 4px solid;
}

.landmark-group.jawline {
  border-left-color: #ff6b6b;
  background: #ffe6e6;
}

.landmark-group.eyebrows {
  border-left-color: #4ecdc4;
  background: #e6f7f6;
}

.landmark-group.nose {
  border-left-color: #96ceb4;
  background: #e8f5e8;
}

.landmark-group.eyes {
  border-left-color: #feca57;
  background: #fff8e6;
}

.landmark-group.mouth {
  border-left-color: #a55eea;
  background: #f0e6f8;
}

.landmark-group h4 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.landmark-group p {
  color: #666;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.point-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.point {
  background: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.85rem;
  color: #333;
  border: 1px solid #ddd;
}

@media (max-width: 768px) {
  .demo-header h1 {
    font-size: 2rem;
  }
  
  .control-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .landmarks-grid {
    grid-template-columns: 1fr;
  }
  
  #landmarksCanvas {
    width: 100%;
    height: auto;
  }
}
</style> 
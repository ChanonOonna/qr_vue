# QR Attendance System

ระบบเช็คชื่อด้วย QR Code และ Face Recognition สำหรับมหาวิทยาลัย

## 🚀 Features

- **QR Code Generation** - สร้าง QR Code สำหรับเช็คชื่อ
- **Face Recognition** - ยืนยันตัวตนด้วยใบหน้า
- **Liveness Detection** - ตรวจจับการเคลื่อนไหว (ขยับหัว, กระพริบตา, ยิ้ม)
- **Real-time Attendance** - เช็คชื่อแบบ Real-time
- **Excel Export** - ส่งออกข้อมูลเป็น Excel
- **Teacher Dashboard** - แดชบอร์ดสำหรับอาจารย์

## 🛠️ Tech Stack

### Frontend
- **Vue 3** (Composition API)
- **Vite** (Build Tool)
- **Vue Router 4** (Routing)
- **Pinia** (State Management)
- **Axios** (HTTP Client)
- **face-api.js** (Face Recognition)
- **jsQR** (QR Code Scanning)
- **qrcode** (QR Code Generation)

### Backend
- **Node.js** + **Express**
- **MySQL** (Database)
- **Auth0** (Authentication)
- **Multer** (File Upload)

## 📋 Prerequisites

- Node.js 16+ 
- MySQL 8.0+
- Auth0 Account

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd qrcode
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend-vue
npm install
```

### 3. Setup Database
```bash
# Import database schema
mysql -u root -p < sql/now.sql

# Import sample data (optional)
mysql -u root -p < sql/sample_data.sql
```

### 4. Download Face API Models

**สำคัญ**: ต้อง download face-api.js models ก่อนใช้งาน

```bash
# สร้างโฟลเดอร์ models
mkdir -p frontend-vue/public/models

# Download models จาก face-api.js
cd frontend-vue/public/models

# Download required models
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
```

**หรือใช้ script อัตโนมัติ**:
```bash
# รัน script download models
cd frontend-vue
npm run download-models
```

### 5. Environment Configuration

#### Backend (.env)
```bash
# Copy environment example
cp backend/env.example backend/.env

# Edit the .env file with your settings
```

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=qr_attendance

AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_CALLBACK_URL=http://localhost:3000/callback

FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
```

#### Frontend (.env)
```bash
# Copy environment example
cp frontend-vue/env.example frontend-vue/.env

# Edit the .env file with your settings
```

```env
VITE_FRONTEND_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:3000
```

### 6. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# หรือแยกกัน
npm run dev:backend  # Backend on port 3000
npm run dev:frontend # Frontend on port 3001
```

### 7. Download Face API Models

```bash
# Download models automatically
cd frontend-vue
npm run download-models
```

## 📁 Project Structure

```
qrcode/
├── backend/                 # Node.js + Express API
│   ├── routes/             # API routes
│   ├── models/             # Database models
│   └── server.js           # Main server file
├── frontend-vue/           # Vue 3 Frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── views/          # Page components
│   │   ├── services/       # API services
│   │   ├── stores/         # Pinia stores
│   │   └── utils/          # Utility functions
│   ├── public/
│   │   ├── models/         # Face API models
│   │   └── js/             # External libraries
│   └── vite.config.js      # Vite configuration
├── sql/                    # Database scripts
└── package.json            # Root package.json
```

## 🔧 Development

### Available Scripts

```bash
# Root level
npm run dev              # Start both servers
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only
npm run install:all      # Install all dependencies

# Backend
cd backend
npm run dev              # Start with nodemon
npm run start            # Start production

# Frontend
cd frontend-vue
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview build
```

### Auto-restart Configuration

- **Backend**: ใช้ `nodemon` สำหรับ auto-restart
- **Frontend**: ใช้ `vite` สำหรับ hot-reload

## 🎯 Usage

### สำหรับอาจารย์
1. **Login** ด้วย Auth0
2. **สร้าง QR Code** สำหรับเช็คชื่อ
3. **ดูสถิติ** การเช็คชื่อ
4. **ส่งออกข้อมูล** เป็น Excel

### สำหรับนักเรียน
1. **สแกน QR Code** หรือกรอก Token
2. **กรอกข้อมูล** นักเรียน
3. **ยืนยันใบหน้า** ด้วย Liveness Detection
4. **เช็คชื่อสำเร็จ**

## 🔒 Security Features

- **Face Recognition** - L2 Distance Threshold (0.5)
- **Liveness Detection** - ป้องกันการใช้รูปภาพ
- **Duplicate Prevention** - ป้องกันการเช็คชื่อซ้ำ
- **Teacher Authentication** - ใช้ Auth0
- **Session Validation** - ตรวจสอบ QR Session

## 🐛 Troubleshooting

### Face API Models ไม่โหลด
```bash
# ตรวจสอบว่า models อยู่ในตำแหน่งที่ถูกต้อง
ls frontend-vue/public/models/

# ควรมีไฟล์เหล่านี้:
# - tiny_face_detector_model-shard1
# - face_landmark_68_model-shard1
# - face_expression_model-shard1
# - face_recognition_model-shard1
# - face_recognition_model-shard2
```

### WebGL Error
- ระบบจะใช้ CPU backend แทน WebGL
- ไม่มีผลต่อการทำงาน

### Database Connection Error
```bash
# ตรวจสอบ MySQL service
sudo service mysql status

# ตรวจสอบ connection string
cat backend/.env
```

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

หากมีปัญหาหรือคำถาม กรุณาสร้าง Issue ใน GitHub repository
# QR Attendance System - Vue.js Frontend

ระบบเช็คชื่อด้วยคิวอาร์โค้ดที่แปลงจาก HTML/JavaScript เป็น Vue.js

## 🚀 ฟีเจอร์

- **Authentication**: เข้าสู่ระบบด้วย Google (@ku.th)
- **QR Code Generation**: สร้าง QR Code สำหรับเช็คชื่อ
- **QR Code Scanning**: สแกน QR Code ด้วยกล้อง
- **Face Recognition**: ลงทะเบียนและยืนยันตัวตนด้วยใบหน้า
- **Attendance Tracking**: ติดตามการเช็คชื่อของนักเรียน
- **Export Data**: Export ข้อมูลเป็น Excel
- **Real-time Updates**: อัปเดตข้อมูลแบบ Real-time

## 🛠️ เทคโนโลยีที่ใช้

- **Vue 3** - Progressive JavaScript Framework
- **Vue Router 4** - Official router for Vue.js
- **Pinia** - State management for Vue
- **Axios** - HTTP client
- **Vite** - Build tool
- **jsQR** - QR Code scanning library
- **face-api.js** - Face recognition library
- **qrcode** - QR Code generation library

## 📁 โครงสร้างโปรเจค

```
frontend-vue/
├── src/
│   ├── components/          # Vue components
│   │   ├── Auth/           # Authentication components
│   │   ├── Dashboard/      # Dashboard components
│   │   ├── QR/            # QR Code components
│   │   └── Face/          # Face recognition components
│   ├── views/              # Page components
│   │   ├── Login.vue
│   │   ├── Dashboard.vue
│   │   ├── CreateQR.vue
│   │   ├── ScanQR.vue
│   │   ├── FaceRegistration.vue
│   │   └── TeacherSetup.vue
│   ├── services/           # API services
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── qrcode.js
│   │   ├── attendance.js
│   │   └── face.js
│   ├── stores/             # Pinia stores
│   │   ├── auth.js
│   │   └── qr.js
│   ├── utils/              # Utility functions
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── assets/             # Static assets
│   │   └── css/
│   ├── router/             # Vue Router
│   │   └── index.js
│   ├── App.vue
│   └── main.js
├── public/                 # Public assets
│   ├── js/                # JavaScript libraries
│   └── models/            # Face API models
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 การติดตั้งและรัน

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. รัน Development Server

```bash
npm run dev
```

แอปจะรันที่ `http://localhost:3001`

### 3. Build สำหรับ Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## 🔧 การตั้งค่า

### Backend Configuration

โปรเจคนี้ใช้ backend เดิมที่รันที่ `http://localhost:3000` โดยมีการตั้งค่า proxy ใน `vite.config.js`:

```javascript
server: {
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    },
    '/login': {
      target: 'http://localhost:3000',
      changeOrigin: true
    },
    '/logout': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

### Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ root:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=QR Attendance System
```

## 📱 หน้าต่างๆ

### 1. Login (`/`)
- เข้าสู่ระบบด้วย Google (@ku.th)
- ตรวจสอบ authentication status

### 2. Dashboard (`/dashboard`)
- แสดงสถิติการเช็คชื่อ
- รายการ QR Code sessions
- จัดการ QR Code (ดู, ลบ)

### 3. Create QR (`/create-qr`)
- สร้าง QR Code ใหม่
- ตั้งค่าข้อมูลวิชา
- กำหนดเวลาเริ่มและหมดอายุ

### 4. Scan QR (`/scan`)
- สแกน QR Code ด้วยกล้อง
- กรอก QR Token เอง
- เช็คชื่อนักเรียน

### 5. Face Registration (`/face-registration`)
- ลงทะเบียนใบหน้าของนักเรียน
- ถ่ายภาพใบหน้า
- บันทึกข้อมูลนักเรียน

### 6. Teacher Setup (`/teacher-setup`)
- ตั้งค่ารหัสครู
- แก้ไขข้อมูลครู

## 🔐 Authentication

ระบบใช้ Auth0 สำหรับ authentication:

- **Login**: Redirect ไปยัง Auth0 login page
- **Callback**: Auth0 callback กลับมาที่ backend
- **Session**: ใช้ session-based authentication
- **Logout**: Clear session และ redirect ไปหน้า login

## 📊 State Management

ใช้ Pinia สำหรับ state management:

### Auth Store
- User information
- Authentication status
- Loading states

### QR Store
- QR sessions
- Attendance data
- Current session

## 🎨 UI/UX Features

- **Responsive Design**: รองรับทุกขนาดหน้าจอ
- **Modern UI**: ใช้ gradient และ shadow effects
- **Loading States**: แสดง loading spinner
- **Notifications**: Toast notifications
- **Animations**: Smooth transitions และ animations

## 🔧 Development

### Code Style
- ใช้ Composition API
- TypeScript-like structure
- Consistent naming conventions

### File Structure
- Components แยกตาม feature
- Services แยกตาม domain
- Utils สำหรับ reusable functions

### Error Handling
- Global error handling ใน API service
- User-friendly error messages
- Loading states สำหรับ async operations

## 🚀 Deployment

### Build
```bash
npm run build
```

### Serve
ใช้ static file server เช่น nginx หรือ serve:

```bash
npx serve -s dist
```

### Environment
ตั้งค่า environment variables สำหรับ production:
- API base URL
- Auth0 configuration
- Feature flags

## 📝 API Endpoints

### Authentication
- `GET /api/user` - Get user info
- `POST /api/user/teacher-code` - Update teacher code
- `GET /login` - Auth0 login
- `GET /logout` - Logout

### QR Code
- `GET /api/qrcode/sessions` - Get all sessions
- `POST /api/qrcode/sessions` - Create new session
- `GET /api/qrcode/sessions/:id` - Get session by ID
- `DELETE /api/qrcode/sessions/:id` - Delete session
- `GET /api/qrcode/sessions/token/:token` - Get session by token

### Attendance
- `GET /api/attendance/session/:id` - Get attendance
- `POST /api/attendance/checkin` - Student check-in
- `PUT /api/attendance/:id` - Update attendance
- `GET /api/attendance/session/:id/export` - Export Excel

### Face Recognition
- `POST /api/attendance/student/register` - Register face
- `POST /api/attendance/face/verify` - Verify face

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

หากมีปัญหาหรือคำถาม กรุณาสร้าง issue ใน GitHub repository 
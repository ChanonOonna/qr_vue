# 📋 QR Attendance System - Development Notes

## 🚀 **Project Overview**
QR Attendance System ที่แปลงจาก HTML/JavaScript เป็น Vue.js โดยใช้ Backend เดิม (Node.js + Express + MySQL + Auth0)

## 🏗️ **Architecture**

### **Frontend (Vue.js)**
- **Port**: 3001
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Router**: Vue Router 4
- **HTTP Client**: Axios

### **Backend (Node.js)**
- **Port**: 3000
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: Auth0
- **Session**: Express Session

## 📁 **Project Structure**

```
qrcode/
├── backend/                 # Backend API
│   ├── routes/             # API routes
│   ├── models/             # Database models
│   ├── auth.js             # Auth0 configuration
│   ├── db.js               # Database connection
│   └── server.js           # Main server file
├── frontend-vue/           # Vue.js Frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── views/          # Page components
│   │   ├── services/       # API services
│   │   ├── stores/         # Pinia stores
│   │   ├── utils/          # Utility functions
│   │   └── router/         # Vue Router
│   ├── public/             # Static files
│   └── package.json
└── package.json            # Root package.json
```

## 🛠️ **Development Setup**

### **1. Install Dependencies**
```bash
npm run install:all
```

### **2. Start Development Servers**
```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:backend    # Backend with nodemon
npm run dev:frontend   # Frontend with Vite
```

### **3. Production Build**
```bash
# Build frontend
cd frontend-vue && npm run build

# Start production
npm run start
```

## 🔧 **Auto Restart Configuration**

### **Backend (Nodemon)**
- **Watch**: All `.js` and `.json` files
- **Auto Restart**: When files change
- **Script**: `npm run dev` in backend folder

### **Frontend (Vite)**
- **Hot Reload**: Instant updates
- **Port**: 3001
- **Host**: All interfaces

## 📱 **Key Features**

### **1. Authentication (Auth0)**
- Google OAuth for @ku.th accounts
- Teacher code setup
- Session management

### **2. QR Code Management**
- Create QR sessions
- Set time limits
- Late minute configuration
- Session status tracking

### **3. Face Recognition**
- Student face registration
- Face verification during check-in
- Liveness detection
- Face descriptor comparison

### **4. Attendance System**
- QR code scanning
- Manual token entry
- Student data validation
- Attendance status calculation
- Excel export

## 🔄 **API Endpoints**

### **Authentication**
- `GET /api/user` - Get current user
- `POST /api/user/teacher-code` - Update teacher code
- `GET /login` - Auth0 login
- `GET /logout` - Logout

### **QR Sessions**
- `GET /api/qrcode/sessions` - Get all sessions
- `POST /api/qrcode/sessions` - Create new session
- `GET /api/qrcode/sessions/:id` - Get session by ID
- `DELETE /api/qrcode/sessions/:id` - Delete session
- `GET /api/qrcode/sessions/token/:token` - Get session by token

### **Attendance**
- `GET /api/attendance/session/:id` - Get attendance for session
- `POST /api/attendance/validate-student` - Validate student data
- `POST /api/attendance/checkin` - Student check-in
- `PUT /api/attendance/:id` - Update attendance record
- `GET /api/attendance/session/:id/export` - Export to Excel

### **Face Recognition**
- `POST /api/face/register` - Register student face
- `POST /api/face/verify` - Verify face during check-in

## 🎯 **Page Flow**

### **Teacher Flow**
1. **Login** (`/`) → Auth0 authentication
2. **Teacher Setup** (`/teacher-setup`) → Set teacher code
3. **Dashboard** (`/dashboard`) → View sessions and stats
4. **Create QR** (`/create-qr`) → Create new session
5. **Session Detail** (`/dashboard/session/:id`) → View attendance

### **Student Flow**
1. **Scan QR** (`/scan`) → Scan QR code or enter token
2. **Face Registration** (`/face-registration`) → Register face

## 🔒 **Security Features**

### **Authentication**
- Auth0 integration
- Session-based authentication
- Teacher code validation

### **Face Recognition**
- L2 distance comparison
- Liveness detection
- Face descriptor validation

### **Data Validation**
- Input sanitization
- Duplicate prevention
- Session expiration checks

## 🎨 **UI/UX Features**

### **Responsive Design**
- Mobile-first approach
- Tailwind CSS styling
- Modern UI components

### **User Experience**
- Loading states
- Error handling
- Success notifications
- Form validation

### **Accessibility**
- Semantic HTML
- Keyboard navigation
- Screen reader support

## 🗄️ **Database Schema**

### **Tables**
- `teachers` - Teacher information
- `qr_sessions` - QR session data
- `students` - Student information
- `student_attendance` - Attendance records
- `studentface` - Face registration data
- `student_submissions` - Submission tracking

## 🚨 **Error Handling**

### **Frontend Errors**
- Network errors
- Validation errors
- Authentication errors
- Face recognition errors

### **Backend Errors**
- Database errors
- Authentication errors
- Validation errors
- Rate limiting

## 📊 **Status Calculation**

### **Attendance Status**
```javascript
const now = new Date();
const startTime = new Date(session.start_time);
const lateTime = new Date(startTime.getTime() + (session.late_minute * 60 * 1000));

let status = 'มา';
if (now > lateTime) {
  status = 'สาย';
}
```

### **Session Status**
- **ใช้งาน** - Session is active and not expired
- **หมดเวลา** - Session has expired
- **ยังไม่ถึงเวลา** - Session hasn't started yet

## 🔧 **Environment Variables**

### **Backend**
```env
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Nn1234
DB_NAME=qrcheck
```

### **Frontend**
```env
VITE_FRONTEND_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:3000
```

## 🐛 **Common Issues & Solutions**

### **1. Infinite Loop on Login**
- **Cause**: Repeated auth checks
- **Solution**: Added `authChecked` flag in auth store

### **2. Face Recognition Errors**
- **Cause**: WebGL not supported
- **Solution**: Use CPU backend for face-api.js

### **3. Camera Access Issues**
- **Cause**: Browser permissions
- **Solution**: Request camera access with proper error handling

### **4. Database Connection**
- **Cause**: MySQL service not running
- **Solution**: Start MySQL service

## 📝 **Development Guidelines**

### **Code Style**
- Use Vue 3 Composition API
- Follow ESLint rules
- Use TypeScript-like comments
- Write descriptive variable names

### **Git Workflow**
- Feature branches
- Descriptive commit messages
- Code review process
- Testing before merge

### **Testing**
- Unit tests for utilities
- Integration tests for API
- E2E tests for critical flows
- Manual testing checklist

## 🚀 **Deployment**

### **Frontend**
```bash
cd frontend-vue
npm run build
# Deploy dist/ folder
```

### **Backend**
```bash
cd backend
npm install --production
# Deploy with PM2 or similar
```

## 📞 **Support**

### **Troubleshooting**
1. Check console errors
2. Verify database connection
3. Check Auth0 configuration
4. Validate environment variables

### **Logs**
- Backend logs in console
- Frontend errors in browser console
- Database logs in MySQL

---

**Last Updated**: August 3, 2025
**Version**: 1.0.0
**Status**: Development Complete ✅ 
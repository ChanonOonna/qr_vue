# การตั้งค่า Railway MySQL

## 1. สร้าง Railway MySQL Database

1. เข้าไปที่ [Railway.app](https://railway.app)
2. สร้างโปรเจคใหม่
3. เพิ่ม MySQL Database
4. คัดลอกข้อมูลการเชื่อมต่อ:
   - Host
   - Port  
   - Username
   - Password
   - Database Name

## 2. อัปเดต .env file

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/` ด้วยข้อมูลจาก Railway:

```env
# Database Configuration (Railway MySQL)
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=your_railway_password_here
DB_NAME=railway
DB_PORT=3306
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

# Auth0 Configuration
AUTH0_DOMAIN=dev-tte8v56bmpl3e46o.us.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_CALLBACK_URL=http://localhost:3000/callback

# Application URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000

# Server Configuration
PORT=3000
SESSION_SECRET=your_session_secret_here_change_this_in_production

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
SESSION_MAX_AGE=3600000
```

## 3. รัน SQL Schema

หลังจากเชื่อมต่อ Railway MySQL แล้ว รันคำสั่ง:

```bash
cd backend
npm run seed
```

หรือรัน SQL จากไฟล์ `sql/newer.sql` ใน Railway MySQL Console

## 4. ทดสอบการเชื่อมต่อ

```bash
cd backend
npm run dev
```

## 5. ข้อแตกต่างจาก Local MySQL

- ต้องใช้ SSL connection
- Connection timeout อาจนานกว่า
- ต้องใช้ hostname แทน localhost
- Port อาจไม่ใช่ 3306 เสมอ

## 6. การแก้ไขปัญหาที่พบบ่อย

### Connection timeout
- เพิ่ม `acquireTimeout: 60000` ใน db.js
- เพิ่ม `timeout: 60000` ใน db.js

### SSL Error
- เพิ่ม `ssl: { rejectUnauthorized: false }` ใน db.js

### Connection refused
- ตรวจสอบ host และ port จาก Railway
- ตรวจสอบ firewall settings

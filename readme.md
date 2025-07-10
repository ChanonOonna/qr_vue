# ระบบเช็คชื่อด้วย QR Code

ระบบเช็คชื่ออัจฉริยะสำหรับครูและนักเรียน ใช้ QR Code ในการเช็คชื่อเข้าชั้นเรียน

## ✨ ฟีเจอร์หลัก

### สำหรับครู (Dashboard)
- 🔐 **การเข้าสู่ระบบด้วย Auth0** - ใช้ Google Account (@ku.th)
- 📱 **สร้าง QR Code** - สร้าง QR Code สำหรับเช็คชื่อในแต่ละวิชา
- 📋 **รายการ QR Code** - ดูรายการ QR Code ทั้งหมดที่สร้างไว้
- 👥 **ข้อมูลการเช็คชื่อ** - ดูรายละเอียดการเช็คชื่อของนักเรียนแต่ละคน
- 📊 **สถิติการเช็คชื่อ** - ดูสถิติการมาเรียน สาย ขาด
- ✏️ **ให้คะแนนเพิ่มเติม** - ให้คะแนนเพิ่มเติมและหมายเหตุสำหรับนักเรียน
- 📥 **Export ข้อมูล** - ดาวน์โหลดข้อมูลการเช็คชื่อเป็น CSV

### สำหรับนักเรียน (Scan)
- 📱 **สแกน QR Code** - สแกน QR Code เพื่อเช็คชื่อ
- ⌨️ **กรอกข้อมูลเอง** - กรอก QR Token เองหากไม่สามารถสแกนได้
- ✅ **ตรวจสอบสถานะ** - ดูสถานะการเช็คชื่อ (มา/สาย/ขาด)

## 🚀 การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
cd backend
npm install
```

### 2. ตั้งค่าฐานข้อมูล

1. สร้างฐานข้อมูล MySQL ชื่อ `qrcheck`
2. รันไฟล์ `sql/qrcheck.sql` เพื่อสร้างตาราง
3. แก้ไขการตั้งค่าฐานข้อมูลใน `backend/db.js`

### 3. ตั้งค่า Auth0

1. สร้าง Auth0 Application
2. ตั้งค่า Allowed Callback URLs: `http://localhost:3000/callback`
3. ตั้งค่า Allowed Logout URLs: `http://localhost:3000`
4. แก้ไขการตั้งค่าใน `backend/auth.js`

### 4. รันเซิร์ฟเวอร์

```bash
cd backend
npm start
```

## 📁 โครงสร้างไฟล์

```
infoproject/
├── backend/
│   ├── models/
│   │   ├── attendance.js      # Model การเช็คชื่อ
│   │   ├── qrcodeSession.js   # Model QR Code sessions
│   │   ├── student.js         # Model นักเรียน
│   │   └── user.js           # Model ผู้ใช้ (ครู)
│   ├── routes/
│   │   ├── attendance.js      # API การเช็คชื่อ
│   │   ├── qrcode.js         # API QR Code
│   │   └── users.js          # API นักเรียน
│   ├── auth.js               # การยืนยันตัวตน
│   ├── db.js                 # การเชื่อมต่อฐานข้อมูล
│   ├── server.js             # เซิร์ฟเวอร์หลัก
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css         # สไตล์ CSS
│   ├── js/
│   │   ├── auth.js           # การยืนยันตัวตน (Frontend)
│   │   ├── dashboard.js      # Dashboard สำหรับครู
│   │   └── scan.js           # หน้า Scan สำหรับนักเรียน
│   ├── dashboard.html        # หน้า Dashboard
│   ├── index.html            # หน้า Login
│   └── scan.html             # หน้า Scan QR Code
└── sql/
    └── qrcheck.sql           # โครงสร้างฐานข้อมูล
```

## 🔧 การใช้งาน

### สำหรับครู

1. **เข้าสู่ระบบ**
   - ไปที่ `http://localhost:3000`
   - คลิก "เข้าสู่ระบบด้วย Google"
   - ใช้ Google Account ที่มี domain @ku.th

2. **สร้าง QR Code**
   - คลิก "สร้าง QR Code ใหม่"
   - กรอกข้อมูลวิชา เวลา และการตั้งค่า
   - คลิก "สร้าง QR Code"
   - แสดง QR Code ให้นักเรียนสแกน

3. **ดูรายการ QR Code**
   - หน้า Dashboard จะแสดงรายการ QR Code ทั้งหมด
   - คลิกที่ QR Code เพื่อดูรายละเอียด

4. **จัดการการเช็คชื่อ**
   - ดูรายการนักเรียนที่เช็คชื่อ
   - ให้คะแนนเพิ่มเติมและหมายเหตุ
   - Export ข้อมูลเป็น CSV

### สำหรับนักเรียน

1. **เข้าสู่หน้า Scan**
   - ไปที่ `http://localhost:3000/scan`

2. **กรอกข้อมูล**
   - กรอกรหัสนักเรียน
   - กรอกชื่อ-นามสกุล

3. **สแกน QR Code**
   - คลิก "เริ่มสแกน QR Code"
   - อนุญาตการเข้าถึงกล้อง
   - สแกน QR Code ที่ครูแสดง

4. **หรือกรอก QR Token เอง**
   - กรอก QR Token ที่ครูให้
   - คลิก "ส่ง"

## 📊 โครงสร้างฐานข้อมูล

### ตารางหลัก
- **teachers** - ข้อมูลครู
- **students** - ข้อมูลนักเรียน
- **qr_sessions** - ข้อมูล QR Code sessions
- **student_attendance** - ข้อมูลการเช็คชื่อ

### ความสัมพันธ์
- ครู 1 คน สามารถสร้าง QR Code ได้หลายอัน
- QR Code 1 อัน สามารถมีนักเรียนเช็คชื่อได้หลายคน
- นักเรียน 1 คน สามารถเช็คชื่อใน QR Code 1 อันได้ 1 ครั้ง

## 🔒 ความปลอดภัย

- **Authentication** - ใช้ Auth0 สำหรับการยืนยันตัวตน
- **Authorization** - ครูสามารถเข้าถึงเฉพาะข้อมูลของตัวเอง
- **Session Management** - ใช้ Express Session
- **Rate Limiting** - จำกัดจำนวน request
- **CORS** - ตั้งค่า CORS สำหรับความปลอดภัย

## 🛠️ การพัฒนา

### การเพิ่มฟีเจอร์ใหม่

1. **เพิ่ม Model** - สร้างไฟล์ใน `backend/models/`
2. **เพิ่ม Route** - สร้างไฟล์ใน `backend/routes/`
3. **เพิ่ม Frontend** - สร้างไฟล์ใน `frontend/`
4. **อัปเดต Database** - แก้ไข `sql/qrcheck.sql`

### การ Debug

```bash
# ดู logs ของเซิร์ฟเวอร์
npm run dev

# ดู logs ของฐานข้อมูล
# ตรวจสอบการเชื่อมต่อใน db.js
```

## 📝 หมายเหตุ

- ระบบนี้เป็น prototype สำหรับการใช้งานจริง
- ควรเพิ่ม QR Code detection library เช่น jsQR หรือ ZXing
- ควรเพิ่มการ validate ข้อมูลที่เข้มงวดมากขึ้น
- ควรเพิ่มระบบ backup และ recovery
- ควรเพิ่มการ monitor และ logging

## 🤝 การสนับสนุน

หากมีปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมพัฒนา

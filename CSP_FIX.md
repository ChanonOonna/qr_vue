# Content Security Policy (CSP) Fix

## 🔍 ปัญหาที่เกิดขึ้น

### ข้อผิดพลาด:
```
Refused to execute inline event handler because it violates the following Content Security Policy directive: "script-src-attr 'none'".
```

### สาเหตุ:
- **Content Security Policy (CSP)** ป้องกันการทำงานของ inline event handlers
- ปุ่มที่มี `onclick="function()"` ถูกรวมอยู่ใน inline event handler
- เบราว์เซอร์ปฏิเสธการทำงานเพื่อความปลอดภัย

## 🛠️ วิธีแก้ไข

### 1. ลบ Inline Event Handlers
แทนที่ `onclick` attributes ด้วย `id` attributes:

**ก่อน:**
```html
<button onclick="showCreateQR()">สร้าง QR Code</button>
<button onclick="refreshDashboard()">รีเฟรช</button>
```

**หลัง:**
```html
<button id="createQRBtn">สร้าง QR Code</button>
<button id="refreshBtn">รีเฟรช</button>
```

### 2. เพิ่ม Event Listeners ใน JavaScript
ใช้ `addEventListener` แทน inline handlers:

```javascript
// Create QR button
const createQRBtn = document.getElementById('createQRBtn');
if (createQRBtn) {
  createQRBtn.addEventListener('click', () => this.showCreateQR());
}

// Refresh button
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => this.refreshDashboard());
}
```

## 📁 ไฟล์ที่แก้ไข

### 1. `frontend/dashboard.html`
- ลบ `onclick` attributes จากปุ่มทั้งหมด
- เพิ่ม `id` attributes แทน

### 2. `frontend/create-qr.html`
- ลบ `onclick` attributes จากปุ่มทั้งหมด
- เพิ่ม `id` attributes แทน

### 3. `frontend/js/dashboard.js`
- เพิ่ม event listeners ใน `setupEventListeners()` method
- เพิ่ม `refreshDashboard()` method
- อัปเดต `showCreateQR()` ให้ redirect ไปหน้า create-qr.html

### 4. `frontend/js/create-qr.js`
- เพิ่ม event listeners ใน `setupEventListeners()` method
- เพิ่ม `logout()` method
- ปรับปรุง global functions สำหรับ compatibility

## ✅ ผลลัพธ์

### ข้อดี:
1. **ความปลอดภัย**: ไม่มี inline event handlers ที่อาจเป็นช่องโหว่
2. **CSP Compliance**: ผ่าน Content Security Policy
3. **Maintainability**: แยก JavaScript ออกจาก HTML
4. **Performance**: Event delegation ที่ดีกว่า

### การทำงาน:
- ปุ่มทั้งหมดทำงานได้ปกติ
- ไม่มี CSP errors
- Code มีโครงสร้างที่ดีกว่า

## 🔧 การทดสอบ

1. เปิดหน้า Dashboard
2. กดปุ่ม "สร้าง QR Code ใหม่" → ไปหน้า create-qr.html
3. กดปุ่ม "รีเฟรช" → อัปเดตข้อมูล
4. กดปุ่ม "ออกจากระบบ" → กลับหน้าแรก

## 📚 ข้อมูลเพิ่มเติม

### CSP Directives ที่เกี่ยวข้อง:
- `script-src-attr 'none'` - ป้องกัน inline event handlers
- `script-src 'self'` - อนุญาต JavaScript จาก same origin
- `unsafe-inline` - อนุญาต inline scripts (ไม่แนะนำ)

### Best Practices:
1. หลีกเลี่ยง inline event handlers
2. ใช้ event listeners แทน
3. แยก JavaScript ออกจาก HTML
4. ใช้ CSP headers อย่างเหมาะสม

การแก้ไขนี้ทำให้ระบบปลอดภัยและเป็นไปตามมาตรฐาน CSP อย่างสมบูรณ์ 
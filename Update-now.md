# 🔄 Latest Updates: Vertical Forest Dashboard (April 8, 2026)

บันทึกการอัปเดตระบบและฟีเจอร์ล่าสุดทั้งหมดในเซสชันนี้

---

## 🏗️ Core System & Rebranding
- **Project Renaming**: เปลี่ยนชื่อโปรเจกต์จาก "AgroBot" เป็น **"Vertical Forest Dashboard"** ทั่วทั้งระบบ (Code, UI, Config, Docs)
- **Routing Refactor**: เปลี่ยนเส้นทางหลักจาก `/fleet` เป็น **`/dashboard`** ทั้งโครงสร้างโฟลเดอร์และการทำ Redirect
- **Fallback Pages**: 
  - เพิ่มหน้า **Error Page** สำหรับดักจับ Database Connection (Prisma) โดยเฉพาะ
  - เพิ่มหน้า **Not Found (404)** ที่ดีไซน์เข้าชุดกัน

---

## ⚙️ Setup & Commissioning (USB/MCU)
- **USB Workflow Split**: แยกปุ่ม **"Connect USB"** และ **"Sync to Board"** ออกจากกันเพื่อความเสถียร
- **Auto-Fetch Logic**: ระบบจะส่งคำสั่ง `GET_INFO` ไปยัง MCU ทันทีที่เชื่อมต่อ USB สำเร็จเพื่อดึงค่า IP และ Config ปัจจุบัน
- **Dual Fetching Source**: เพิ่มปุ่มแยกสำหรับ **"Fetch from Database"** และ **"Fetch from MCU"** ทำให้สลับดูข้อมูลได้ตลอดเวลา
- **Live JSON Preview**: เพิ่มส่วนแสดงผล JSON ที่จะส่งออก (Live) และ JSON ที่อยู่ในบอร์ด (LittleFS) แบบพับเก็บได้
- **Plant Management**: แก้ไขระบบให้สามารถ **ลบพืช (Remove Plant)** ออกจากกระถางได้แล้ว
- **Error Handling**: จัดการกรณีผู้ใช้กด "Cancel" ตอนเลือก USB Port ไม่ให้ขึ้นหน้าจอ Error สีแดง

---

## 📊 Analytics & Dashboard
- **Analytics Cleanup**: ลบส่วน Summary Report และ Performance Highlights (แถบสีเขียวและ Card สรุป) ออกตามความต้องการ เพื่อให้หน้าจอดูสะอาดและเน้นกราฟหลัก
- **Dashboard Overview**: 
  - เปลี่ยน "Active Bots" ➡️ **"Total Bots"**
  - เปลี่ยน "Fleet Health" ➡️ **"Total Plants"** (ดึงยอดรวมจาก DB จริง)
  - สลับตำแหน่ง "Watering Events" ไปไว้ขวาสุด

---

## 🤖 Robot Details (Deep Analytics)
- **Dynamic Routing**: รองรับหน้ารายละเอียดแยกตาม ID หุ่นยนต์ (`/details/[id]`)
- **Robot History Logs**: 
  - เพิ่มตาราง Log การทำงานของหุ่นยนต์แต่ละตัว
  - **Async Pagination**: รองรับการเปลี่ยนหน้า Log (50 รายการ/หน้า) โดย**ไม่โหลดหน้าเว็บใหม่**
  - **Sticky Header**: ส่วนหัวตารางค้างไว้ขณะเลื่อนดูข้อมูล
- **Interactive List**: 
  - ทำให้ ID และ ชื่อหุ่นยนต์ในหน้า Dashboard คลิกเข้าหน้า Details ได้
  - เพิ่มปุ่มไอคอน **External Link** ในรายการ Robot Details เพื่อเข้าสู่หน้าเจาะลึกได้ทันที

---

## 🔐 UI/UX & Security
- **Login Page**: เพิ่มปุ่ม **"Return to Dashboard"** ให้ผู้ใช้ทั่วไปสามารถกลับหน้าหลักได้โดยไม่ต้อง Login
- **Sidebar**: ลบเมนู "System Settings" ออกชั่วคราวตามคำสั่ง
- **Mobile Support**: ปรับปรุงการ Import และการใช้ State เพื่อให้รองรับ iPad/Safari ได้เสถียรขึ้น
- **Bug Fixes**: แก้ไขปัญหา ReferenceError ของไอคอน (Link, CheckCircle, ExternalLink) ในหลายๆ จุด

---

## 🛠️ Tech Stack Status
- **Next.js**: 16.2.1 (App Router)
- **Prisma**: PostgreSQL Management
- **Icons**: Lucide React
- **Analytics**: Recharts (Customized)

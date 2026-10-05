# 💰 InvestPro — เครื่องมือการลงทุนครบวงจร

> เว็บแอปพลิเคชันเครื่องมือการลงทุน All-in-One 5 เครื่องมือ | Premium Dark Theme | ภาษาไทย

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)

## ✨ Features

### 1. 📊 พอร์ตลงทุน (Portfolio Dashboard)
- เพิ่ม/ลบสินทรัพย์ (หุ้น, คริปโต, กองทุน, ทอง, พันธบัตร)
- คำนวณมูลค่ารวม, กำไร/ขาดทุน, % เปลี่ยนแปลง
- Doughnut Chart สัดส่วนพอร์ต
- กรองตามประเภท | ข้อมูลเก็บใน LocalStorage

### 2. 💹 ราคาคริปโต (Crypto Price Tracker)
- ดึงราคา Real-time จาก CoinGecko API (ฟรี)
- Top 30 เหรียญ + Market Overview
- Mini Sparkline Chart | ค้นหาเหรียญ | Auto-refresh 60 วินาที

### 3. 🧮 ดอกเบี้ยทบต้น (Compound Interest Calculator)
- คำนวณดอกเบี้ยทบต้น + เงินลงทุนเพิ่มรายเดือน
- Stacked Area Chart | เปรียบเทียบ 3 สถานการณ์
- ตาราง Breakdown รายปี | Interactive Slider

### 4. 📉 DCA Simulator
- จำลอง DCA 5 รูปแบบ (Random, Uptrend, Downtrend, Volatile, Crash+Recover)
- คำนวณต้นทุนเฉลี่ย, กำไร/ขาดทุน, หน่วยสะสม
- กราฟเงินลงทุน vs มูลค่าพอร์ต

### 5. 💰 รายรับรายจ่าย (Budget Tracker)
- บันทึกรายรับ/รายจ่าย 15+ หมวดหมู่
- Donut + Bar Chart | กรองตามเดือน/ปี
- อัตราออม + ยอดคงเหลือ | LocalStorage

## 🎨 Design

- **Dark Theme** + Glassmorphism
- **Gradient Glow Effects** + Micro-animations
- **Responsive** ทุกหน้าจอ (Desktop, Tablet, Mobile)
- **Google Fonts (Inter)** + Font Awesome Icons

## 🚀 วิธีใช้งาน

เพียงเปิดไฟล์ `index.html` ในเบราว์เซอร์ — ไม่ต้องติดตั้งอะไรเพิ่ม!

```bash
# Clone repo
git clone https://github.com/Jirachotsaonram/investment-toolkit.git

# เปิดในเบราว์เซอร์
open index.html
```

> **หมายเหตุ**: หน้า Crypto Price Tracker อาจมีข้อจำกัด CORS เมื่อเปิดจาก `file://` — ถ้า API ไม่ตอบ ระบบจะแสดง Mock Data แทนอัตโนมัติ

## 📁 โครงสร้างไฟล์

```
investment-toolkit/
├── index.html          # โครงสร้างหลัก + 5 หน้า
├── css/
│   └── style.css       # Dark theme, glassmorphism, responsive
└── js/
    ├── app.js          # Navigation, utilities, toast
    ├── portfolio.js    # Portfolio Dashboard
    ├── tracker.js      # Crypto Price Tracker
    ├── compound.js     # Compound Interest Calculator
    ├── dca.js          # DCA Simulator
    └── budget.js       # Budget & Expense Tracker
```

## 🛠️ เทคโนโลยี

| เทคโนโลยี | การใช้งาน |
|---|---|
| HTML5 / CSS3 / ES6+ | โครงสร้าง, สไตล์, ลอจิก |
| Chart.js 4.4.7 | กราฟ (Doughnut, Line, Bar, Area) |
| CoinGecko API | ราคาคริปโต Real-time |
| LocalStorage | เก็บข้อมูลผู้ใช้ |
| Font Awesome 6.5 | ไอคอน |

## 📄 License

MIT License — ใช้งานได้อิสระ

# Versioning Rule

ทุกครั้งที่แก้ไข `app.js` ให้อัปเดต version ใน 2 ที่พร้อมกันเสมอ:

1. `index.html` — query string: `<script src="app.js?v=YYYYMMDD{suffix}"></script>`
2. `app.js` — ตัวแปร: `var APP_VER='DD.MM.YY{suffix}';`

Format: วันที่ปัจจุบัน + suffix ตัวอักษร (a, b, c, ...) ถ้ามีหลาย deploy ในวันเดียวกัน

ตัวอย่าง:
- `?v=20260420b` / `APP_VER='20.04.26b'`
- `?v=20260421` / `APP_VER='20.04.21'`

เหตุผล: บังคับให้ browser ทุกเครื่องโหลด `app.js` ใหม่ ป้องกัน cache เก่าค้างอยู่

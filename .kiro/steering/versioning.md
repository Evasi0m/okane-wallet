# Versioning Rule

## 1. Cache-busting (index.html + app.js)

ทุกครั้งที่แก้ไข `app.js` ให้อัปเดต 2 ที่พร้อมกันเสมอ:

1. `index.html` — query string: `<script src="app.js?v=YYYYMMDD{suffix}"></script>`
2. `app.js` — ตัวแปร: `var APP_VER='x.y.z';` (ดู rule ด้านล่าง)

Format ของ query string: วันที่ปัจจุบัน + suffix ตัวอักษร (a, b, c, ...) ถ้ามีหลาย deploy ในวันเดียวกัน

ตัวอย่าง query string:
- `?v=20260420b`
- `?v=20260421`

เหตุผล: บังคับให้ browser ทุกเครื่องโหลด `app.js` ใหม่ ป้องกัน cache เก่าค้างอยู่

---

## 2. App Version (APP_VER) — Semantic Versioning

`APP_VER` ใน `app.js` ใช้รูปแบบ `x.y.z` (Semantic Versioning)

**กฎ**: ทุกครั้งที่ได้รับ prompt แก้ไขจาก user ให้บวก patch version +0.0.1 เสมอ

**Carry-over rule**:
- `z` ถึง 9 แล้วมีการแก้ไข → `z` reset เป็น 0, `y` +1
- เช่น `0.1.9` → `0.2.0`
- `y` ถึง 9 แล้วมีการแก้ไข → `y` reset เป็น 0, `x` +1
- เช่น `0.9.9` → `1.0.0`

**Version ปัจจุบัน: `0.1.0`**

ตัวอย่าง:
- แก้ครั้งที่ 1: `0.1.0` → `0.1.1`
- แก้ครั้งที่ 2: `0.1.1` → `0.1.2`
- แก้ครั้งที่ 10 (จาก `0.1.9`): `0.1.9` → `0.2.0`

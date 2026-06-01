# Implementation Plan

## Overview

แผนการ implement Aurora Mesh Gradient แทนพื้นหลัง orb ของ hero ทั้งระบบ
งานส่วนใหญ่อยู่ที่ `styles.css` (CSS ล้วน) มีงาน optional ที่ `app.js` (ลด DOM) และงาน versioning ปิดท้าย
แต่ละ task เล็ก ทดสอบได้ด้วย visual verification ในเบราว์เซอร์

## Tasks

- [x] 1. แทนกฎ orb ของ hero หลักด้วย aurora gradient layer
  - แก้ `.hero-mesh` (styles.css ~บรรทัด 64) ให้วาด `radial-gradient` หลายชั้นจาก `--heroGlass1/2/Br`
  - เพิ่ม `@keyframes auroraShift` (เคลื่อนช้า 26s ease-in-out)
  - ตั้ง `.hero-mesh .orb{display:none}` และ `.hero-mesh::after{display:none}` (ปิด orb เดิมโดยไม่แก้ markup)
  - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 3.1_

- [x] 2. ขยาย aurora ไปยัง day-hero และ insight card ให้สม่ำเสมอ
  - รวม `.dh-mesh, .ic-mesh` เข้ากฎ aurora เดียวกัน (styles.css ~บรรทัด 426)
  - ตั้ง `.dh-mesh .orb, .ic-mesh .orb{display:none}`
  - _Requirements: 1.3_

- [x] 3. ปรับ state neg ให้คงโทนแดงเตือน
  - เพิ่มกฎ `.hero.neg .hero-mesh` ใช้ aurora โทนขาว/แดงอ่อน (ไม่ใช้สี accent)
  - คง `.hero.neg` gradient + `heroGrad`/`heroSheen` เดิม
  - _Requirements: 2.4, 4.4_

- [x] 4. เอา conic spin / micro orb เก่าออก
  - แก้ `.hero.pos::after` (styles.css ~บรรทัด 2224) ลบ `conic-gradient` + `animation:meshSpin` → เหลือ specular นิ่ง
  - เลิกใช้ `@keyframes meshSpin`, `.hero.pos .hero-mesh .orb:nth-child(1){filter}`, `.hero.pos .hero-mesh::after{orbFloat}`
  - _Requirements: 1.2_

- [x] 5. เพิ่ม reduced-motion safety
  - ใน `@media (prefers-reduced-motion: reduce)` (styles.css ~บรรทัด 2196) เพิ่ม `.hero-mesh,.dh-mesh,.ic-mesh{animation:none}` และ `.hero.pos::after,.hero.neg::before{animation:none}`
  - _Requirements: 3.2_

- [ ] 6. (optional) ลด orb DOM ใน app.js — ข้าม (orb ถูกซ่อนด้วย CSS `display:none` แล้ว ลดความเสี่ยง regression)
  - ถ้าต้องการลด DOM: ลบ `<div class="orb"></div>×3` ใน `heroH()`, `.ic-mesh`, `.dh-mesh`
  - ถ้าแก้ `app.js` → bump `APP_VER` +0.0.1
  - _Requirements: 1.2, 5.1_

- [x] 7. Versioning + cache-bust
  - อัปเดต cache-busting query string ของ `app.js` ใน `index.html` (→ `?v=20260601e`)
  - bump `APP_VER` → `0.2.8`
  - _Requirements: 5.1, 5.2_

- [x] 8. Verify ทุก acceptance criteria
  - `node --check app.js` ผ่าน, CSS braces balanced
  - aurora ผูก `--heroGlass*` ทุกธีม, ไม่เหลือ orbFloat/meshSpin, neg คงโทนแดง, reduced-motion ครอบคลุม
  - แนะนำผู้ใช้ตรวจ visual ทั้ง 7 ธีม + Monthly/Daily/Yearly ในเบราว์เซอร์
  - _Requirements: 1, 2, 3, 4, 5_

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "description": "ฐาน aurora สำหรับ hero หลัก" },
    { "wave": 2, "tasks": ["2", "3", "4", "5", "6"], "description": "ขยาย/ปรับ aurora และเอา animation เก่าออก (ขนานกันได้)" },
    { "wave": 3, "tasks": ["7"], "description": "versioning + cache-bust หลังแก้ไฟล์ครบ" },
    { "wave": 4, "tasks": ["8"], "description": "verify ทุก acceptance criteria" }
  ]
}
```

แผนผังแบบอ่านง่าย:

```
Task 1 (aurora hero หลัก)
  ├─→ Task 2 (ขยาย day-hero/insight)
  ├─→ Task 3 (neg state)
  ├─→ Task 4 (เอา spin/orb เก่าออก)
  └─→ Task 5 (reduced-motion)
        │
Task 6 (optional: ลด DOM) ──┐
                            ├─→ Task 7 (versioning + cache-bust)
Task 2,3,4,5 ───────────────┘        │
                                     └─→ Task 8 (verify ทั้งหมด)
```

- Task 1 เป็นฐาน ต้องทำก่อน 2-5
- Task 2-5 ทำขนานกันได้หลัง Task 1
- Task 6 optional ทำได้อิสระ
- Task 7 ตามหลังงานที่แก้ไฟล์ทั้งหมด
- Task 8 ปิดท้าย verify

## Notes

- งานหลักเป็น CSS ล้วน — ถ้าไม่ทำ Task 6 (optional) ก็ไม่ต้อง bump `APP_VER` แต่ยังต้อง cache-bust `index.html` (Task 7)
- ทดสอบครบทั้ง 7 ธีม เพราะ aurora ผูกกับ `--heroGlass*` ต่อธีม
- ระวังกฎ override เดิมที่ใช้ `!important` (บรรทัด ~2224) — กฎใหม่ต้องชนะหรือแก้ที่เดิมโดยตรง
- โปรเจกต์ไม่มี automated UI test — ใช้ manual visual verification ตาม Task 8

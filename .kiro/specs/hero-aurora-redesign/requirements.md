# Requirements Document

## Introduction

ปัจจุบัน hero card (กล่องแสดงเงินคงเหลือด้านบนของแต่ละหน้า) ใช้ background เป็น
"orb เบลอ 3 ลูกที่ลอยไปลอยมา" (`.hero-mesh .orb` + `orbFloat` animation) ร่วมกับ diagonal sheen
ที่พาดผ่านการ์ด ซึ่งผู้ใช้รู้สึกว่าไม่สอดคล้องกับภาษา liquid-glass / minimal ของเว็บโดยรวม
(โดยเฉพาะหลังปรับ nav bar และ `.sec` cards เป็น frosted glass)

Feature นี้จะ redesign พื้นหลังของ hero ใหม่เป็น **Aurora Mesh Gradient** — gradient ไล่เฉดสีนุ่ม
แบบ aurora ที่นิ่งหรือเคลื่อนช้ามากจนไม่รบกวนสายตา ใช้สี accent ของแต่ละธีม
และต้องใช้กับทุกหน้าที่มี hero (Monthly, Daily, Yearly) อย่างสม่ำเสมอ

**ขอบเขต (Scope)**

- **In scope**: พื้นหลังของ `.hero` (ทั้ง state `pos` เงินบวก และ `neg` เงินติดลบ), การปรับ/ลบ `.hero-mesh .orb`,
  Aurora gradient ที่ผูกกับตัวแปรธีม, การเคลื่อนไหว (หรือความนิ่ง) ของพื้นหลัง, รองรับ `prefers-reduced-motion`
- **Out of scope**: โครงสร้างข้อมูลภายใน hero (ตัวเลข `hero-v`, `hero-row`, `hero-chip`, count-up tween),
  ตำแหน่ง/ลำดับของ hero ในแต่ละหน้า, `.sim-head` ของหน้า Simulator (ใช้ component แยก),
  การเปลี่ยน logic การคำนวณเงิน

**ผู้มีส่วนเกี่ยวข้อง (Stakeholders)**

- **ผู้ใช้ทั่วไป (Thai users)**: เห็น hero ทุกครั้งที่เปิดแอป ต้องการ UI ที่สวย กลมกลืน อ่านตัวเลขง่าย
- **เจ้าของโปรเจกต์**: ต้องการให้ดีไซน์สอดคล้องกันทั้งเว็บ และทำงานได้ครบทุกธีม

## Glossary

- **Hero card (`.hero`)**: การ์ดด้านบนของแต่ละหน้าที่แสดงเงินคงเหลือ + รายรับ/รายจ่าย
- **Hero pos/neg state**: `.hero.pos` = เงินคงเหลือ ≥ 0 (พื้น glass สี accent), `.hero.neg` = ติดลบ (พื้นโทนแดง)
- **Orb (ขีด/วงลอย)**: element `.hero-mesh .orb` วงกลมเบลอ 3 ลูกที่เคลื่อนด้วย `@keyframes orbFloat` — ตัวที่จะถูกแทนที่
- **Aurora Mesh Gradient**: พื้นหลังแบบ gradient หลายจุดไล่เฉดนุ่มคล้ายแสงเหนือ ใช้แทน orb
- **Theme accent variables**: `--ac`, `--ac2`, `--heroGlass1`, `--heroGlass2`, `--heroDrop`, `--heroPosFg` ฯลฯ ที่เปลี่ยนตามธีม
- **Views ที่ใช้ hero**: Monthly (`rMonth`), Daily (`rDaily`), Yearly (`rYear`) ผ่านฟังก์ชัน `heroH()`

## Requirements

### Requirement 1: แทนที่พื้นหลัง orb ด้วย Aurora Mesh Gradient

**User Story:** ในฐานะผู้ใช้ ฉันต้องการให้พื้นหลัง hero เป็น aurora gradient ที่นุ่มนวลกลมกลืน
แทนที่ orb ลอยไปมา เพื่อให้หน้าตาสอดคล้องกับส่วนอื่นของแอป

#### Acceptance Criteria

1. WHEN hero ถูกแสดงผล THEN ระบบ SHALL แสดงพื้นหลังเป็น aurora mesh gradient (หลายจุดไล่เฉดสีนุ่ม) แทน orb เบลอ 3 ลูกแบบเดิม
2. WHEN เปรียบเทียบกับดีไซน์เดิม THEN ระบบ SHALL ไม่แสดง orb ที่ลอยไปมาแบบสุ่มทิศทาง (`orbFloat`) อีกต่อไป
3. WHERE hero อยู่ในหน้า Monthly, Daily, และ Yearly THE ระบบ SHALL ใช้พื้นหลัง aurora แบบเดียวกันอย่างสม่ำเสมอ
4. WHEN hero แสดงผล THEN aurora gradient SHALL อยู่หลังตัวเลขและข้อความ โดยไม่บดบังหรือลดความอ่านง่ายของ `hero-v`, `hero-lb`, `hero-row`

### Requirement 2: Aurora ผูกกับสีของแต่ละธีม

**User Story:** ในฐานะผู้ใช้ที่เปลี่ยนธีมได้ ฉันต้องการให้ aurora gradient เปลี่ยนสีตามธีมที่เลือก
เพื่อให้ hero เข้ากับ accent ของธีมนั้นๆ

#### Acceptance Criteria

1. WHEN ผู้ใช้เลือกธีมใดๆ (light, dark, rose, earth1, earth2, lego, cheese) THEN aurora gradient SHALL ใช้สีจากตัวแปรธีม (`--ac`, `--ac2`, `--heroGlass1/2` หรือใกล้เคียง) ไม่ใช่สี hardcode
2. WHEN ผู้ใช้สลับธีม THEN aurora SHALL อัปเดตสีให้ตรงกับธีมใหม่โดยไม่ต้อง reload
3. WHERE hero อยู่ใน state `pos` (เงินบวก) THE aurora SHALL ใช้โทนสี accent ของธีม
4. WHERE hero อยู่ใน state `neg` (เงินติดลบ) THE ระบบ SHALL คงโทนสีเตือน (แดง) ที่สื่อความหมายติดลบไว้ ไม่ถูกแทนด้วยสี accent

### Requirement 3: การเคลื่อนไหวที่นุ่มนวลและไม่รบกวน

**User Story:** ในฐานะผู้ใช้ ฉันต้องการให้พื้นหลัง hero ดูสงบ พรีเมียม ไม่มีอะไรวิ่งกวนสายตา
เพื่อให้โฟกัสที่ตัวเลขเงินได้

#### Acceptance Criteria

1. WHEN hero แสดงผล THEN aurora SHALL อยู่นิ่งหรือเคลื่อนช้ามาก (ไล่เฉดแบบ subtle) โดยไม่มีการเคลื่อนที่แบบสุ่มทิศทางที่สังเกตเห็นชัด
2. IF ผู้ใช้เปิด `prefers-reduced-motion: reduce` THEN ระบบ SHALL หยุด animation พื้นหลัง hero ทั้งหมด (แสดง gradient แบบนิ่ง)
3. WHEN hero ปรากฏครั้งแรก (render) THEN ระบบ SHALL คง entrance animation เดิม (`fadeUp`) ไว้ได้

### Requirement 4: รักษาพฤติกรรมและโครงสร้างเดิม (Preservation)

**User Story:** ในฐานะเจ้าของโปรเจกต์ ฉันต้องการให้การ redesign ครั้งนี้ไม่กระทบฟังก์ชันและโครงสร้างอื่นของ hero
เพื่อไม่ให้เกิด regression

#### Acceptance Criteria

1. WHEN hero แสดงผล THEN โครงสร้าง DOM ของ `hero-v`, `hero-lb`, `hero-row`, `hero-s`, `hero-chip` SHALL ยังคงเดิมและทำงานปกติ
2. WHEN ยอดเงินเปลี่ยน THEN count-up tween (`data-tween-*`) SHALL ยังทำงานเหมือนเดิม
3. WHEN เปิด privacy toggle (`body.hide-amt`) THEN การเบลอตัวเลขใน hero SHALL ยังทำงานเหมือนเดิม
4. WHERE hero อยู่ใน state `neg` THE การแสดงผลโทนแดง + text-shadow glow SHALL ยังคงสื่อความหมายติดลบได้ชัดเจน
5. WHEN ดูบนจอมือถือ (max-width 500px) THEN hero SHALL ยัง responsive และ layout ไม่แตก
6. THE ระบบ SHALL ไม่เปลี่ยน `.sim-head` ของหน้า Simulator (อยู่นอกขอบเขต)

### Requirement 5: Versioning ตาม steering rule

**User Story:** ในฐานะเจ้าของโปรเจกต์ ฉันต้องการให้ทุกการแก้ไขเป็นไปตามกฎ versioning ที่กำหนด

#### Acceptance Criteria

1. WHEN มีการแก้ไข `app.js` THEN ระบบ SHALL bump `APP_VER` (+0.0.1) และอัปเดต cache-busting query string ใน `index.html` พร้อมกัน
2. IF การแก้ไขอยู่ที่ `styles.css`/`index.html` เท่านั้น THEN ระบบ SHALL อัปเดต cache-busting query string ใน `index.html` เพื่อบังคับโหลด asset ใหม่

## Decision Notes

- เลือกแนวทาง **Aurora Mesh Gradient** จากตัวเลือกที่เสนอ (เหนือ Frosted Glass, Spotlight, Animated Number, Status-Reactive)
- คงระบบ pos/neg เดิมไว้ เพราะสื่อความหมายสถานะการเงินได้ดีอยู่แล้ว
- ใช้ตัวแปรธีมที่มีอยู่แล้ว (`--heroGlass1/2`, `--ac`, `--ac2`) เพื่อให้รองรับทุกธีมโดยไม่ต้องเพิ่ม token ใหม่มาก

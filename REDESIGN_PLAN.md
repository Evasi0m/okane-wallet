# Okane Wallet — แผนปรับปรุง UI ใหม่ทั้งหมด (Mobile Web App)

> เป้าหมาย: ยกเครื่อง UI ทุกหน้าให้เป็น mobile web app ที่สมบูรณ์ ใช้งานง่าย ลดจำนวนการ scroll/tap ในงานที่ทำบ่อย และเพิ่ม feature ใหม่ที่เพิ่มคุณค่าจริง โดยไม่ทำลาย data model เดิม (`okane_v3`) และ Supabase sync ที่มีอยู่

---

## 0. สภาพปัจจุบัน (สรุปจากโค้ด)

- ไฟล์เดียวก้อนใหญ่: `index.html` (~625KB), `app.js` (~277KB), `styles.css` (~212KB) — vanilla JS, ไม่มี framework
- Navigation: bottom nav 5 ช่อง — `รายวัน (d)` / `รายเดือน (m)` / `[FAB +]` / `รายปี (y)` / `จำลอง (sim)`
- FAB กลางจอเปิด `openQuickAdd()` (บันทึกรายจ่ายรายวัน)
- รายรับเพิ่มเติมเปิดผ่าน popup `openIncomePopup()`; ปุ่มเพิ่มอยู่ **ท้าย list** ที่ยาวขึ้นเรื่อยๆ → ต้อง scroll หา (ปัญหาที่ผู้ใช้ยกมา)
- Surfaces หลักที่มีอยู่: Daily, Monthly, Yearly, Simulator, Savings, Settings, Category detail, Shopee, Thai Chueay Thai (60/40), Goals, Recurring, Wallets, Themes (9 ธีม), PIN lock, Privacy blur, Guest mode

---

## 1. หลักการออกแบบ (Design Principles)

1. **ปุ่มที่ใช้บ่อยต้องเอื้อมถึงด้วยนิ้วโป้งเสมอ** — ไม่ต้อง scroll หา action หลัก (thumb-zone first)
2. **1 งานที่ทำบ่อย = ≤ 2 tap** — เพิ่มรายรับ/รายจ่าย ต้องเร็วและซ้ำได้ทันที
3. **Sheet มาตรฐานเดียว** — ทุก popup/modal ใช้ bottom sheet ที่มี header ติดบน + action bar ติดล่างเสมอ (ปุ่มยืนยันไม่หนีไปตาม content)
4. **สอดคล้องทั้งแอป** — spacing scale, radius, typography, สีสถานะ (บวก/ลบ/เตือน) ชุดเดียวใช้ทุกหน้า
5. **Native feel บนเว็บ** — safe-area (notch/home-bar), momentum scroll, haptic-like feedback, ไม่มี layout กระตุก, รองรับ dark/light + 9 ธีมเดิม
6. **ไม่พังของเดิม** — data model, sync, migration คงเดิม; ปรับที่ layer การแสดงผลและ interaction

---

## 2. Global / Navigation

### 2.1 Bottom Nav + FAB
- คงโครง 5 ช่อง + FAB กลาง แต่ทำให้ **FAB เป็น context-aware**:
  - อยู่หน้า **รายวัน** → กด = เพิ่มรายจ่าย (เดิม)
  - อยู่หน้า **รายเดือน** → กด = เปิด action sheet เล็ก: `เพิ่มรายจ่าย / เพิ่มรายรับ / ตั้งงบหมวด`
- **Long-press FAB** = เมนูลัดเลือกชนิดรายการโดยตรง (รายจ่าย/รายรับ/โอนเข้าเงินออม)
- Active tab: ใช้ indicator เลื่อนลื่น (มี animation `nav-*` อยู่แล้ว) + label ชัดเจน

### 2.2 Global fixes
- ทุก sheet: `header` (title + ปิด) ติดบน, `content` scroll ตรงกลาง, `action bar` ติดล่างด้วย `position: sticky; bottom: 0` + padding `env(safe-area-inset-bottom)`
- Toast/Undo (`showUndo`) ยกขึ้นเหนือ nav ให้ไม่โดนบัง
- เพิ่ม pull-to-refresh (sync) บนหน้า list

---

## 3. ปรับปรุงรายหน้า (Screen-by-Screen)

### 3.1 หน้าเพิ่มรายรับ (`openIncomePopup`) — แก้ปัญหาหลักที่ผู้ใช้ยกมา
ปัญหา: ปุ่มเพิ่มอยู่ท้าย list, พอรายการเยอะต้อง scroll ยาว

แนวแก้:
1. **ปุ่ม "เพิ่มรายรับ" แบบ sticky** — ย้ายปุ่มไปไว้ที่ action bar ติดล่างของ sheet เสมอ (ไม่ลอยตามความยาว list) + มี FAB เล็กมุมขวาบนของ list ด้วย
2. **โหมด "เพิ่มรัวๆ" (Add-another)** — หลังกดบันทึก ให้ toggle "เพิ่มต่อ" ค้าง form ไว้, เคลียร์ค่า, focus ช่องจำนวนเงินทันที → เพิ่มหลายรายการโดยไม่ปิด-เปิดซ้ำ
3. **รายการล่าสุดอยู่บนสุด** (reverse order) + ช่องค้นหา/รวมยอดด้านบน
4. **Quick chips** ที่มาของรายรับที่ใช้บ่อย (โบนัส/งานเสริม/ดอกเบี้ย/คืนเงิน) กดแล้วเติมชื่อให้อัตโนมัติ
5. รวมยอดรายรับเพิ่มเติมของเดือนโชว์ติดบนตลอด

### 3.2 Quick Add รายจ่าย (`openQuickAdd`)
- Numpad ในตัว (ไม่พึ่ง keyboard ระบบล้วน) เพื่อกรอกเลขเร็ว + ปุ่ม `+ - ×` คิดเลขในช่อง
- หมวดหมู่เป็น grid ไอคอนใหญ่ กด 1 ที = เลือก, หมวดที่ใช้บ่อยลอยขึ้นบน
- toggle "บันทึกแล้วเพิ่มต่อ" เหมือนรายรับ
- จำ wallet/หมวดล่าสุด (มี `getLastWallet` อยู่แล้ว — ต่อยอด)

### 3.3 หน้ารายเดือน (Monthly)
- โครงใหม่แบบการ์ด: **สรุปยอดด้านบน** (คงเหลือ/ใช้ไป/รายรับ) แบบ hero card + progress ring
- แต่ละหมวดเป็นแถวมี progress bar + แตะเพื่อแก้งบทันที (inline) ไม่ต้องเข้า popup
- Section รายรับ/งบ/recurring แยกชัด, ปุ่มเพิ่มของแต่ละ section เป็น sticky ต่อ section
- ปุ่ม "คัดลอกไปเดือนอื่น" (`apAll`) ให้เลือกเดือนปลายทางแบบ multi-select แทน copy ทั้งปี

### 3.4 หน้ารายวัน (Daily)
- Timeline จัดกลุ่มตามวัน, header วันแบบ sticky
- ยอดรวมวันนี้ลอยบนสุด, swipe แถวเพื่อ แก้ไข/ลบ (มี undo อยู่แล้ว)
- Empty state ปัจจุบันดีอยู่ — คงไว้แต่ทำ CTA เด่นขึ้น

### 3.5 หน้ารายปี (Yearly)
- กราฟ 12 เดือน + สรุป YoY, แตะเดือนเพื่อกระโดดไปหน้ารายเดือนนั้น
- เพิ่มตัวสลับ: รายรับ / รายจ่าย / เงินออม สะสม

### 3.6 หน้าจำลอง (Simulator)
- Slider ปรับสมมติฐาน (รายรับ +%, ลดค่าใช้จ่ายหมวด X) เห็นผลกราฟทันที
- บันทึก scenario ไว้เทียบได้

### 3.7 เงินออม & เป้าหมาย (Savings / Goals)
- Progress ring ต่อเป้าหมาย + วันที่คาดว่าถึงเป้า (คำนวณจากอัตราปัจจุบัน)
- ปุ่มฝาก/ถอน เป็น sticky action bar

### 3.8 Settings
- จัดกลุ่มใหม่เป็น section การ์ด: บัญชี & Sync / ธีม & การแสดงผล / หมวดหมู่ & Wallet / ความปลอดภัย (PIN, Privacy) / รายการประจำ & เป้าหมาย / ข้อมูล (export/reset)
- Search ในหน้า settings

---

## 4. Feature ใหม่ที่เสนอ

1. **Recurring อัตโนมัติ + แจ้งเตือน** — รายการประจำลงบัญชีเองต้นเดือน + badge เตือนบิลใกล้ครบกำหนด
2. **Budget alert** — เตือนเมื่อหมวดใกล้/เกินงบ (progress bar เปลี่ยนสีส้ม→แดง)
3. **Search & Filter ทั่วแอป** — ค้นหารายการข้ามเดือนตามคำ/หมวด/wallet/ช่วงเงิน
4. **Insights ที่ actionable** — "เดือนนี้ใช้หมวดกาแฟเกิน 30% เทียบเดือนก่อน", วันที่ใช้จ่ายหนักสุด, แนวโน้มคงเหลือปลายเดือน (มี insight เดิมอยู่ ต่อยอด)
5. **Template รายการด่วน** — บันทึกชุดรายการที่ทำซ้ำ (เช่น "ค่าเดินทางไปทำงาน") กดปุ่มเดียวลงบัญชี
6. **โหมดเพิ่มเร็วจาก home screen** — PWA shortcut ใน `manifest.json` → เปิดแอปพร้อม quick-add ทันที
7. **Export CSV/แชร์สรุปเดือน** — แชร์รูปสรุปเดือนหรือดาวน์โหลด CSV
8. **Widget สรุป (in-app)** — การ์ดคงเหลือวันนี้/เดือนนี้ปักบนสุดของทุกหน้า
9. **หลายสกุลเงิน (optional)** — เผื่ออนาคต, เก็บ currency ต่อ wallet

---

## 5. Design System (สร้างเป็น token)

- **Spacing scale**: 4/8/12/16/24/32
- **Radius**: card 16, sheet 24 (มุมบน), chip 999
- **Typography**: display / title / body / caption + ตัวเลขเงินใช้ tabular-nums
- **สีสถานะ**: รายรับ (เขียว), รายจ่าย (แดง/เทา), เตือน (ส้ม) — 1 ชุด map เข้าทุก 9 ธีม
- **Component มาตรฐาน**: `Sheet`, `ActionBar`, `Card`, `ListRow (swipeable)`, `ProgressBar/Ring`, `Chip`, `Numpad`, `EmptyState`, `Toast`
- ทำเป็น CSS variables + helper JS สร้าง markup ซ้ำได้ (ลดโค้ด HTML ยัดใน string)

---

## 6. แผนลงมือ (Phases)

| Phase | ขอบเขต | ผลลัพธ์ |
|-------|--------|---------|
| **0** | ตั้ง design tokens + component `Sheet`/`ActionBar` มาตรฐาน | ฐานที่ทุกหน้าใช้ร่วม |
| **1** | แก้หน้าเพิ่มรายรับ (sticky add + add-another) + Quick Add numpad | แก้ pain point หลักทันที |
| **2** | Monthly redesign (hero card, inline budget edit) | หน้าใช้บ่อยสุดดีขึ้น |
| **3** | Daily / Yearly / Simulator / Savings | ครบทุกหน้าหลัก |
| **4** | Settings จัดกลุ่มใหม่ + Search | จบ core UI |
| **5** | Feature ใหม่: Recurring auto, Budget alert, Template, Export | เพิ่มคุณค่า |

แต่ละ phase แยก commit/PR ได้ ทดสอบทีละส่วน ไม่กระทบ data/sync

---

## 7. เกณฑ์วัดผล (Success metrics)

- เพิ่มรายรับซ้ำ 5 รายการ: จากต้อง 5×(เปิด→scroll→กด→ปิด) เหลือ **เปิดครั้งเดียว + กดเพิ่มต่อ**
- action หลักทุกหน้าเอื้อมถึงในโซนนิ้วโป้ง ไม่ต้อง scroll
- ไม่มี layout shift ตอนเปิด sheet; ปุ่มยืนยันเห็นตลอด

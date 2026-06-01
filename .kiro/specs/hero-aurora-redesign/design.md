# Hero Aurora Redesign — Design

## Overview

เปลี่ยนพื้นหลังของ hero card จากระบบ "orb เบลอลอยไปมา" (`orbFloat`) เป็น **Aurora Mesh Gradient** —
พื้นหลังที่ประกอบจาก `radial-gradient` หลายจุดซ้อนกัน ไล่เฉดสี accent ของธีมแบบนุ่มนวล
เคลื่อนช้ามากแบบ subtle (หายใจเข้า-ออก) และหยุดสนิทเมื่อผู้ใช้เปิด `prefers-reduced-motion`

งานนี้เป็นการแก้ที่ชั้น CSS เป็นหลัก โดยใช้ตัวแปรธีมที่มีอยู่แล้ว (`--heroGlass1`, `--heroGlass2`,
`--heroGlassBr`, `--ac`, `--ac2`) จึงรองรับทุกธีมโดยอัตโนมัติ ส่วน markup ใน `app.js` มีการปรับเล็กน้อย
(ลด orb เหลือ layer เดียวหรือเปลี่ยน class) เพื่อให้โครงสร้างสะอาดและสอดคล้องกัน

## Goals / Non-Goals

**Goals**
- แทน orb floating ด้วย aurora gradient ที่นิ่ง/เคลื่อนช้า ใน `.hero`, `.dh-mesh` (day-hero), `.ic-mesh` (insight card)
- ผูกสี aurora กับตัวแปรธีม เพื่อรองรับ 7 ธีมโดยไม่ hardcode
- คงระบบ pos (accent) / neg (แดงเตือน) เดิม
- รองรับ `prefers-reduced-motion`

**Non-Goals**
- ไม่แตะ `.sim-head` ของหน้า Simulator
- ไม่เปลี่ยนโครงสร้างตัวเลข/tween/privacy blur
- ไม่เพิ่ม JS animation (ใช้ CSS ล้วน)

## Glossary

- **`.hero`**: hero หลักจาก `heroH()` ใช้ใน Monthly / Daily / Yearly
- **`.hero-mesh`**: container ของ orb ใน hero หลัก (มี `.orb` 3 ตัว + `::after` micro orb)
- **`.dh-mesh` / `.ic-mesh`**: mesh ของ day-hero card และ insight card (โครงสร้าง orb เหมือนกัน)
- **`orbFloat` / `meshSpin`**: keyframes เดิมที่ทำให้ orb ลอย/หมุน — จะถูกเลิกใช้กับ hero
- **`auroraShift`**: keyframe ใหม่ ขยับตำแหน่ง/ขนาด gradient ช้าๆ แบบ subtle
- **Aurora layer**: `.hero-mesh` (และ `.dh-mesh`, `.ic-mesh`) ที่เปลี่ยนเป็น `background: radial-gradient(...)` หลายชั้น

## Current State (ก่อนแก้)

อ้างอิงตำแหน่งใน `styles.css`:

- **บรรทัด ~64**: `.hero-mesh{...}` + `.hero-mesh .orb{...animation:orbFloat 14s...}` + orb nth-child 1/2/3
- **บรรทัด ~65**: `@keyframes orbFloat{...}`
- **บรรทัด ~426-429**: `.dh-mesh .orb,.ic-mesh .orb{...animation:orbFloat...}` + nth-child
- **บรรทัด ~2224**: `.hero.pos::after{...conic-gradient...animation:meshSpin 28s...}` + `@keyframes meshSpin`
- **บรรทัด ~2225**: `.hero.pos .hero-mesh .orb:nth-child(1){filter:blur(64px)}`
- **บรรทัด ~2227**: `.hero.pos .hero-mesh::after{...animation:orbFloat 19s...}` (micro orb)
- **`prefers-reduced-motion` block (~2196)**: ปัจจุบันไม่ได้ปิด orbFloat/meshSpin

อ้างอิง `app.js`:
- `heroH()` (~1360): สร้าง `<div class="hero-mesh"><div class="orb"></div>×3</div>`
- `rDaily` insight (~1413): `<div class="ic-mesh"><div class="orb"></div>×3</div>`
- (day-hero ใช้ `.dh-mesh` ในทำนองเดียวกัน)

## Architecture

แนวคิดหลัก: เปลี่ยน element mesh ให้ "เป็นพื้น aurora ในตัวเอง" แทนที่จะเป็น container ของ orb

```
.hero (pos/neg)
 ├─ .hero-mesh         ← เดิม: container orb | ใหม่: aurora gradient layer (z-index:0)
 │    └─ .orb × 3      ← เดิม: วงเบลอลอย     | ใหม่: ไม่จำเป็น (เก็บไว้ได้แต่ไม่แสดง หรือเอาออก)
 ├─ .hero-lb / .hero-v / .hero-row   ← คงเดิม (z-index:2)
 └─ ::before/::after   ← เดิม: specular + conic spin | ปรับ: คง specular, เอา spin ออก
```

**ทางเลือกที่เลือก**: คง element `.hero-mesh` ไว้ แล้วเปลี่ยน CSS ให้ `.hero-mesh` วาด aurora เอง
ส่วน `.orb` ตั้ง `display:none` (ไม่ต้องแก้ markup ใน `app.js` เยอะ ลดความเสี่ยง regression)

**เหตุผล**: แก้ที่ CSS จุดเดียว ครอบคลุมทุกหน้าที่ render mesh เดิม โดย markup เดิมยังใช้ได้
หากภายหลังต้องการลด DOM ค่อยถอด `.orb` ออกจาก `heroH()` ได้ (optional cleanup)

## Components and Interfaces

### 1. Aurora gradient layer (`.hero-mesh`, `.dh-mesh`, `.ic-mesh`)

แทนที่กฎ orb เดิม ด้วย:

```css
.hero-mesh, .dh-mesh, .ic-mesh{
  position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0;
  background:
    radial-gradient(60% 80% at 12% 8%,  rgb(var(--heroGlassBr) / .22) 0%, transparent 60%),
    radial-gradient(55% 75% at 88% 18%, rgb(var(--heroGlass1) / .30) 0%, transparent 62%),
    radial-gradient(70% 90% at 78% 92%, rgb(var(--heroGlass2) / .26) 0%, transparent 65%),
    radial-gradient(50% 70% at 20% 95%, rgb(var(--heroGlassBr) / .14) 0%, transparent 60%);
  background-size:160% 160%;
  filter:saturate(1.15);
  animation:auroraShift 26s ease-in-out infinite;
}
/* ปิด orb เดิม (ไม่ต้องแก้ markup) */
.hero-mesh .orb, .dh-mesh .orb, .ic-mesh .orb{ display:none !important; }
.hero-mesh::after{ display:none !important; } /* micro orb เดิม */
```

`@keyframes auroraShift` — เลื่อนตำแหน่ง gradient ช้าๆ แบบ subtle (ไม่ลอยแบบสุ่มทิศ):

```css
@keyframes auroraShift{
  0%,100%{ background-position:0% 0%, 100% 0%, 100% 100%, 0% 100%; }
  50%    { background-position:8% 6%, 92% 10%, 88% 94%, 6% 96%; }
}
```

> ค่า rgb ใช้ space-separated form (`rgb(var(--x) / .30)`) ซึ่งโปรเจกต์ใช้อยู่แล้ว
> ตัวแปร `--heroGlass1/2/Br` มีครบทุกธีม → aurora เปลี่ยนสีตามธีมอัตโนมัติ (Req 2.1, 2.2)

### 2. State neg (เงินติดลบ) — คงโทนแดง

`.hero.neg` มี background gradient แดงของตัวเอง (บรรทัด ~62) อยู่แล้ว
สำหรับ aurora ใน neg ให้ใช้โทนขาว/แดงอ่อนเพื่อไม่ให้ขัดกับพื้นแดง:

```css
.hero.neg .hero-mesh{
  background:
    radial-gradient(60% 80% at 14% 10%, rgba(255,255,255,.16) 0%, transparent 60%),
    radial-gradient(60% 80% at 86% 16%, rgba(255,200,200,.20) 0%, transparent 62%),
    radial-gradient(70% 90% at 80% 92%, rgba(255,140,140,.16) 0%, transparent 65%);
  background-size:160% 160%;
  animation:auroraShift 30s ease-in-out infinite;
}
```

คง `.hero.neg` gradient/`heroGrad`/`heroSheen` เดิมไว้ (Req 2.4, 4.4)

### 3. เอา conic spin ออก (บรรทัด ~2224)

```css
/* ก่อน: .hero.pos::after{...conic-gradient...animation:meshSpin 28s...} */
/* หลัง: ลดเหลือ specular นิ่ง ไม่หมุน */
.hero.pos::after{
  background:linear-gradient(205deg,rgba(255,255,255,.12) 0%,transparent 45%,rgb(0 0 0 / .08) 100%) !important;
  animation:none !important;
}
```

ลบ/เลิกใช้ `@keyframes meshSpin`, `.hero.pos .hero-mesh .orb:nth-child(1){filter...}`,
`.hero.pos .hero-mesh::after{...orbFloat...}` (Req 1.2)

### 4. Reduced motion (Req 3.2)

เพิ่มใน `@media (prefers-reduced-motion: reduce)`:

```css
@media (prefers-reduced-motion: reduce){
  .hero-mesh, .dh-mesh, .ic-mesh{ animation:none !important; }
  .hero.pos::after, .hero.neg::before{ animation:none !important; }
}
```

### 5. คงพฤติกรรมเดิม (Req 4)

- `.hero-lb / .hero-v / .hero-row / .hero-s / .hero-chip` (z-index:2) → ไม่แตะ
- `data-tween-*` count-up → ไม่แตะ (อยู่ใน JS แยก)
- `body.hide-amt .hero-v` blur → ไม่แตะ
- entrance `fadeUp` ที่ `.hero` → ไม่แตะ (Req 3.3)
- `.sim-head` → ไม่แตะ (Req 4.6)

### 6. Markup (`app.js`) — optional

ไม่บังคับแก้ เพราะ `.orb` ถูก `display:none` แล้ว แต่ถ้าต้องการลด DOM:
- `heroH()`: เปลี่ยน `<div class="hero-mesh"><div class="orb"></div>×3</div>` → `<div class="hero-mesh"></div>`
- insight/day-hero: ลบ `<div class="orb"></div>×3` ภายใน `.ic-mesh`/`.dh-mesh`

> ถ้าแก้ `app.js` ต้อง bump `APP_VER` + cache-bust (Req 5.1)
> ถ้าแก้แค่ `styles.css`/`index.html` → อัปเดต cache-bust อย่างเดียว (Req 5.2)

## Design Decisions

| Decision | เหตุผล | ทางเลือกที่ไม่เลือก |
|---|---|---|
| ใช้ `radial-gradient` 3-4 จุดซ้อน | ได้ aurora นุ่มลึก ไม่ต้องใช้ orb DOM | conic-gradient หมุน (ดูเป็น "spin" เกินไป) |
| `display:none` กับ `.orb` แทนลบ markup | ลดความเสี่ยง regression, แก้ CSS จุดเดียว | ลบ DOM ทันที (ต้องแก้ JS หลายจุด) |
| animation 26-30s ease-in-out | subtle จนแทบไม่รู้สึก (Req 3.1) | นิ่งสนิท (ขาดมิติ glass) |
| ใช้ `--heroGlass1/2/Br` | มีครบทุกธีมแล้ว | เพิ่ม token aurora ใหม่ (ซ้ำซ้อน) |

## Data Models

Feature นี้เป็นงาน presentation ล้วน ไม่มี data model ใหม่ ไม่แตะ store (`okane_v3`)
อาศัย **CSS custom properties (ตัวแปรธีม)** ที่มีอยู่แล้วเป็น "interface" ของสี:

| ตัวแปร | ความหมาย | ใช้ใน aurora |
|---|---|---|
| `--heroGlass1` | RGB triplet สี accent โทนสว่าง (space-separated) | จุด gradient หลัก |
| `--heroGlass2` | RGB triplet สี accent โทนเข้ม | จุด gradient รอง |
| `--heroGlassBr` | RGB triplet โทนไฮไลต์ (มักเป็น 255 255 255) | จุดไฮไลต์ |
| `--heroDrop` | RGB triplet เงา drop ของ hero | (คงเดิม ไม่แก้) |
| `--ac`, `--ac2` | สี accent หลัก/รอง (hex) | สำรองถ้าต้องการ |

ทุกธีม (light, dark, rose, earth1, earth2, lego, cheese) define ตัวแปรเหล่านี้ครบแล้ว
จึงไม่ต้องเพิ่ม data/token ใหม่ การสลับธีมเปลี่ยน `data-theme` → ตัวแปรเปลี่ยน → aurora เปลี่ยนสีทันที

## Correctness Properties

### Property 1: Theme-bound color (Req 2)
_For any_ ธีม T ใน {light, dark, rose, earth1, earth2, lego, cheese},
เมื่อ `data-theme=T` aurora ของ `.hero.pos` SHALL ใช้ค่าจาก `--heroGlass*` ของ T เท่านั้น
(ไม่มีสี hex hardcode ในกฎ aurora ของ pos)

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Neg state preserves warning tone (Req 2.4, 4.4)
_For any_ render ที่ `.hero` มี class `neg`, พื้นหลังหลัก SHALL ยังเป็นโทนแดงเดิม
และ aurora overlay SHALL ไม่ใช่สี accent ของธีม

**Validates: Requirements 2.4, 4.4**

### Property 3: No floating orbs (Req 1.2)
_For all_ hero/day-hero/insight cards, SHALL ไม่มี element ที่เคลื่อนด้วย `orbFloat` หรือ `meshSpin` ที่มองเห็นได้

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 4: Motion preference (Req 3.2)
_If_ `prefers-reduced-motion: reduce` เป็นจริง _then_ `auroraShift` และ animation พื้นหลัง hero ทั้งหมด SHALL เป็น `none`

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 5: Structural preservation (Req 4.1-4.3)
DOM ของ `hero-v/hero-lb/hero-row/hero-chip`, count-up tween, และ `body.hide-amt` blur
SHALL เหมือนเดิมทุกประการหลังแก้

**Validates: Requirements 4.1, 4.2, 4.3, 4.5, 4.6**

## Error Handling

- **ตัวแปรธีมหาย / browser ไม่รองรับ space-separated rgb**: ระบบใช้ฟอร์แมตนี้อยู่แล้วทั่วทั้ง hero ปัจจุบัน
  (เช่น `.hero.pos` background) จึงถือว่า baseline browser รองรับ — ถ้า fallback จำเป็น ใช้สีพื้น `--card`/`--ac` แทน
- **CSS เก่าค้างจาก service worker**: บังคับโหลดใหม่ด้วย cache-bust query string ใน `index.html`
- **กฎ override เดิมที่ `!important`**: กฎ aurora ใหม่ต้องชนะด้วย `!important` หรือแก้กฎเดิมที่บรรทัด ~2224 โดยตรง
  เพื่อไม่ให้ conic spin เดิมหลงเหลือ



- **ความเสี่ยง**: aurora จางเกินจน hero ดูแบนในบางธีม (เช่น light) → **แก้**: ปรับ opacity stops ต่อธีมถ้าจำเป็น (ทดสอบทั้ง 7 ธีม)
- **ความเสี่ยง**: service worker cache CSS เก่า → **แก้**: cache-bust query string (Req 5)
- **ความเสี่ยง**: กฎ override เก่าที่บรรทัด ~2224 ใช้ `!important` → **แก้**: ใช้ `!important` ในกฎใหม่หรือแก้ที่กฎเดิมโดยตรง

## Testing Strategy

ไม่มี automated UI test ในโปรเจกต์ — ใช้ manual visual verification:

1. **ทุกธีม (7 ธีม)**: เปิดหน้า Monthly → ตรวจว่า aurora เปลี่ยนสีตามธีม, ไม่มี orb ลอย, ตัวเลขอ่านชัด
2. **ทุกหน้า**: Monthly / Daily / Yearly → hero ใช้ aurora สม่ำเสมอ (Req 1.3); insight card + day-hero ไม่มี orb ลอย
3. **State neg**: ทำให้เงินติดลบ → คงโทนแดงเตือน, aurora ไม่กลายเป็นสี accent (Req 2.4)
4. **Reduced motion**: เปิด OS reduce-motion → aurora หยุดนิ่ง (Req 3.2)
5. **Privacy**: กดปิดตา → ตัวเลข hero เบลอเหมือนเดิม (Req 4.3)
6. **Responsive**: จอ ≤500px → layout ไม่แตก (Req 4.5)
7. **Simulator**: `.sim-head` ไม่เปลี่ยน (Req 4.6)
8. **Verify**: `node --check app.js` ผ่าน (ถ้าแก้ JS), version + cache-bust อัปเดต (Req 5)

## Traceability

| Requirement | จุดที่ออกแบบรองรับ |
|---|---|
| 1.1, 1.2, 1.3, 1.4 | §1 aurora layer + §3 เอา spin/orb ออก |
| 2.1, 2.2, 2.3 | §1 ใช้ `--heroGlass*` |
| 2.4 | §2 neg คงโทนแดง |
| 3.1 | §1 `auroraShift` 26-30s subtle |
| 3.2 | §4 reduced-motion |
| 3.3 | §5 คง `fadeUp` |
| 4.1-4.6 | §5 preservation |
| 5.1, 5.2 | §6 versioning note |

# Auto Sync on Data Change — Bugfix Design

## Overview

ระบบ sync ข้อมูลกับ Google Drive ไม่ทำงานอัตโนมัติเมื่อ OAuth2 access token หมดอายุ (อายุ 1 ชั่วโมง)
ทำให้ข้อมูลที่บันทึกบน Device A ค้างอยู่ใน localStorage โดยไม่ถูก push ขึ้น Drive
และเมื่อ login บน Device B จะได้รับข้อมูลเก่า

แนวทางแก้ไข: เพิ่ม pending sync flag + silent token refresh trigger ใน `queueSync()`,
เพิ่ม 401 detection + retry ใน `driveSync()`, flush pending sync ใน `finishAuth()`,
เพิ่ม proactive token refresh timer ทุก ~50 นาที และเพิ่ม sync status indicator ใน UI

## Glossary

- **Bug_Condition (C)**: เงื่อนไขที่ทำให้ sync ล้มเหลวเงียบๆ — เมื่อ user ไม่ใช่ guest แต่ไม่มี access token หรือ token หมดอายุ
- **Property (P)**: พฤติกรรมที่ถูกต้อง — ระบบต้องตั้ง `_syncPending=true` และ trigger silent refresh แทนที่จะ return เงียบๆ
- **Preservation**: พฤติกรรมเดิมที่ต้องไม่เปลี่ยน — sync ปกติเมื่อมี token, manual sync, guest mode, poll sync
- **`queueSync(immediate)`**: ฟังก์ชันใน `app.js` ที่ตัดสินใจว่าจะ sync ทันทีหรือ debounce 1.5 วินาที
- **`driveSync()`**: ฟังก์ชันใน `app.js` ที่ทำการ upload ข้อมูลขึ้น Google Drive จริงๆ
- **`finishAuth(syncLocal)`**: ฟังก์ชันใน `app.js` ที่เรียกหลังได้ token ใหม่ — ตั้งค่า session และ render
- **`startSilentAuthRefresh()`**: ฟังก์ชันใน `app.js` ที่ขอ token ใหม่แบบ silent (prompt:'none')
- **`_syncPending`**: boolean flag ที่บอกว่ามี sync รอดำเนินการอยู่
- **`_authRefreshStarted`**: boolean flag ป้องกัน silent refresh ซ้ำซ้อน

## Bug Details

### Bug Condition

Bug เกิดขึ้นเมื่อ user ไม่ใช่ guest แต่ไม่มี access token (หมดอายุหรือยังไม่ได้รับ)
`queueSync()` มีเงื่อนไข `if(isGuest||!accessToken)return` ที่ทำให้ skip sync เงียบๆ
โดยไม่มีการ mark pending หรือ trigger refresh ใดๆ

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type SyncAttempt {
    isGuest: boolean,
    hasAccessToken: boolean,
    tokenExpired: boolean
  }
  OUTPUT: boolean

  RETURN (NOT X.isGuest)
         AND (NOT X.hasAccessToken OR X.tokenExpired)
END FUNCTION
```

### Examples

- **Device A บันทึกค่าใช้จ่ายหลังแอปเปิดค้าง 1+ ชั่วโมง**: `saveDayLog()` → `syncNow()` → `queueSync(true)` → return ทันที (token หมดอายุ) → ข้อมูลไม่ขึ้น Drive
- **Token หมดอายุระหว่างใช้งาน**: ทุก `queueSync()` call ถูก skip เงียบๆ ไม่มี indicator แจ้ง user
- **`driveSync()` ได้รับ HTTP 401**: ปัจจุบัน throw error แต่ไม่ trigger refresh และไม่ retry
- **Device B login หลัง Device A มีข้อมูลใหม่ที่ยังไม่ sync**: `driveLoad()` ดึงข้อมูลเก่าจาก Drive มาใช้

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- เมื่อมี access token ที่ใช้งานได้ `queueSync()` ต้อง sync ตามปกติเหมือนเดิม
- `manualSync()` ต้องทำงานเหมือนเดิมทุกประการ
- Guest mode ต้องไม่ sync และไม่แสดง sync UI เหมือนเดิม
- `drivePollSync()` ทุก 5 นาทีต้องทำงานเหมือนเดิม
- `driveMergeAndApply()` ต้อง merge ข้อมูลเหมือนเดิม
- Login บน device ใหม่และ cloud data ใหม่กว่า ต้องดึง cloud มาใช้เหมือนเดิม

**Scope:**
Input ที่ไม่ตรงกับ bug condition (มี token ที่ใช้งานได้, หรือเป็น guest) ต้องไม่ได้รับผลกระทบจาก fix นี้เลย

## Hypothesized Root Cause

1. **Silent Return Without Pending Flag**: `queueSync()` บรรทัด `if(isGuest||!accessToken)return` ไม่ตั้ง `_syncPending=true` ก่อน return ทำให้ข้อมูลที่ควร sync หายไปเงียบๆ

2. **No Auto Token Refresh Trigger**: เมื่อ token หมดอายุระหว่างใช้งาน ไม่มีโค้ดที่ call `startSilentAuthRefresh()` อัตโนมัติ — ฟังก์ชันนี้มีอยู่แล้วแต่ถูกเรียกเฉพาะตอน `checkSession()` เท่านั้น

3. **No 401 Detection in driveSync()**: `driveSync()` ตรวจสอบแค่ `if(!r.ok)throw new Error(...)` โดยไม่แยกแยะ 401 (token expired) ออกจาก error อื่น ทำให้ไม่สามารถ trigger refresh + retry ได้

4. **No Flush After Token Refresh**: `finishAuth()` เรียก `queueSync(true)` เฉพาะเมื่อ `syncLocal=true` แต่ไม่ flush `_syncPending` ที่ค้างอยู่จากก่อนหน้า

5. **No Proactive Token Refresh**: ไม่มี timer ที่ refresh token ก่อนหมดอายุ (token อายุ 1 ชั่วโมง ควร refresh ทุก ~50 นาที)

6. **No Sync Status Indicator**: ไม่มี UI แจ้ง user ว่ามีข้อมูลรอ sync อยู่

## Correctness Properties

Property 1: Bug Condition — Pending Sync on Token Absence

_For any_ SyncAttempt X where isBugCondition(X) holds (user is not guest AND has no valid access token),
the fixed `queueSync()` SHALL set `_syncPending = true` to preserve the sync intent,
AND SHALL trigger `startSilentAuthRefresh()` to obtain a new token,
AND SHALL NOT lose any data that was saved to localStorage.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — Normal Sync Behavior Unchanged

_For any_ SyncAttempt X where isBugCondition(X) does NOT hold (user has a valid access token OR is guest),
the fixed `queueSync()` SHALL produce exactly the same behavior as the original `queueSync()`,
preserving all existing sync logic, debounce timing, and guest-mode skip behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `app.js`

**Change 1 — `queueSync(immediate)`**: เพิ่ม pending flag + silent refresh trigger

```
// BEFORE
function queueSync(immediate){
  if(isGuest||!accessToken)return;
  ...
}

// AFTER
function queueSync(immediate){
  if(isGuest)return;
  if(!accessToken){
    _syncPending=true;
    startSilentAuthRefresh();
    return;
  }
  ...
}
```

**Change 2 — `driveSync()`**: เพิ่ม 401 detection + retry หลัง token refresh

```
// ใน .catch() ของ req:
.catch(function(err){
  if(err && err.status===401){
    _syncPending=true;
    accessToken=null;
    startSilentAuthRefresh();
    failed=false; // ไม่ throw error เพราะจะ retry หลัง refresh
  } else {
    failed=true;
  }
})
```

เพิ่มการตรวจสอบ response status ก่อน throw:
```
.then(function(r){
  if(r.status===401){ var e=new Error('401'); e.status=401; throw e; }
  if(!r.ok) throw new Error('drive sync failed');
})
```

**Change 3 — `finishAuth(syncLocal)`**: flush pending sync หลังได้ token ใหม่

```
// AFTER ตั้งค่า isGuest=false และ accessToken แล้ว
function finishAuth(syncLocal){
  isGuest=false;
  _authRefreshStarted=false; // reset flag เพื่อให้ refresh ได้อีกครั้งในอนาคต
  persistStore(applySessionData(gs()),false);
  if(syncLocal||_syncPending){
    _syncPending=false;
    queueSync(true);
  }
  ...
}
```

**Change 4 — `startSilentAuthRefresh()`**: แก้ guard condition ให้ refresh ได้แม้ token หมดอายุ

```
// BEFORE
function startSilentAuthRefresh(){
  if(_authRefreshStarted||accessToken||isGuest)return;
  ...
}

// AFTER
function startSilentAuthRefresh(){
  if(_authRefreshStarted||isGuest)return; // ลบ ||accessToken ออก เพื่อให้ refresh ได้เมื่อ token หมดอายุ
  ...
}
```

**Change 5 — Proactive Token Refresh Timer**: เพิ่มใน `enterApp()` หรือ `finishAuth()`

```
// เพิ่ม timer refresh token ทุก 50 นาที (token อายุ 60 นาที)
var _tokenRefreshTimer=null;
function scheduleTokenRefresh(){
  clearInterval(_tokenRefreshTimer);
  _tokenRefreshTimer=setInterval(function(){
    if(!isGuest&&accessToken){
      accessToken=null; // force refresh
      _authRefreshStarted=false;
      startSilentAuthRefresh();
    }
  }, 50*60*1000);
}
```

เรียก `scheduleTokenRefresh()` ใน `finishAuth()` หลังได้ token

**Change 6 — Sync Status Indicator**: เพิ่ม UI แสดงสถานะ pending sync

```
// เพิ่มฟังก์ชัน updateSyncIndicator()
function updateSyncIndicator(){
  var el=document.getElementById('syncPendingBadge');
  if(!el)return;
  el.style.display=(!isGuest&&_syncPending)?'':'none';
}
```

เพิ่ม badge element ใน HTML และเรียก `updateSyncIndicator()` หลัง `_syncPending` เปลี่ยนค่า

## Testing Strategy

### Validation Approach

ใช้ two-phase approach: ก่อนอื่น surface counterexamples บน unfixed code เพื่อยืนยัน root cause
จากนั้น verify fix และ preservation หลัง implement

### Exploratory Bug Condition Checking

**Goal**: แสดงให้เห็นว่า `queueSync()` บน unfixed code return เงียบๆ โดยไม่ตั้ง `_syncPending`
และไม่ trigger silent refresh เมื่อไม่มี token

**Test Plan**: Mock `accessToken=null`, `isGuest=false` แล้วเรียก `queueSync()` และตรวจสอบว่า
`_syncPending` ยังเป็น `false` และ `startSilentAuthRefresh` ไม่ถูกเรียก

**Test Cases**:
1. **No Token Test**: `accessToken=null, isGuest=false` → call `queueSync(false)` → assert `_syncPending===false` (จะ fail บน unfixed code เพราะ expected `true`)
2. **401 Response Test**: mock `driveSync()` ให้ได้ 401 → assert `_syncPending===false` (จะ fail บน unfixed code)
3. **Silent Refresh Not Triggered**: assert `startSilentAuthRefresh` ไม่ถูกเรียก (จะ fail บน unfixed code)
4. **finishAuth No Flush**: ตั้ง `_syncPending=true` แล้วเรียก `finishAuth(false)` → assert sync ไม่ถูก trigger (จะ fail บน fixed code)

**Expected Counterexamples**:
- `_syncPending` ยังเป็น `false` หลัง `queueSync()` เมื่อไม่มี token
- `startSilentAuthRefresh` ไม่ถูกเรียกเลย
- Possible causes: early return ก่อนตั้ง flag, guard condition ใน `startSilentAuthRefresh` block การเรียก

### Fix Checking

**Goal**: Verify ว่าหลัง fix แล้ว ทุก input ที่ตรง bug condition จะได้รับพฤติกรรมที่ถูกต้อง

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result ← queueSync_fixed(X)
  ASSERT _syncPending = true
  ASSERT silentRefreshWasTriggered = true
  ASSERT dataInLocalStorage = dataBeforeCall
END FOR
```

### Preservation Checking

**Goal**: Verify ว่า input ที่ไม่ตรง bug condition ได้รับพฤติกรรมเหมือนเดิมทุกประการ

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT queueSync_original(X) = queueSync_fixed(X)
END FOR
```

**Testing Approach**: Property-based testing เหมาะสมสำหรับ preservation checking เพราะ:
- Generate หลาย test case อัตโนมัติครอบคลุม input domain
- จับ edge case ที่ manual test อาจพลาด
- ให้ความมั่นใจสูงว่า behavior ไม่เปลี่ยนสำหรับ non-buggy inputs

**Test Cases**:
1. **Valid Token Preservation**: `accessToken='valid', isGuest=false` → `queueSync()` ต้อง sync ตามปกติ ไม่ตั้ง `_syncPending` โดยไม่จำเป็น
2. **Guest Mode Preservation**: `isGuest=true` → `queueSync()` ต้อง return ทันทีโดยไม่ทำอะไร
3. **Manual Sync Preservation**: `manualSync()` ต้องทำงานเหมือนเดิมทุกประการ
4. **Poll Sync Preservation**: `drivePollSync()` ต้อง merge ข้อมูลเหมือนเดิม

### Unit Tests

- Test `queueSync()` เมื่อ `accessToken=null, isGuest=false` → ต้องตั้ง `_syncPending=true` และเรียก `startSilentAuthRefresh()`
- Test `queueSync()` เมื่อ `isGuest=true` → ต้อง return ทันทีโดยไม่ตั้ง flag
- Test `queueSync()` เมื่อมี token → ต้อง sync ตามปกติ
- Test `driveSync()` เมื่อได้ 401 → ต้องตั้ง `_syncPending=true` และ trigger refresh
- Test `finishAuth()` เมื่อ `_syncPending=true` → ต้อง flush และ sync
- Test `startSilentAuthRefresh()` guard condition ใหม่ (ไม่ block เมื่อ token หมดอายุ)

### Property-Based Tests

- Generate random `SyncAttempt` objects ที่ตรง bug condition → verify `_syncPending=true` เสมอ
- Generate random `SyncAttempt` objects ที่ไม่ตรง bug condition → verify behavior เหมือน original
- Generate random sequences ของ save + token expiry + refresh → verify ข้อมูลไม่สูญหาย

### Integration Tests

- Full flow: บันทึกข้อมูล → token หมดอายุ → silent refresh → sync สำเร็จ
- Full flow: `driveSync()` ได้ 401 → refresh → retry → sync สำเร็จ
- Regression: manual sync ยังทำงานได้ปกติหลัง fix
- Regression: guest mode ยังไม่ sync หลัง fix
- Regression: `drivePollSync()` ยังทำงานได้ปกติหลัง fix

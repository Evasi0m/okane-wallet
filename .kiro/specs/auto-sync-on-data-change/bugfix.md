# Bugfix Requirements Document

## Introduction

ระบบ sync ข้อมูลระหว่าง device ไม่ทำงานอัตโนมัติเมื่อผู้ใช้บันทึกข้อมูลใหม่
โดยเฉพาะในกรณีที่ Google OAuth2 access token หมดอายุ (token มีอายุ 1 ชั่วโมง)
ทำให้ข้อมูลที่บันทึกบน Device A ถูกเก็บไว้ใน localStorage เท่านั้น
แต่ไม่ถูก push ขึ้น Google Drive จนกว่าผู้ใช้จะกด manualSyncBtn หรือ reload หน้า
ส่งผลให้เมื่อ login บน Device B จะได้รับข้อมูลเก่าจาก Drive แทนข้อมูลล่าสุด

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN ผู้ใช้บันทึกค่าใช้จ่ายผ่าน `saveDayLog()` และ access token หมดอายุ THEN ระบบบันทึกข้อมูลลง localStorage แต่ `queueSync()` return ทันทีโดยไม่ sync เพราะเงื่อนไข `if(isGuest||!accessToken)return`

1.2 WHEN access token หมดอายุระหว่างที่แอปเปิดค้างไว้ (ไม่มีการ reload) THEN ระบบไม่มีกลไก refresh token อัตโนมัติ ทำให้ทุก sync call ที่เกิดขึ้นหลังจากนั้นถูก skip เงียบๆ

1.3 WHEN `driveSync()` fail เพราะ token หมดอายุหรือ network error THEN ระบบไม่มี retry mechanism และข้อมูลที่ค้างอยู่ใน localStorage จะไม่ถูก sync จนกว่าผู้ใช้จะ action เอง

1.4 WHEN ผู้ใช้ login บน Device B หลังจากที่ Device A มีข้อมูลใหม่ที่ยังไม่ได้ sync THEN `driveLoad()` ดึงข้อมูลจาก Drive (วันที่ 19) มา overwrite local ของ Device B โดยไม่ merge กับข้อมูลที่ Device A ยังไม่ได้ push

### Expected Behavior (Correct)

2.1 WHEN ผู้ใช้บันทึกค่าใช้จ่ายและ access token หมดอายุ THEN ระบบ SHALL ตั้ง flag `_syncPending=true` เพื่อ mark ว่ามี pending sync รอ และ trigger silent token refresh อัตโนมัติ จากนั้น sync ทันทีเมื่อได้ token ใหม่

2.2 WHEN access token ใกล้หมดอายุ (เช่น เหลือน้อยกว่า 5 นาที) หรือหมดอายุแล้ว THEN ระบบ SHALL พยายาม refresh token แบบ silent ผ่าน `startSilentAuthRefresh()` โดยอัตโนมัติ โดยไม่ต้องให้ผู้ใช้ reload หน้า

2.3 WHEN `driveSync()` fail เพราะ token หมดอายุ (HTTP 401) THEN ระบบ SHALL ตั้ง `_syncPending=true` และ trigger silent token refresh เพื่อ retry sync หลังได้ token ใหม่

2.4 WHEN ผู้ใช้มี pending sync ที่ยังไม่ได้ push และ sync status เปลี่ยนแปลง THEN ระบบ SHALL แสดง indicator ให้ผู้ใช้ทราบว่าข้อมูลยังไม่ได้ sync (เช่น "มีข้อมูลรอ sync")

### Unchanged Behavior (Regression Prevention)

3.1 WHEN ผู้ใช้บันทึกค่าใช้จ่ายและ access token ยังใช้งานได้ THEN ระบบ SHALL CONTINUE TO sync ข้อมูลขึ้น Drive ทันทีผ่าน `syncNow()` เหมือนเดิม

3.2 WHEN ผู้ใช้กด manualSyncBtn และมี access token THEN ระบบ SHALL CONTINUE TO sync ทันทีและแสดงผลลัพธ์ success/error เหมือนเดิม

3.3 WHEN ผู้ใช้เป็น guest (ไม่ได้ login Google) THEN ระบบ SHALL CONTINUE TO ไม่ sync และไม่แสดง sync-related UI เหมือนเดิม

3.4 WHEN `drivePollSync()` ทำงานทุก 5 นาทีและพบข้อมูลใหม่บน Drive THEN ระบบ SHALL CONTINUE TO merge ข้อมูลจาก cloud เข้ากับ local ผ่าน `driveMergeAndApply()` เหมือนเดิม

3.5 WHEN ผู้ใช้ login บน device ใหม่และ cloud data ใหม่กว่า local THEN ระบบ SHALL CONTINUE TO ดึงข้อมูลจาก cloud มาใช้เหมือนเดิม

---

## Bug Condition (Pseudocode)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type SyncAttempt { hasAccessToken: boolean, tokenExpired: boolean, isGuest: boolean }
  OUTPUT: boolean

  RETURN (NOT X.isGuest) AND (NOT X.hasAccessToken OR X.tokenExpired)
END FUNCTION
```

```pascal
// Property: Fix Checking — Pending Sync on Token Absence
FOR ALL X WHERE isBugCondition(X) DO
  result ← queueSync'(X)
  ASSERT _syncPending = true
  ASSERT silentRefreshTriggered = true
  ASSERT dataNotLost(localStorage)
END FOR
```

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT queueSync(X) = queueSync'(X)  // behavior unchanged when token is valid
END FOR
```

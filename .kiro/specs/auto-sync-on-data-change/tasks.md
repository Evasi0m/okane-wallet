# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Silent Return Without Pending Flag
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate `queueSync()` returns silently without setting `_syncPending` or triggering `startSilentAuthRefresh()`
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases where `isBugCondition(X)` holds: `isGuest=false` AND (`hasAccessToken=false` OR `tokenExpired=true`)
  - Test setup: Mock `accessToken=null`, `isGuest=false`, spy on `startSilentAuthRefresh`
  - Test case 1 — No Token: call `queueSync(false)` → assert `_syncPending === true` (FAILS on unfixed code because early return prevents flag being set)
  - Test case 2 — No Token Immediate: call `queueSync(true)` → assert `_syncPending === true` AND `startSilentAuthRefresh` was called
  - Test case 3 — 401 Response: mock `driveSync()` to receive HTTP 401 → assert `_syncPending === true` after call
  - Test case 4 — finishAuth flush: set `_syncPending=true`, call `finishAuth(false)` → assert `queueSync` was triggered (FAILS on unfixed code because finishAuth only calls queueSync when syncLocal=true)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bug exists)
  - Document counterexamples found, e.g. `_syncPending` remains `false` after `queueSync(false)` with `accessToken=null, isGuest=false`
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Normal Sync Behavior Unchanged for Non-Buggy Inputs
  - **IMPORTANT**: Follow observation-first methodology — run UNFIXED code with non-buggy inputs first, observe outputs, then write assertions
  - **Scoped to**: inputs where `isBugCondition(X)` is FALSE — i.e. `isGuest=true` OR (`hasAccessToken=true` AND `tokenExpired=false`)
  - Observe case 1 — Valid Token: `accessToken='valid_token', isGuest=false` → `queueSync(false)` → observe that `_syncTimer` is set (debounce path) and `_syncPending` is NOT set unnecessarily
  - Observe case 2 — Guest Mode: `isGuest=true` → `queueSync(false)` → observe immediate return, no timer, no flag, no refresh call
  - Observe case 3 — Already Syncing: `_syncing=true, accessToken='valid'` → `queueSync(false)` → observe `_syncPending=true` set (existing behavior)
  - Write property-based test: for all X where `isGuest=true`, `queueSync()` must return immediately without side effects
  - Write property-based test: for all X where `accessToken` is non-null and non-expired, `queueSync()` must follow the original debounce/immediate path
  - Write property-based test: `manualSync()` with valid token must still call `driveSync()` and show result
  - Write property-based test: `drivePollSync()` must still merge data via `driveMergeAndApply()` unchanged
  - Verify all tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix: Auto-sync pending flag + silent token refresh on token absence

  - [x] 3.1 Fix `queueSync(immediate)` — add pending flag + silent refresh trigger
    - Split the guard: keep `if(isGuest)return` as-is
    - Add new branch: `if(!accessToken){ _syncPending=true; startSilentAuthRefresh(); return; }`
    - This ensures sync intent is preserved and refresh is triggered when token is absent
    - _Bug_Condition: isBugCondition(X) where X.isGuest=false AND X.hasAccessToken=false_
    - _Expected_Behavior: _syncPending=true AND startSilentAuthRefresh() called AND data not lost_
    - _Preservation: isGuest=true path unchanged; valid-token path unchanged_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Fix `driveSync()` — add HTTP 401 detection + pending flag + refresh trigger
    - In the `.then(r => ...)` handler for both PATCH and POST requests, check `r.status===401` before the generic `!r.ok` check
    - Throw a typed error: `var e=new Error('401'); e.status=401; throw e;`
    - In the `.catch()` handler, detect `err.status===401`: set `_syncPending=true`, clear `accessToken=null`, call `startSilentAuthRefresh()`, set `failed=false` (no re-throw, retry will happen after refresh)
    - For non-401 errors, keep existing `failed=true` behavior
    - _Bug_Condition: driveSync() receives HTTP 401 response (token expired mid-sync)_
    - _Expected_Behavior: _syncPending=true AND accessToken cleared AND refresh triggered_
    - _Preservation: non-401 errors still set failed=true and throw; successful sync path unchanged_
    - _Requirements: 2.3_

  - [x] 3.3 Fix `finishAuth(syncLocal)` — flush `_syncPending` after new token received
    - Add `_authRefreshStarted=false` reset at the start of `finishAuth()` to allow future refreshes
    - Change sync trigger condition from `if(syncLocal)queueSync(true)` to `if(syncLocal||_syncPending){ _syncPending=false; queueSync(true); }`
    - Call `scheduleTokenRefresh()` at the end of `finishAuth()` to start proactive refresh timer
    - _Bug_Condition: _syncPending=true from prior queueSync() call but finishAuth(false) was called_
    - _Expected_Behavior: pending sync is flushed and executed after new token is available_
    - _Preservation: syncLocal=true path still triggers sync; enterApp() flow unchanged_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Fix `startSilentAuthRefresh()` — remove `||accessToken` from guard
    - Change guard from `if(_authRefreshStarted||accessToken||isGuest)return` to `if(_authRefreshStarted||isGuest)return`
    - This allows silent refresh to proceed even when `accessToken` is still set but expired
    - _Bug_Condition: accessToken is set but expired — old guard blocks refresh entirely_
    - _Expected_Behavior: refresh proceeds when _authRefreshStarted=false and isGuest=false_
    - _Preservation: _authRefreshStarted guard still prevents duplicate refresh calls_
    - _Requirements: 2.2_

  - [x] 3.5 Add proactive token refresh timer (`scheduleTokenRefresh()`)
    - Declare `var _tokenRefreshTimer=null` near other timer variables at top of file
    - Implement `scheduleTokenRefresh()`: `clearInterval(_tokenRefreshTimer)` then `setInterval` every 50 minutes
    - Inside interval: if `!isGuest && accessToken`, set `accessToken=null`, `_authRefreshStarted=false`, call `startSilentAuthRefresh()`
    - Call `scheduleTokenRefresh()` inside `finishAuth()` after token is confirmed
    - _Bug_Condition: token expires after 60 min with no proactive refresh — all subsequent syncs silently fail_
    - _Expected_Behavior: token is refreshed proactively every 50 min, keeping sync operational_
    - _Preservation: timer only runs when logged in (non-guest); does not affect guest mode_
    - _Requirements: 2.2_

  - [x] 3.6 Add sync status indicator (`updateSyncIndicator()` + badge element)
    - Implement `updateSyncIndicator()`: get element `#syncPendingBadge`, set `display` based on `(!isGuest && _syncPending)`
    - Add badge HTML element in `index.html` near the manual sync button (e.g. `<span id="syncPendingBadge" style="display:none">มีข้อมูลรอ sync</span>`)
    - Call `updateSyncIndicator()` every time `_syncPending` changes value (in `queueSync`, `driveSync` catch, `finishAuth`)
    - _Bug_Condition: user has no visual feedback that data is pending sync_
    - _Expected_Behavior: badge visible when _syncPending=true and not guest; hidden otherwise_
    - _Preservation: guest mode never shows badge; badge hidden when sync is current_
    - _Requirements: 2.4_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Silent Return Without Pending Flag
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run all bug condition exploration tests from step 1
    - **EXPECTED OUTCOME**: Tests PASS (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Normal Sync Behavior Unchanged for Non-Buggy Inputs
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm valid-token sync, guest mode, manual sync, and poll sync all behave as before

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite and confirm all tests pass
  - Verify Property 1 (bug condition) passes — bug is fixed
  - Verify Property 2 (preservation) passes — no regressions
  - Manually test the full flow: save data → token expires → silent refresh → auto sync
  - Manually test regression: manual sync button still works with valid token
  - Manually test regression: guest mode shows no sync UI and does not sync
  - Ask the user if any questions arise before closing

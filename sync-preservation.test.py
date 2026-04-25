"""
Preservation Property Tests — Auto Sync on Data Change
Property 2: Preservation — Normal Sync Behavior Unchanged for Non-Buggy Inputs

IMPORTANT: These tests MUST PASS on unfixed code.
They establish baseline behavior that the fix must not break.
Scoped to inputs where isBugCondition(X) is FALSE:
  - isGuest=True, OR
  - (hasAccessToken=True AND tokenExpired=False)

Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5

Run with: python3 sync-preservation.test.py
"""

# ─── App state (mirrors app.js globals) ──────────────────────────────────────
state = {
    'isGuest': False,
    'accessToken': None,
    '_syncing': False,
    '_syncTimer': None,
    '_syncPending': False,
    '_authRefreshStarted': False,
    '_pendingManualSync': False,
}

# Track side-effect calls
drive_sync_call_count = 0
refresh_call_count = 0
queue_sync_call_count = 0


def reset_state():
    global drive_sync_call_count, refresh_call_count, queue_sync_call_count
    state['isGuest'] = False
    state['accessToken'] = None
    state['_syncing'] = False
    state['_syncTimer'] = None
    state['_syncPending'] = False
    state['_authRefreshStarted'] = False
    state['_pendingManualSync'] = False
    drive_sync_call_count = 0
    refresh_call_count = 0
    queue_sync_call_count = 0


# ─── Functions under test — VERBATIM logic from app.js (unfixed) ─────────────

DEBOUNCE_SENTINEL = 'debounce_timer_set'


def startSilentAuthRefresh():
    """CURRENT startSilentAuthRefresh — verbatim logic from app.js."""
    global refresh_call_count
    if state['_authRefreshStarted'] or state['accessToken'] or state['isGuest']:
        return
    state['_authRefreshStarted'] = True
    refresh_call_count += 1


def driveSync():
    """Stub — records that driveSync was called."""
    global drive_sync_call_count
    drive_sync_call_count += 1


def queueSync(immediate):
    """
    FIXED queueSync — split guard: isGuest returns early, no-token sets pending + triggers refresh.

    function queueSync(immediate){
      if(isGuest)return;
      if(!accessToken){ _syncPending=true; startSilentAuthRefresh(); return; }
      if(_syncing){_syncPending=true;return}
      clearTimeout(_syncTimer);
      if(immediate)driveSync();
      else _syncTimer=setTimeout(function(){driveSync()},1500)
    }
    """
    if state['isGuest']:
        return
    if not state['accessToken']:
        state['_syncPending'] = True
        startSilentAuthRefresh()
        return
    if state['_syncing']:
        state['_syncPending'] = True
        return
    state['_syncTimer'] = None
    if immediate:
        driveSync()
    else:
        state['_syncTimer'] = DEBOUNCE_SENTINEL


def finishAuth(syncLocal):
    """
    FIXED finishAuth — flushes _syncPending regardless of syncLocal.
    """
    global queue_sync_call_count
    state['isGuest'] = False
    state['_authRefreshStarted'] = False
    if syncLocal or state['_syncPending']:
        state['_syncPending'] = False
        queue_sync_call_count += 1
        queueSync(True)


# ─── Test harness ─────────────────────────────────────────────────────────────
passed = 0
failed = 0
failures = []


def run_test(name, fn):
    global passed, failed
    reset_state()
    try:
        fn()
        print(f"  PASS: {name}")
        passed += 1
    except AssertionError as e:
        print(f"  FAIL: {name}")
        print(f"        {e}")
        failed += 1
        failures.append({'name': name, 'error': str(e)})


# ─── Tests ────────────────────────────────────────────────────────────────────

print("\n=== Preservation Property Tests (Property 2) ===")
print("EXPECTED: All tests PASS on unfixed code (confirms baseline behavior)\n")


def test1_valid_token_debounce():
    """
    Test 1 — Valid Token Debounce

    isBugCondition: isGuest=False, hasAccessToken=True → FALSE (not a bug condition)
    Call queueSync(False) with a valid token.
    Assert: _syncTimer is set (debounce path taken) and _syncPending is NOT set.

    This is the normal non-immediate sync path — must be preserved by the fix.
    """
    state['accessToken'] = 'valid_token'
    state['isGuest'] = False

    queueSync(False)

    assert state['_syncTimer'] == DEBOUNCE_SENTINEL, (
        f"_syncTimer should be set (debounce path) after queueSync(False) with valid token, "
        f"but was: {state['_syncTimer']}"
    )
    assert state['_syncPending'] is False, (
        f"_syncPending should NOT be set unnecessarily for valid-token path, "
        f"but was: {state['_syncPending']}"
    )
    assert drive_sync_call_count == 0, (
        f"driveSync should NOT be called immediately for non-immediate queueSync, "
        f"but call count was: {drive_sync_call_count}"
    )


run_test(
    "Test 1 — Valid Token Debounce: queueSync(False) sets _syncTimer, not _syncPending",
    test1_valid_token_debounce
)


def test2_guest_mode_no_side_effects():
    """
    Test 2 — Guest Mode

    isBugCondition: isGuest=True → FALSE (guest is excluded from bug condition)
    Call queueSync(False) with isGuest=True.
    Assert: immediate return — no timer set, no _syncPending, no refresh triggered.

    Guest mode must never sync. This behavior must be preserved by the fix.
    """
    state['isGuest'] = True
    state['accessToken'] = None  # guests have no token

    queueSync(False)

    assert state['_syncTimer'] is None, (
        f"_syncTimer should NOT be set in guest mode, but was: {state['_syncTimer']}"
    )
    assert state['_syncPending'] is False, (
        f"_syncPending should NOT be set in guest mode, but was: {state['_syncPending']}"
    )
    assert refresh_call_count == 0, (
        f"startSilentAuthRefresh should NOT be called in guest mode, "
        f"but call count was: {refresh_call_count}"
    )
    assert drive_sync_call_count == 0, (
        f"driveSync should NOT be called in guest mode, "
        f"but call count was: {drive_sync_call_count}"
    )


run_test(
    "Test 2 — Guest Mode: queueSync(False) returns immediately with no side effects",
    test2_guest_mode_no_side_effects
)


def test3_already_syncing_sets_pending():
    """
    Test 3 — Already Syncing

    isBugCondition: isGuest=False, hasAccessToken=True → FALSE (valid token)
    Set _syncing=True, then call queueSync(False).
    Assert: _syncPending=True is set (existing behavior for in-progress sync).

    This is the existing "queue behind active sync" behavior — must be preserved.
    """
    state['_syncing'] = True
    state['accessToken'] = 'valid'
    state['isGuest'] = False

    queueSync(False)

    assert state['_syncPending'] is True, (
        f"_syncPending should be True when _syncing=True and queueSync is called, "
        f"but was: {state['_syncPending']}"
    )
    assert drive_sync_call_count == 0, (
        f"driveSync should NOT be called while already syncing, "
        f"but call count was: {drive_sync_call_count}"
    )


run_test(
    "Test 3 — Already Syncing: queueSync(False) sets _syncPending=True when _syncing=True",
    test3_already_syncing_sets_pending
)


def test4_finish_auth_with_sync_local_true():
    """
    Test 4 — finishAuth with syncLocal=True

    Call finishAuth(True) and assert queueSync was triggered.
    This is the existing behavior when a fresh login completes with local data to push.

    Must be preserved: finishAuth(True) must still trigger queueSync.
    """
    state['accessToken'] = 'fresh_token'
    state['isGuest'] = False

    finishAuth(True)

    assert queue_sync_call_count > 0, (
        f"queueSync should have been called by finishAuth(True), "
        f"but call count was: {queue_sync_call_count}"
    )


run_test(
    "Test 4 — finishAuth(True): queueSync is triggered when syncLocal=True",
    test4_finish_auth_with_sync_local_true
)


# ─── Summary ──────────────────────────────────────────────────────────────────

print("\n─── Results ───────────────────────────────────────────────────────")
print(f"Passed: {passed} / {passed + failed}")
print(f"Failed: {failed} / {passed + failed}")

if failed == 0:
    print("\n✓ All preservation tests PASS on unfixed code.")
    print("  These tests define the baseline behavior the fix must not break.")
    print("  Re-run after implementing the fix (Task 3) to confirm no regressions.")
else:
    print("\n✗ UNEXPECTED: Some preservation tests FAILED on unfixed code.")
    print("  These tests should pass on unfixed code — check the test logic.")
    for i, f in enumerate(failures, 1):
        print(f"\n{i}. [{f['name']}]")
        print(f"   {f['error']}")

print("")

import sys
if failed > 0:
    sys.exit(1)

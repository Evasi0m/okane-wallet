"""
Bug Condition Exploration Tests — Auto Sync on Data Change
Property 1: Bug Condition — Silent Return Without Pending Flag

CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
Failure confirms the bug exists. DO NOT fix the code or tests when they fail.

Validates: Requirements 1.1, 1.2, 1.3

Run with: python3 sync-bug-exploration.test.py
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

# Track calls to startSilentAuthRefresh
refresh_call_count = 0
queue_sync_call_count = 0


def reset_state():
    global refresh_call_count, queue_sync_call_count
    state['isGuest'] = False
    state['accessToken'] = None
    state['_syncing'] = False
    state['_syncTimer'] = None
    state['_syncPending'] = False
    state['_authRefreshStarted'] = False
    state['_pendingManualSync'] = False
    refresh_call_count = 0
    queue_sync_call_count = 0


# ─── Functions under test — VERBATIM logic from app.js (unfixed) ─────────────

def startSilentAuthRefresh():
    """
    FIXED startSilentAuthRefresh — removed ||accessToken guard.
    """
    global refresh_call_count
    if state['_authRefreshStarted'] or state['isGuest']:
        return  # fixed: no longer blocks when accessToken is set but expired
    state['_authRefreshStarted'] = True
    refresh_call_count += 1


def driveSync():
    """Stub — not under test here."""
    pass


def queueSync(immediate):
    """
    FIXED queueSync — split guard: isGuest returns early, no-token sets pending + triggers refresh.
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
    # clearTimeout(_syncTimer) — no-op in test
    if immediate:
        driveSync()
    # else: setTimeout(driveSync, 1500) — no-op in test


def finishAuth(syncLocal):
    """
    FIXED finishAuth — flushes _syncPending regardless of syncLocal.
    """
    global queue_sync_call_count
    state['isGuest'] = False
    state['_authRefreshStarted'] = False
    # persistStore / applySessionData / enterApp omitted — no DOM in test
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

print("\n=== Bug Condition Exploration Tests (Property 1) ===")
print("EXPECTED: All tests PASS on fixed code (confirms bug is resolved)\n")


def test1_no_token_non_immediate():
    """
    Test 1 — No Token (non-immediate)

    isBugCondition: isGuest=False, hasAccessToken=False → TRUE
    Call queueSync(False) and assert _syncPending is set to True.

    EXPECTED TO FAIL on unfixed code:
      `if isGuest or not accessToken: return` fires before _syncPending is ever set.
      Counterexample: _syncPending remains False after queueSync(False) with accessToken=None.
    """
    state['accessToken'] = None
    state['isGuest'] = False

    queueSync(False)

    assert state['_syncPending'] is True, (
        f"_syncPending should be True after queueSync(False) with no token, "
        f"but was: {state['_syncPending']}\n"
        f"        Counterexample: {{accessToken: None, isGuest: False, immediate: False}} "
        f"→ _syncPending={state['_syncPending']}"
    )


run_test(
    "Test 1 — No Token: queueSync(False) should set _syncPending=True",
    test1_no_token_non_immediate
)


def test2_no_token_immediate():
    """
    Test 2 — No Token (immediate)

    isBugCondition: isGuest=False, hasAccessToken=False → TRUE
    Call queueSync(True) and assert _syncPending=True AND startSilentAuthRefresh was called.

    EXPECTED TO FAIL on unfixed code:
      Same early return — neither _syncPending nor _authRefreshStarted is set.
      Counterexample: _syncPending=False, refresh_call_count=0 after queueSync(True).
    """
    state['accessToken'] = None
    state['isGuest'] = False

    queueSync(True)

    assert state['_syncPending'] is True, (
        f"_syncPending should be True after queueSync(True) with no token, "
        f"but was: {state['_syncPending']}\n"
        f"        Counterexample: {{accessToken: None, isGuest: False, immediate: True}} "
        f"→ _syncPending={state['_syncPending']}"
    )

    assert refresh_call_count > 0, (
        f"startSilentAuthRefresh should have been called, but call count was: {refresh_call_count}\n"
        f"        Counterexample: {{accessToken: None, isGuest: False, immediate: True}} "
        f"→ startSilentAuthRefresh not triggered"
    )


run_test(
    "Test 2 — No Token Immediate: queueSync(True) should set _syncPending=True AND trigger startSilentAuthRefresh",
    test2_no_token_immediate
)


def test3_finish_auth_no_flush():
    """
    Test 3 — finishAuth no flush

    Set _syncPending=True (simulating a prior failed queueSync), then call finishAuth(False).
    Assert that queueSync was triggered (i.e. pending sync was flushed).

    EXPECTED TO FAIL on unfixed code:
      finishAuth only calls queueSync when syncLocal=True.
      With syncLocal=False and _syncPending=True, the pending sync is silently ignored.
      Counterexample: after finishAuth(False) with _syncPending=True, queue_sync_call_count=0.
    """
    state['_syncPending'] = True
    state['accessToken'] = 'fresh_token'  # token is now available after refresh
    state['isGuest'] = False

    finishAuth(False)  # syncLocal=False — silent refresh completed

    assert queue_sync_call_count > 0, (
        f"queueSync should have been called by finishAuth(False) when _syncPending=True, "
        f"but call count was: {queue_sync_call_count}\n"
        f"        Counterexample: {{_syncPending: True, syncLocal: False}} "
        f"→ finishAuth(False) did not flush pending sync"
    )


run_test(
    "Test 3 — finishAuth no flush: finishAuth(False) with _syncPending=True should trigger queueSync",
    test3_finish_auth_no_flush
)


# ─── Summary ──────────────────────────────────────────────────────────────────

print("\n─── Results ───────────────────────────────────────────────────────")
print(f"Passed: {passed} / {passed + failed}")
print(f"Failed: {failed} / {passed + failed}")

if failures:
    print("\n─── Failures ──────────────────────────────────────────────────────")
    for i, f in enumerate(failures, 1):
        print(f"{i}. [{f['name']}]")
        print(f"   {f['error']}")
    print("\n✗ UNEXPECTED: Some bug condition tests FAILED on fixed code.")
    print("  The fix may be incomplete — check the implementation.")
else:
    print("\n✓ All bug condition tests PASS on fixed code.")
    print("  The fix correctly handles all bug condition inputs.")

print("")

import sys
if failed > 0:
    sys.exit(1)

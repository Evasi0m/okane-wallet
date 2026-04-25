/**
 * Bug Condition Exploration Tests — Auto Sync on Data Change
 *
 * Property 1: Bug Condition — Silent Return Without Pending Flag
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists. DO NOT fix the code or tests when they fail.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 *
 * Run with: node sync-bug-exploration.test.js
 */

'use strict';

// ─── Browser globals mock ────────────────────────────────────────────────────
var localStorage = (function () {
  var store = {};
  return {
    getItem: function (k) { return store[k] !== undefined ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    clear: function () { store = {}; }
  };
})();

var document = {
  getElementById: function () { return null; },
  addEventListener: function () {},
  documentElement: { setAttribute: function () {} }
};

var FormData = function () {
  this.append = function () {};
};

var Blob = function (parts, opts) {
  this.parts = parts;
  this.type = (opts && opts.type) || '';
};

var fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve({}); } }); };

var google = { accounts: { oauth2: { initTokenClient: function () { return {}; } } } };

// ─── App state variables (extracted from app.js) ─────────────────────────────
var isGuest = false;
var accessToken = null;
var _syncing = false;
var _syncTimer = null;
var _syncPending = false;
var _authRefreshStarted = false;
var _pendingManualSync = false;
var driveFileId = null;
var tokenClient = null;
var userInfo = {};

// ─── Minimal stubs for functions called by the functions under test ───────────
function gs() { return JSON.parse(localStorage.getItem('okane_v3') || '{"meta":{}}'); }
function persistStore(d) { localStorage.setItem('okane_v3', JSON.stringify(d)); return d; }
function applySessionData(s) { return s; }
function enterApp() {}
function updateUserBtn() {}
function render() {}
function manualSync() {}
function initGoogleAuth() {}

// ─── Functions under test (copied verbatim from app.js — UNFIXED) ─────────────

/**
 * CURRENT (buggy) queueSync — copied verbatim from app.js line 105
 * BUG: `if(isGuest||!accessToken)return` silently returns without setting
 *      _syncPending or triggering startSilentAuthRefresh().
 */
function queueSync(immediate) {
  if (isGuest || !accessToken) return;          // <-- BUG: silent return
  if (_syncing) { _syncPending = true; return; }
  clearTimeout(_syncTimer);
  if (immediate) driveSync();
  else _syncTimer = setTimeout(function () { driveSync(); }, 1500);
}

/**
 * CURRENT (buggy) startSilentAuthRefresh — copied verbatim from app.js
 * BUG: `||accessToken` in guard blocks refresh even when token is expired.
 */
function startSilentAuthRefresh() {
  if (_authRefreshStarted || accessToken || isGuest) return;  // <-- BUG: ||accessToken
  _authRefreshStarted = true;
  try {
    initGoogleAuth();
    if (tokenClient) tokenClient.requestAccessToken({ prompt: 'none' });
  } catch (e) {}
}

/**
 * CURRENT (buggy) finishAuth — copied verbatim from app.js
 * BUG: only calls queueSync when syncLocal=true, ignores _syncPending flag.
 */
function finishAuth(syncLocal) {
  isGuest = false;
  persistStore(applySessionData(gs()), false);
  if (syncLocal) queueSync(true);               // <-- BUG: ignores _syncPending
  if (_pendingManualSync) { _pendingManualSync = false; setTimeout(manualSync, 500); }
}

/**
 * Stub driveSync — not under test here, just needs to exist.
 */
function driveSync() { return Promise.resolve(); }

// ─── Test harness ─────────────────────────────────────────────────────────────
var passed = 0;
var failed = 0;
var failures = [];

function resetState() {
  isGuest = false;
  accessToken = null;
  _syncing = false;
  _syncTimer = null;
  _syncPending = false;
  _authRefreshStarted = false;
  _pendingManualSync = false;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error('ASSERTION FAILED: ' + message);
  }
}

function runTest(name, fn) {
  resetState();
  try {
    fn();
    console.log('  PASS: ' + name);
    passed++;
  } catch (e) {
    console.log('  FAIL: ' + name);
    console.log('        ' + e.message);
    failed++;
    failures.push({ name: name, error: e.message });
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\n=== Bug Condition Exploration Tests (Property 1) ===');
console.log('EXPECTED: All tests FAIL on unfixed code (failure = bug confirmed)\n');

/**
 * Test 1 — No Token (non-immediate)
 *
 * isBugCondition: isGuest=false, hasAccessToken=false → TRUE
 * Call queueSync(false) and assert _syncPending is set to true.
 *
 * EXPECTED TO FAIL on unfixed code:
 *   `if(isGuest||!accessToken)return` fires before _syncPending is ever set.
 *   Counterexample: _syncPending remains false after queueSync(false) with accessToken=null.
 */
runTest('Test 1 — No Token: queueSync(false) should set _syncPending=true', function () {
  accessToken = null;
  isGuest = false;

  queueSync(false);

  assert(_syncPending === true,
    '_syncPending should be true after queueSync(false) with no token, but was: ' + _syncPending +
    '\nCounterexample: { accessToken: null, isGuest: false, immediate: false } → _syncPending=' + _syncPending);
});

/**
 * Test 2 — No Token (immediate)
 *
 * isBugCondition: isGuest=false, hasAccessToken=false → TRUE
 * Call queueSync(true) and assert _syncPending=true AND startSilentAuthRefresh was called.
 *
 * EXPECTED TO FAIL on unfixed code:
 *   Same early return — neither _syncPending nor _authRefreshStarted is set.
 *   Counterexample: _syncPending=false, _authRefreshStarted=false after queueSync(true).
 */
runTest('Test 2 — No Token Immediate: queueSync(true) should set _syncPending=true AND trigger startSilentAuthRefresh', function () {
  accessToken = null;
  isGuest = false;

  // Spy on startSilentAuthRefresh by wrapping it
  var refreshCalled = false;
  var originalRefresh = startSilentAuthRefresh;
  startSilentAuthRefresh = function () {
    refreshCalled = true;
    originalRefresh();
  };

  queueSync(true);

  startSilentAuthRefresh = originalRefresh; // restore

  assert(_syncPending === true,
    '_syncPending should be true after queueSync(true) with no token, but was: ' + _syncPending +
    '\nCounterexample: { accessToken: null, isGuest: false, immediate: true } → _syncPending=' + _syncPending);

  assert(refreshCalled === true,
    'startSilentAuthRefresh should have been called, but was not.' +
    '\nCounterexample: { accessToken: null, isGuest: false, immediate: true } → startSilentAuthRefresh not triggered');
});

/**
 * Test 3 — finishAuth no flush
 *
 * Set _syncPending=true (simulating a prior failed queueSync), then call finishAuth(false).
 * Assert that queueSync was triggered (i.e. _syncPending was flushed / sync was attempted).
 *
 * EXPECTED TO FAIL on unfixed code:
 *   finishAuth only calls queueSync when syncLocal=true.
 *   With syncLocal=false and _syncPending=true, the pending sync is silently ignored.
 *   Counterexample: after finishAuth(false) with _syncPending=true, no sync is triggered.
 */
runTest('Test 3 — finishAuth no flush: finishAuth(false) with _syncPending=true should trigger queueSync', function () {
  // Simulate: user had a pending sync (token was absent), now token is back
  _syncPending = true;
  accessToken = 'fresh_token'; // token is now available after refresh
  isGuest = false;

  var queueSyncCalled = false;
  var originalQueueSync = queueSync;
  queueSync = function (immediate) {
    queueSyncCalled = true;
    originalQueueSync(immediate);
  };

  finishAuth(false); // syncLocal=false — simulates silent refresh completing without local-only data

  queueSync = originalQueueSync; // restore

  assert(queueSyncCalled === true,
    'queueSync should have been called by finishAuth(false) when _syncPending=true, but was not.' +
    '\nCounterexample: { _syncPending: true, syncLocal: false } → finishAuth(false) did not flush pending sync');
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n─── Results ───────────────────────────────────────────────────────');
console.log('Passed: ' + passed + ' / ' + (passed + failed));
console.log('Failed: ' + failed + ' / ' + (passed + failed));

if (failures.length > 0) {
  console.log('\n─── Counterexamples (Bug Evidence) ────────────────────────────────');
  failures.forEach(function (f, i) {
    console.log((i + 1) + '. [' + f.name + ']');
    console.log('   ' + f.error);
  });
  console.log('\n✓ EXPECTED: All failures above confirm the bug exists in unfixed code.');
  console.log('  These counterexamples will be resolved when the fix is applied (Task 3).');
} else {
  console.log('\n⚠ WARNING: All tests passed — this is UNEXPECTED on unfixed code.');
  console.log('  Either the code is already fixed, or the tests do not correctly probe the bug.');
}

console.log('');

// Exit with non-zero code when tests fail (expected on unfixed code)
if (failed > 0) {
  process.exit(1);
}

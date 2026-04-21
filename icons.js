/* ===== icons.js — Admin-Only Icon Editor ===== */
'use strict';

/* ════════════════════════════════════════════
   ADMIN CONFIG
   Set ADMIN_PASS_HASH to the SHA-256 hex of your password.
   While it reads '__SETUP__', the page runs in setup mode
   so you can generate the hash without touching source code.
   ════════════════════════════════════════════ */
const ADMIN_PASS_HASH = '__SETUP__';

/* ── SVG base attrs (matches app.js _s) ── */
const _sa = 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

/* ════════════════════════════════════════════
   DEFAULTS — 40 ICON_LIST + 7 IC (excl. ck/dl)
   ════════════════════════════════════════════ */
const DEFAULTS = {
  /* ── ICON_LIST ── */
  'ICON_LIST.shopee':       `<svg ${_sa}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`,
  'ICON_LIST.grab':         `<svg ${_sa}><path d="M12 2L4 8l2 2 4-1v5l-3 2v2l5-1 5 1v-2l-3-2V9l4 1 2-2-8-6z"/></svg>`,
  'ICON_LIST.netflix':      `<svg ${_sa}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M12 2l-5 5M12 2l5 5"/></svg>`,
  'ICON_LIST.youtube':      `<svg ${_sa}><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 00-1.94 2C1 8.14 1 12 1 12s0 3.86.46 5.58a2.78 2.78 0 001.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 001.94-2C23 15.86 23 12 23 12s0-3.86-.46-5.58z"/><path d="M9.75 15.02l5.75-3.02-5.75-3.02v6.04z" fill="currentColor"/></svg>`,
  'ICON_LIST.lineman':      `<svg ${_sa}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  'ICON_LIST.starbucks':    `<svg ${_sa}><path d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><path d="M7 2v3M10 2v3M13 2v3"/></svg>`,
  'ICON_LIST.truemoney':    `<svg ${_sa}><path d="M20 7H5a2 2 0 00-2 2v10a2 2 0 002 2h15V7z"/><path d="M20 7V5a2 2 0 00-2-2H7"/><circle cx="17" cy="14" r="1.5"/></svg>`,
  'ICON_LIST.kasikornbank': `<svg ${_sa}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>`,
  'ICON_LIST.scb':          `<svg ${_sa}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h3"/></svg>`,
  'ICON_LIST.visa':         `<svg ${_sa}><path d="M10 9h4L12 15h-4zM18 9h4l-2 6h-4zM2 9h4l2 6h-4z"/></svg>`,
  'ICON_LIST.coffee':       `<svg ${_sa}><path d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><path d="M7 2v3M10 2v3M13 2v3"/></svg>`,
  'ICON_LIST.house':        `<svg ${_sa}><path d="M3 10l9-7 9 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10z"/><path d="M9 21v-7h6v7"/></svg>`,
  'ICON_LIST.phone':        `<svg ${_sa}><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M12 18h.01"/></svg>`,
  'ICON_LIST.pill':         `<svg ${_sa}><path d="M8 2h0a6 6 0 016 6v8a6 6 0 01-6 6h0a6 6 0 01-6-6V8a6 6 0 016-6z"/><path d="M2 12h12"/></svg>`,
  'ICON_LIST.graduation':   `<svg ${_sa}><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2.7 3 6 3s6-1 6-3v-5"/><path d="M22 10v6"/></svg>`,
  'ICON_LIST.gamepad':      `<svg ${_sa}><rect x="3" y="7" width="18" height="11" rx="2"/><path d="M7 12h4M9 10v4"/><circle cx="16" cy="11" r=".5" fill="currentColor"/><circle cx="14.5" cy="14" r=".5" fill="currentColor"/></svg>`,
  'ICON_LIST.car':          `<svg ${_sa}><path d="M5 17h14M7 7l-2 4h14l-2-4H7z"/><rect x="3" y="11" width="18" height="6" rx="1"/><circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/></svg>`,
  'ICON_LIST.plane':        `<svg ${_sa}><path d="M12 2L4 8l2 2 4-1v5l-3 2v2l5-1 5 1v-2l-3-2V9l4 1 2-2-8-6z"/></svg>`,
  'ICON_LIST.scissors':     `<svg ${_sa}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/></svg>`,
  'ICON_LIST.gift':         `<svg ${_sa}><rect x="3" y="8" width="18" height="4"/><rect x="5" y="12" width="14" height="9"/><path d="M12 8v13"/><path d="M12 8c-1-3-4-4-4-4s2 1 4 4M12 8c1-3 4-4 4-4s-2 1-4 4"/></svg>`,
  'ICON_LIST.dumbbell':     `<svg ${_sa}><path d="M6 7v10M18 7v10M3 8v8M21 8v8M3 12h18"/></svg>`,
  'ICON_LIST.package2':     `<svg ${_sa}><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>`,
  'ICON_LIST.wrench':       `<svg ${_sa}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.8-3.8a6 6 0 01-7.9 7.9l-6.9 6.9a2 2 0 01-2.8-2.8l6.9-6.9a6 6 0 017.9-7.9l-3.8 3.8z"/></svg>`,
  'ICON_LIST.laptop':       `<svg ${_sa}><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/></svg>`,
  'ICON_LIST.music':        `<svg ${_sa}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  'ICON_LIST.tv':           `<svg ${_sa}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M12 2l-5 5M12 2l5 5"/></svg>`,
  'ICON_LIST.paw':          `<svg ${_sa}><circle cx="11" cy="4" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="18" cy="8" r="1.5"/><path d="M12 22c-4 0-6-2-6-4.5S9 13 12 13s6 2.5 6 4.5S16 22 12 22z"/></svg>`,
  'ICON_LIST.shopping':     `<svg ${_sa}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
  'ICON_LIST.piggy':        `<svg ${_sa}><path d="M19 5c-2 0-3 2-4 4H9C8 7 7 5 5 5S2 7 2 9c0 1 1 2 2 3 0 1 0 2 0 3 0 3 4 5 8 5s8-2 8-5c0-1 0-2 0-3 1-1 2-2 2-3 0-2-1-4-3-4z"/><path d="M10 13h.01M14 13h.01"/></svg>`,
  'ICON_LIST.book':         `<svg ${_sa}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
  'ICON_LIST.beer':         `<svg ${_sa}><path d="M17 11h1a3 3 0 010 6h-1"/><path d="M5 8v12a2 2 0 002 2h8a2 2 0 002-2V8"/><path d="M5 8h12"/><path d="M9 4v4M13 4v4"/></svg>`,
  'ICON_LIST.hospital':     `<svg ${_sa}><path d="M22 12h-6l-2 7L10 5l-2 7H2"/></svg>`,
  'ICON_LIST.bulb':         `<svg ${_sa}><path d="M9 18h6M10 22h4"/><path d="M15 14c1-1 2-3 2-5a5 5 0 00-10 0c0 2 1 4 2 5"/></svg>`,
  'ICON_LIST.shower':       `<svg ${_sa}><path d="M4 4v5h16M7 14v3M10 14v5M13 14v3M16 14v5"/></svg>`,
  'ICON_LIST.film':         `<svg ${_sa}><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5"/></svg>`,
  'ICON_LIST.baby':         `<svg ${_sa}><circle cx="12" cy="12" r="8"/><path d="M9 13h.01M15 13h.01"/><path d="M10 16.5a3 3 0 004 0"/></svg>`,
  'ICON_LIST.ring':         `<svg ${_sa}><circle cx="12" cy="15" r="6"/><path d="M12 9V3M9 5l3 4 3-4"/></svg>`,
  'ICON_LIST.camera':       `<svg ${_sa}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="3.5"/></svg>`,
  'ICON_LIST.broom':        `<svg ${_sa}><path d="M12 2v9M5 14h14l-2 8H7z"/></svg>`,
  'ICON_LIST.wallet':       `<svg ${_sa}><path d="M20 7H5a2 2 0 00-2 2v10a2 2 0 002 2h15V7z"/><path d="M20 7V5a2 2 0 00-2-2H7"/><circle cx="17" cy="14" r="1.5"/></svg>`,
  /* ── IC (excluding ck, dl) ── */
  'IC.food':   `<svg ${_sa}><path d="M17 8h1a4 4 0 010 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><path d="M7 2v3M10 2v3M13 2v3"/></svg>`,
  'IC.save':   `<svg ${_sa}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>`,
  'IC.shopee': `<svg ${_sa}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`,
  'IC.gas':    `<svg ${_sa}><path d="M3 22V6a2 2 0 012-2h8a2 2 0 012 2v16"/><path d="M3 22h12"/><path d="M15 10h2a2 2 0 012 2v2a2 2 0 002 2"/><path d="M5 8h8"/></svg>`,
  'IC.inc':    `<svg ${_sa}><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
  'IC.other':  `<svg ${_sa}><path d="M20 7H5a2 2 0 00-2 2v10a2 2 0 002 2h15V7z"/><path d="M20 7V5a2 2 0 00-2-2H7"/><circle cx="17" cy="14" r="1.5"/></svg>`,
  'IC.cal':    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>`,
};

const CAT_KEYS = [
  'shopee','grab','netflix','youtube','lineman','starbucks','truemoney',
  'kasikornbank','scb','visa','coffee','house','phone','pill','graduation',
  'gamepad','car','plane','scissors','gift','dumbbell','package2','wrench',
  'laptop','music','tv','paw','shopping','piggy','book','beer','hospital',
  'bulb','shower','film','baby','ring','camera','broom','wallet'
];
const SYS_KEYS = ['food','save','shopee','gas','inc','other','cal'];

/* ════════════════════════════════════════════
   STATE
   ════════════════════════════════════════════ */
let customIcons  = {};
let editingKey   = null;
let currentTab   = 'svg';
let pendingFile  = null; // file upload result waiting to be saved
let indexDefaults = {};  // { 'INDEX.<id>': '<svg ...>' } — populated from fetched index.html
let indexKeys     = [];  // ordered list of 'INDEX.<id>' keys discovered in index.html

/* ════════════════════════════════════════════
   AUTH
   ════════════════════════════════════════════ */
async function hashPass(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isAuthed() { return sessionStorage.getItem('icon_admin') === '1'; }
function setSession() { sessionStorage.setItem('icon_admin', '1'); }

async function doLogin() {
  const inp  = document.getElementById('passInput');
  const pass = inp.value.trim();
  if (!pass) return;

  /* ── Setup mode: just generate and display the hash ── */
  if (ADMIN_PASS_HASH === '__SETUP__') {
    const h   = await hashPass(pass);
    const out = document.getElementById('hashOut');
    out.textContent = h;
    out.style.display = 'block';
    return;
  }

  /* ── Normal mode: verify ── */
  const h = await hashPass(pass);
  if (h === ADMIN_PASS_HASH) {
    setSession();
    document.getElementById('gate').style.display   = 'none';
    document.getElementById('editor').style.display = 'block';
    initEditor();
  } else {
    inp.value = '';
    inp.classList.add('shake');
    setTimeout(() => inp.classList.remove('shake'), 400);
    document.getElementById('gateErr').textContent = 'รหัสผ่านไม่ถูกต้อง';
  }
}

/* ════════════════════════════════════════════
   STORE HELPERS
   ════════════════════════════════════════════ */
function readStore() {
  try {
    const store = JSON.parse(localStorage.getItem('okane_v3') || '{}');
    customIcons = store.customIcons || {};
  } catch(e) {
    customIcons = {};
  }
}

function writeCustomIcons() {
  try {
    const store = JSON.parse(localStorage.getItem('okane_v3') || '{}');
    store.customIcons = customIcons;
    localStorage.setItem('okane_v3', JSON.stringify(store));
  } catch(e) {
    console.error('[icons] writeCustomIcons failed', e);
  }
}

function applyTheme() {
  try {
    const store = JSON.parse(localStorage.getItem('okane_v3') || '{}');
    document.documentElement.setAttribute('data-theme', store.theme || 'light');
  } catch(e) {}
}

/* ════════════════════════════════════════════
   INDEX.HTML SVG DISCOVERY
   — Fetch index.html and collect every <svg data-icon-id="...">
     so the editor stays in sync whenever someone adds a new SVG
     (just tag it with data-icon-id and it appears here automatically).
   ════════════════════════════════════════════ */
async function loadIndexDefaults() {
  try {
    const res  = await fetch('./index.html', { cache: 'no-store' });
    const text = await res.text();
    const doc  = new DOMParser().parseFromString(text, 'text/html');
    const svgs = doc.querySelectorAll('svg[data-icon-id]');
    indexDefaults = {};
    indexKeys     = [];
    svgs.forEach(svg => {
      const id  = svg.getAttribute('data-icon-id');
      if (!id) return;
      const key = 'INDEX.' + id;
      if (key in indexDefaults) return; // keep first occurrence
      indexDefaults[key] = svg.outerHTML;
      indexKeys.push(key);
    });
  } catch (e) {
    console.error('[icons] loadIndexDefaults failed', e);
    indexDefaults = {};
    indexKeys     = [];
  }
}

/* ════════════════════════════════════════════
   EDITOR INIT
   ════════════════════════════════════════════ */
async function initEditor() {
  applyTheme();
  readStore();
  renderGrid();
  await loadIndexDefaults();
  renderIndexGrid();
}

/* ════════════════════════════════════════════
   GRID
   ════════════════════════════════════════════ */
function currentSvg(key) {
  return customIcons[key] || DEFAULTS[key] || indexDefaults[key] || '';
}

function makeCard(key, label) {
  const svg      = currentSvg(key);
  const modified = !!customIcons[key];
  return `<div class="ie-card${modified ? ' modified' : ''}" onclick="openEdit('${key}')">
    <div class="ie-card-dot"></div>
    <div class="ie-card-preview">${svg}</div>
    <div class="ie-card-label">${label}</div>
  </div>`;
}

function renderGrid() {
  document.getElementById('gridCats').innerHTML =
    CAT_KEYS.map(k => makeCard('ICON_LIST.' + k, k)).join('');
  document.getElementById('gridSys').innerHTML =
    SYS_KEYS.map(k => makeCard('IC.' + k, 'IC.' + k)).join('');
}

function renderIndexGrid() {
  const host = document.getElementById('gridIndex');
  if (!host) return;
  if (indexKeys.length === 0) {
    host.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--tx3);font-size:12px">ไม่พบ SVG ที่มี <code>data-icon-id</code> ใน index.html</div>';
    return;
  }
  host.innerHTML = indexKeys
    .map(k => makeCard(k, k.replace(/^INDEX\./, '')))
    .join('');
}

/* ════════════════════════════════════════════
   MODAL — open / close
   ════════════════════════════════════════════ */
function openEdit(key) {
  editingKey  = key;
  pendingFile = null;

  document.getElementById('modalKey').textContent = key;

  const svg = currentSvg(key);
  document.getElementById('svgInput').value       = svg;
  document.getElementById('svgErr').textContent   = '';
  document.getElementById('fileErr').textContent  = '';
  document.getElementById('fileInput').value      = '';
  document.getElementById('uploadPreview').style.display = 'none';

  updatePreview(svg);
  switchTab('svg');

  document.getElementById('modalBg').classList.add('open');
  document.getElementById('editModal').classList.add('open');
}

function closeModal() {
  document.getElementById('modalBg').classList.remove('open');
  document.getElementById('editModal').classList.remove('open');
  editingKey  = null;
  pendingFile = null;
}

/* ════════════════════════════════════════════
   MODAL — live preview + tab switching
   ════════════════════════════════════════════ */
function updatePreview(svgCode) {
  document.getElementById('modalPreview').innerHTML = svgCode || '';
}

function onSvgInput() {
  updatePreview(document.getElementById('svgInput').value.trim());
  document.getElementById('svgErr').textContent = '';
}

function switchTab(name) {
  currentTab = name;
  document.getElementById('tabSvg').classList.toggle('on',  name === 'svg');
  document.getElementById('tabFile').classList.toggle('on', name === 'file');
  document.getElementById('panelSvg').classList.toggle('on',  name === 'svg');
  document.getElementById('panelFile').classList.toggle('on', name === 'file');
}

/* ════════════════════════════════════════════
   FILE UPLOAD
   ════════════════════════════════════════════ */
function handleFile(input) {
  const file = input.files[0];
  if (!file) return;

  const err         = document.getElementById('fileErr');
  const previewWrap = document.getElementById('uploadPreview');
  const previewIc   = document.getElementById('uploadPreviewIc');
  const previewInfo = document.getElementById('uploadPreviewInfo');
  err.textContent   = '';

  const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml';

  if (isSvg) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text  = e.target.result.trim();
      pendingFile = text;
      previewIc.innerHTML   = text;
      previewInfo.innerHTML = `<b>${file.name}</b><br>SVG — สีตามธีม (ถ้าใช้ currentColor)`;
      previewWrap.style.display = 'flex';
      updatePreview(text);
    };
    reader.readAsText(file);

  } else if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const imgHtml = `<img src="${e.target.result}" alt="" style="width:100%;height:100%;object-fit:contain">`;
      pendingFile = imgHtml;
      previewIc.innerHTML   = imgHtml;
      previewInfo.innerHTML = `<b>${file.name}</b><br>รูปภาพ static — ไม่ตามสีธีม`;
      previewWrap.style.display = 'flex';
      updatePreview(imgHtml);
    };
    reader.readAsDataURL(file);

  } else {
    err.textContent = 'ไฟล์ไม่ถูกต้อง รองรับเฉพาะ .svg .png .jpg';
  }
}

/* ════════════════════════════════════════════
   SAVE / RESET
   ════════════════════════════════════════════ */
/* Ensure a saved SVG string keeps (or gains) data-icon-id="<id>" so that
   the runtime scanner in app.js can still match it after replaceWith(). */
function ensureIconIdAttr(svgCode, iconId) {
  if (!svgCode || !iconId) return svgCode;
  try {
    const wrap = document.createElement('div');
    wrap.innerHTML = svgCode.trim();
    const el = wrap.querySelector('svg');
    if (!el) return svgCode; // raw image/html — leave as-is
    el.setAttribute('data-icon-id', iconId);
    return el.outerHTML;
  } catch (e) {
    return svgCode;
  }
}

function saveOne() {
  let svgCode;

  if (currentTab === 'svg') {
    svgCode = document.getElementById('svgInput').value.trim();
    if (!svgCode) {
      document.getElementById('svgErr').textContent = 'กรุณาใส่ SVG code';
      return;
    }
  } else {
    if (!pendingFile) {
      document.getElementById('fileErr').textContent = 'กรุณาเลือกไฟล์';
      return;
    }
    svgCode = pendingFile;
  }

  if (editingKey && editingKey.startsWith('INDEX.')) {
    svgCode = ensureIconIdAttr(svgCode, editingKey.slice('INDEX.'.length));
  }

  customIcons[editingKey] = svgCode;
  writeCustomIcons();
  renderGrid();
  renderIndexGrid();
  closeModal();
}

function resetOne() {
  if (!editingKey) return;
  delete customIcons[editingKey];
  writeCustomIcons();
  renderGrid();
  renderIndexGrid();
  closeModal();
}

function resetAll() {
  if (!confirm('รีเซ็ตไอคอนทั้งหมดกลับเป็นค่าเริ่มต้น?')) return;
  customIcons = {};
  writeCustomIcons();
  renderGrid();
  renderIndexGrid();
}

/* ════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════ */
(function boot() {
  /* Setup mode UI adjustments */
  if (ADMIN_PASS_HASH === '__SETUP__') {
    document.getElementById('setupGuide').style.display = 'block';
    document.getElementById('loginBtn').textContent     = 'สร้าง Hash';
    document.getElementById('gateSub').textContent      = 'Setup Mode — ยังไม่มีรหัสผ่าน';
  }

  /* Enter key triggers login */
  document.getElementById('passInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });

  /* If already authenticated this session, go straight to editor */
  if (isAuthed()) {
    document.getElementById('gate').style.display   = 'none';
    document.getElementById('editor').style.display = 'block';
    initEditor();
  }
})();

/* Okane — shared icon defaults for admin panel */
(function (global) {
  'use strict';
const _sa = 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

/* ════════════════════════════════════════════
   DEFAULTS — 40 ICON_LIST + 7 IC (excl. ck/dl)
   ════════════════════════════════════════════ */
const DEFAULTS = {
  /* ── ICON_LIST ── */
  'ICON_LIST.shopee':       `<svg ${_sa}><path d="M5 8h14l-1 11.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 19.5z"/><path d="M8.5 8V6.5a3.5 3.5 0 017 0V8"/></svg>`,
  'ICON_LIST.grab':         `<svg ${_sa}><path d="M20 10c0 5.5-8 11.5-8 11.5S4 15.5 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
  'ICON_LIST.netflix':      `<svg ${_sa}><path d="M7 4v16M17 4v16M7 4l10 16"/></svg>`,
  'ICON_LIST.youtube':      `<svg ${_sa}><rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none"/></svg>`,
  'ICON_LIST.lineman':      `<svg ${_sa}><path d="M6 9l1.5-4h9L18 9v10a2 2 0 01-2 2H8a2 2 0 01-2-2z"/><path d="M6 9h12"/><path d="M9.5 13h5"/></svg>`,
  'ICON_LIST.starbucks':    `<svg ${_sa}><path d="M7 9h10l-1 11a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 018 20z"/><path d="M6 9h12l-1-3.5H7z"/></svg>`,
  'ICON_LIST.truemoney':    `<svg ${_sa}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/><circle cx="7" cy="14" r="1.5"/></svg>`,
  'ICON_LIST.kasikornbank': `<svg ${_sa}><path d="M4 10l8-5 8 5"/><path d="M3 20h18"/><path d="M5 10v10M9 10v10M15 10v10M19 10v10"/></svg>`,
  'ICON_LIST.scb':          `<svg ${_sa}><path d="M12 3l8 3v5.5c0 5-3.5 8-8 9.5-4.5-1.5-8-4.5-8-9.5V6z"/></svg>`,
  'ICON_LIST.visa':         `<svg ${_sa}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 9h20"/><path d="M6 15h5"/></svg>`,
  'ICON_LIST.coffee':       `<svg ${_sa}><path d="M4 8h12v7a4 4 0 01-4 4H8a4 4 0 01-4-4z"/><path d="M16 10h2a2 2 0 010 4h-2"/><path d="M8 3v2M12 3v2"/></svg>`,
  'ICON_LIST.house':        `<svg ${_sa}><path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>`,
  'ICON_LIST.phone':        `<svg ${_sa}><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10 18h4"/></svg>`,
  'ICON_LIST.pill':         `<svg ${_sa}><rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><line x1="8.8" y1="15.2" x2="15.2" y2="8.8"/></svg>`,
  'ICON_LIST.graduation':   `<svg ${_sa}><path d="M3 9l9-4 9 4-9 4z"/><path d="M7 11v5c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2v-5"/><path d="M21 9v5"/></svg>`,
  'ICON_LIST.gamepad':      `<svg ${_sa}><rect x="2" y="7" width="20" height="10" rx="4"/><path d="M7 12h3M8.5 10.5v3"/><circle cx="15.5" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="14" r="1" fill="currentColor" stroke="none"/></svg>`,
  'ICON_LIST.car':          `<svg ${_sa}><path d="M5 11l2-5h10l2 5"/><path d="M3 11h18v5a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>`,
  'ICON_LIST.plane':        `<svg ${_sa}><path d="M21 4L3 11l7 3 3 7z"/><path d="M21 4L10 14"/></svg>`,
  'ICON_LIST.scissors':     `<svg ${_sa}><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8.2 7.8L20 18M8.2 16.2L20 6"/></svg>`,
  'ICON_LIST.gift':         `<svg ${_sa}><rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18"/><path d="M12 9v11"/><path d="M12 9C11 6 7 6 7 8.5S11 9 12 9M12 9c1-3 5-3 5-.5S13 9 12 9"/></svg>`,
  'ICON_LIST.dumbbell':     `<svg ${_sa}><path d="M6.5 12h11"/><rect x="3" y="9" width="3.5" height="6" rx="1"/><rect x="17.5" y="9" width="3.5" height="6" rx="1"/></svg>`,
  'ICON_LIST.package2':     `<svg ${_sa}><path d="M21 8l-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>`,
  'ICON_LIST.wrench':       `<svg ${_sa}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.8-3.8a6 6 0 01-7.9 7.9l-6.9 6.9a2 2 0 01-2.8-2.8l6.9-6.9a6 6 0 017.9-7.9l-3.8 3.8z"/></svg>`,
  'ICON_LIST.laptop':       `<svg ${_sa}><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/></svg>`,
  'ICON_LIST.music':        `<svg ${_sa}><path d="M9 17V5l11-2v12"/><circle cx="6" cy="17" r="3"/><circle cx="17" cy="15" r="3"/></svg>`,
  'ICON_LIST.tv':           `<svg ${_sa}><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 3l4 4 4-4"/></svg>`,
  'ICON_LIST.paw':          `<svg ${_sa}><circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="5" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/><path d="M12 21c-3 0-5-1.8-5-4s2-3.5 5-3.5 5 1.3 5 3.5S15 21 12 21z"/></svg>`,
  'ICON_LIST.shopping':     `<svg ${_sa}><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 4h2.5l2 11h11l2-8H7"/></svg>`,
  'ICON_LIST.piggy':        `<svg ${_sa}><path d="M16 7l1.5-2.5.5 3.5c1 .8 2 1.8 2 3.5 0 3.3-3.6 6-8 6s-8-2.7-8-6 3.6-6 8-6c1.5 0 2.9.3 4 .8z"/><circle cx="15" cy="11" r="1" fill="currentColor" stroke="none"/><path d="M20 10h2"/><path d="M7 17v3M14 17v3"/></svg>`,
  'ICON_LIST.book':         `<svg ${_sa}><path d="M5 5a2 2 0 012-2h12v16H7a2 2 0 00-2 2z"/><path d="M5 19V5"/></svg>`,
  'ICON_LIST.beer':         `<svg ${_sa}><path d="M6 8h10v11a2 2 0 01-2 2H8a2 2 0 01-2-2z"/><path d="M16 10h2a2 2 0 012 2v3a2 2 0 01-2 2h-2"/><path d="M6 8c0-2 1.5-3 3-3s2-1 3.5-1 2.5 1.5 1.5 4"/></svg>`,
  'ICON_LIST.hospital':     `<svg ${_sa}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>`,
  'ICON_LIST.bulb':         `<svg ${_sa}><path d="M9 18h6M10 21h4"/><path d="M8 13.5a5 5 0 116 0c-.6.5-1 1.2-1 2H9c0-.8-.4-1.5-1-2z"/></svg>`,
  'ICON_LIST.shower':       `<svg ${_sa}><path d="M5 10a7 7 0 0114 0z"/><path d="M5 10h14"/><path d="M9 14v1.5M12 14v2.5M15 14v1.5"/></svg>`,
  'ICON_LIST.film':         `<svg ${_sa}><rect x="3" y="8" width="18" height="12" rx="1.5"/><path d="M3 8l2.5-4 3.5 2 3-2 3.5 2 3-2L21 8"/></svg>`,
  'ICON_LIST.baby':         `<svg ${_sa}><circle cx="12" cy="12" r="8"/><circle cx="9.5" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="11" r="1" fill="currentColor" stroke="none"/><path d="M9.5 15a3 3 0 005 0"/></svg>`,
  'ICON_LIST.ring':         `<svg ${_sa}><circle cx="12" cy="15" r="6"/><path d="M9 9l3-4 3 4z"/></svg>`,
  'ICON_LIST.camera':       `<svg ${_sa}><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7l1.5-3h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/></svg>`,
  'ICON_LIST.broom':        `<svg ${_sa}><path d="M15 3l-6 8"/><path d="M6 13h8l-1 8H7z"/><path d="M9 17v3M12 17v3"/></svg>`,
  'ICON_LIST.wallet':       `<svg ${_sa}><path d="M3 7a2 2 0 012-2h12v3"/><path d="M3 7v10a2 2 0 002 2h14a1 1 0 001-1v-9a1 1 0 00-1-1H4"/><circle cx="16.5" cy="13" r="1.5"/></svg>`,
  /* ── IC (excluding ck, dl) ── */
  'IC.food':   `<svg ${_sa}><path d="M5 3v7a2 2 0 002 2v9M7 3v7M9 3v7a2 2 0 01-2 2"/><path d="M17 3c-2 1.5-3 3.5-3 5.5s1.2 3.5 3 3.5v9"/></svg>`,
  'IC.save':   `<svg ${_sa}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>`,
  'IC.shopee': `<svg ${_sa}><path d="M5 8h14l-1 11.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 19.5z"/><path d="M8.5 8V6.5a3.5 3.5 0 017 0V8"/></svg>`,
  'IC.gas':    `<svg ${_sa}><rect x="4" y="3" width="9" height="18" rx="1.5"/><path d="M4 10h9"/><path d="M3 21h11"/><path d="M13 7l3 2.5V17a1.5 1.5 0 003 0V9l-2.5-2.5"/></svg>`,
  'IC.inc':    `<svg ${_sa}><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M14.5 9.5H10a2 2 0 000 4h4a2 2 0 010 4H9"/></svg>`,
  'IC.other':  `<svg ${_sa}><path d="M3 7a2 2 0 012-2h12v3"/><path d="M3 7v10a2 2 0 002 2h14a1 1 0 001-1v-9a1 1 0 00-1-1H4"/><circle cx="16.5" cy="13" r="1.5"/></svg>`,
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
  global.OkaneIconDefaults = { DEFAULTS: DEFAULTS, CAT_KEYS: CAT_KEYS, SYS_KEYS: SYS_KEYS };
})(typeof window !== 'undefined' ? window : globalThis);

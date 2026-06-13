/* Okane — SVG sanitize / normalize utilities (shared by app + admin) */
(function (global) {
  'use strict';

  var BLOCKED_TAGS = /<\/?(script|foreignObject|iframe|object|embed|link|style)[\s>]/gi;
  var EVENT_ATTR = /\s(on[a-z]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
  var JS_URL = /\s(href|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

  function sanitizeSvg(html) {
    if (!html || typeof html !== 'string') return '';
    var out = html.trim();
    if (!out) return '';
    if (BLOCKED_TAGS.test(out)) return '';
    out = out.replace(EVENT_ATTR, '');
    out = out.replace(JS_URL, '');
    BLOCKED_TAGS.lastIndex = 0;
    return out;
  }

  function ensureIconIdAttr(svgCode, iconId) {
    if (!svgCode || !iconId) return svgCode;
    try {
      var wrap = document.createElement('div');
      wrap.innerHTML = sanitizeSvg(svgCode);
      var el = wrap.querySelector('svg');
      if (!el) return svgCode;
      el.setAttribute('data-icon-id', iconId);
      return el.outerHTML;
    } catch (e) {
      return svgCode;
    }
  }

  function normalizeSvgForTheme(svgCode) {
    var safe = sanitizeSvg(svgCode);
    if (!safe || safe.indexOf('<svg') < 0) return safe;
    try {
      var wrap = document.createElement('div');
      wrap.innerHTML = safe;
      var el = wrap.querySelector('svg');
      if (!el) return safe;
      if (!el.getAttribute('width')) el.setAttribute('width', '20');
      if (!el.getAttribute('height')) el.setAttribute('height', '20');
      if (!el.getAttribute('viewBox')) el.setAttribute('viewBox', '0 0 24 24');
      if (!el.getAttribute('aria-hidden')) el.setAttribute('aria-hidden', 'true');
      return el.outerHTML;
    } catch (e) {
      return safe;
    }
  }

  function isSvgContent(code) {
    return typeof code === 'string' && code.trim().indexOf('<svg') >= 0;
  }

  global.OkaneSvgUtils = {
    sanitizeSvg: sanitizeSvg,
    ensureIconIdAttr: ensureIconIdAttr,
    normalizeSvgForTheme: normalizeSvgForTheme,
    isSvgContent: isSvgContent
  };
})(typeof window !== 'undefined' ? window : globalThis);

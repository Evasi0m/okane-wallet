/* Okane — Global CMS loader (shared by main app + admin) */
(function (global) {
  'use strict';

  var CACHE_KEY = 'okane_global_cms';
  var CACHE_TTL_MS = 5 * 60 * 1000;

  var _data = {
    icons: {},
    strings: {},
    assets: {},
    meta: { updated_at: null, default_theme: 'light', feature_flags: {} },
    fetchedAt: 0
  };

  var STRING_CATALOG = {
    'welcome.title': 'Okane Wallet',
    'welcome.sub': 'บันทึกรายรับ-รายจ่ายส่วนตัวแบบละเมียดละไม',
    'welcome.foot': 'ข้อมูลทั้งหมดถูกจัดเก็บอย่างปลอดภัยบนระบบคลาวด์ของ Supabase',
    'nav.daily': 'รายวัน',
    'nav.monthly': 'รายเดือน',
    'nav.yearly': 'รายปี',
    'nav.sim': 'จำลอง',
    'setup.banner.title': 'เริ่มต้นใช้งานครั้งแรก',
    'setup.banner.sub': 'เพิ่มเงินเดือนและสร้างหมวดค่าใช้จ่ายก่อน เพื่อให้รายเดือน รายวัน และรายปีคำนวณได้ครบ',
    'app.name': 'Okane Wallet',
    'app.short_name': 'Okane'
  };

  var ASSET_SELECTORS = {
    mascot: ['.w-logo', '#hdrLogoImg'],
    income_wallet: ['.income-wallet-icon']
  };

  function sanitize(code) {
    return global.OkaneSvgUtils ? global.OkaneSvgUtils.sanitizeSvg(code) : code;
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeCache(payload) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  function applyPayload(payload) {
    if (!payload) return;
    _data.icons = payload.icons || {};
    _data.strings = payload.strings || {};
    _data.assets = payload.assets || {};
    _data.meta = payload.meta || _data.meta;
    _data.fetchedAt = payload.fetchedAt || Date.now();
  }

  function cacheIsFresh(cached) {
    if (!cached || !cached.fetchedAt) return false;
    if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) return false;
    return true;
  }

  function metaIsNewer(remoteMeta, cachedMeta) {
    if (!remoteMeta || !remoteMeta.updated_at) return false;
    if (!cachedMeta || !cachedMeta.updated_at) return true;
    return new Date(remoteMeta.updated_at).getTime() > new Date(cachedMeta.updated_at).getTime();
  }

  function buildPayloadFromRows(iconsRows, stringsRows, assetsRows, metaRow) {
    var icons = {};
    (iconsRows || []).forEach(function (row) {
      if (row.icon_key && row.svg_content) icons[row.icon_key] = sanitize(row.svg_content);
    });
    var strings = {};
    (stringsRows || []).forEach(function (row) {
      if (row.string_key && row.value != null) strings[row.string_key] = String(row.value);
    });
    var assets = {};
    (assetsRows || []).forEach(function (row) {
      if (row.asset_key && row.public_url) assets[row.asset_key] = String(row.public_url);
    });
    var metaAssets = metaRow && metaRow.assets && typeof metaRow.assets === 'object' ? metaRow.assets : {};
    Object.keys(metaAssets).forEach(function (k) {
      if (metaAssets[k]) assets[k] = String(metaAssets[k]);
    });
    var meta = {
      updated_at: metaRow && metaRow.updated_at ? metaRow.updated_at : null,
      default_theme: metaRow && metaRow.default_theme ? metaRow.default_theme : 'light',
      feature_flags: metaRow && metaRow.feature_flags ? metaRow.feature_flags : {}
    };
    return {
      icons: icons,
      strings: strings,
      assets: assets,
      meta: meta,
      fetchedAt: Date.now()
    };
  }

  function loadGlobalCMS(client, opts) {
    opts = opts || {};
    var force = !!opts.force;
    var cached = readCache();
    if (!force && cacheIsFresh(cached)) {
      applyPayload(cached);
      return Promise.resolve(_data);
    }
    if (!client) {
      if (cached) applyPayload(cached);
      return Promise.resolve(_data);
    }
    return Promise.all([
      client.from('global_icons').select('icon_key,svg_content'),
      client.from('app_strings').select('string_key,value'),
      client.from('app_assets').select('asset_key,public_url'),
      client.from('app_meta').select('*').eq('id', 'default').maybeSingle()
    ]).then(function (results) {
      var iconsRes = results[0];
      var stringsRes = results[1];
      var assetsRes = results[2];
      var metaRes = results[3];
      if (iconsRes.error) throw iconsRes.error;
      if (stringsRes.error) throw stringsRes.error;
      if (assetsRes.error) throw assetsRes.error;
      if (metaRes.error) throw metaRes.error;
      var remoteMeta = metaRes.data;
      if (!force && cached && !metaIsNewer(remoteMeta, cached.meta)) {
        applyPayload(cached);
        return _data;
      }
      var payload = buildPayloadFromRows(iconsRes.data, stringsRes.data, assetsRes.data, remoteMeta);
      applyPayload(payload);
      writeCache(payload);
      return _data;
    }).catch(function (err) {
      console.warn('[CMS] loadGlobalCMS failed', err);
      if (cached) applyPayload(cached);
      return _data;
    });
  }

  function getMergedIcons(localCustom) {
    var out = {};
    Object.keys(_data.icons).forEach(function (k) { out[k] = _data.icons[k]; });
    localCustom = localCustom || {};
    Object.keys(localCustom).forEach(function (k) {
      if (k.indexOf('INDEX.') === 0 || k.indexOf('IC.') === 0) return;
      if (_data.icons[k]) return;
      if (k.indexOf('ICON_LIST.') === 0) out[k] = localCustom[k];
    });
    return out;
  }

  function applyGlobalToIconObjects(ICON_LIST, IC, mergedIcons) {
    Object.keys(mergedIcons).forEach(function (k) {
      var p = k.split('.');
      if (p[0] === 'ICON_LIST' && p[1] && ICON_LIST && p[1] in ICON_LIST) ICON_LIST[p[1]] = mergedIcons[k];
      if (p[0] === 'IC' && p[1] && IC && p[1] in IC) IC[p[1]] = mergedIcons[k];
    });
  }

  function applyIndexSvgOverridesFromMap(map) {
    if (!map || typeof document === 'undefined') return;
    var nodes = document.querySelectorAll('svg[data-icon-id]');
    nodes.forEach(function (el) {
      var id = el.getAttribute('data-icon-id');
      var key = 'INDEX.' + id;
      var rep = map[key];
      if (!rep) return;
      var safe = sanitize(rep);
      var wrap = document.createElement('div');
      wrap.innerHTML = safe.trim();
      var fresh = wrap.querySelector('svg');
      if (!fresh) return;
      if (!fresh.getAttribute('data-icon-id')) fresh.setAttribute('data-icon-id', id);
      el.replaceWith(fresh);
    });
  }

  function applyGlobalAssets() {
    if (typeof document === 'undefined') return;
    Object.keys(ASSET_SELECTORS).forEach(function (key) {
      var url = _data.assets[key];
      if (!url) return;
      ASSET_SELECTORS[key].forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
          if (el.tagName === 'IMG') el.src = url;
          else if (el.tagName === 'SVG') {
            /* keep inline svg */
          } else {
            var img = el.querySelector('img');
            if (img) img.src = url;
          }
        });
      });
    });
    var mascot = _data.assets.mascot;
    if (mascot) {
      var link = document.querySelector('link[rel="icon"]');
      if (link && mascot.indexOf('.svg') >= 0) link.href = mascot;
    }
  }

  function applyGlobalStrings() {
    if (typeof document === 'undefined') return;
    Object.keys(STRING_CATALOG).forEach(function (key) {
      var val = cms(key, STRING_CATALOG[key]);
      var nodes = document.querySelectorAll('[data-cms="' + key + '"]');
      nodes.forEach(function (el) { el.textContent = val; });
    });
  }

  function cms(key, fallback) {
    if (_data.strings && _data.strings[key] != null && _data.strings[key] !== '') return _data.strings[key];
    return fallback != null ? fallback : '';
  }

  function isGlobalManagedIconKey(key) {
    return key.indexOf('INDEX.') === 0 || key.indexOf('IC.') === 0;
  }

  function shouldSyncUserIconKey(key, globalIcons) {
    if (isGlobalManagedIconKey(key)) return false;
    if (globalIcons && globalIcons[key]) return false;
    return key.indexOf('ICON_LIST.') === 0;
  }

  function bumpAppMeta(client) {
    if (!client) return Promise.reject(new Error('No Supabase client'));
    return client.from('app_meta').upsert({
      id: 'default',
      updated_at: new Date().toISOString()
    }).then(function (res) {
      if (res.error) throw res.error;
      try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
      return loadGlobalCMS(client, { force: true });
    });
  }

  function exportBundle() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      icons: _data.icons,
      strings: _data.strings,
      assets: _data.assets,
      meta: _data.meta
    }, null, 2);
  }

  function importBundle(json, client) {
    var bundle = typeof json === 'string' ? JSON.parse(json) : json;
    if (!client) return Promise.reject(new Error('No Supabase client'));
    var ops = [];
    Object.keys(bundle.icons || {}).forEach(function (k) {
      ops.push(client.from('global_icons').upsert({
        icon_key: k,
        svg_content: sanitize(bundle.icons[k]),
        updated_at: new Date().toISOString()
      }));
    });
    Object.keys(bundle.strings || {}).forEach(function (k) {
      ops.push(client.from('app_strings').upsert({
        string_key: k,
        value: String(bundle.strings[k]),
        updated_at: new Date().toISOString()
      }));
    });
    Object.keys(bundle.assets || {}).forEach(function (k) {
      ops.push(client.from('app_assets').upsert({
        asset_key: k,
        public_url: String(bundle.assets[k]),
        updated_at: new Date().toISOString()
      }));
    });
    return Promise.all(ops).then(function () { return bumpAppMeta(client); });
  }

  global.OkaneCMS = {
    CACHE_KEY: CACHE_KEY,
    STRING_CATALOG: STRING_CATALOG,
    ASSET_KEYS: ['mascot', 'income_wallet', 'favicon'],
    get data() { return _data; },
    loadGlobalCMS: loadGlobalCMS,
    getMergedIcons: getMergedIcons,
    applyGlobalToIconObjects: applyGlobalToIconObjects,
    applyIndexSvgOverridesFromMap: applyIndexSvgOverridesFromMap,
    applyGlobalAssets: applyGlobalAssets,
    applyGlobalStrings: applyGlobalStrings,
    cms: cms,
    isGlobalManagedIconKey: isGlobalManagedIconKey,
    shouldSyncUserIconKey: shouldSyncUserIconKey,
    bumpAppMeta: bumpAppMeta,
    exportBundle: exportBundle,
    importBundle: importBundle,
    clearCache: function () { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} }
  };
})(typeof window !== 'undefined' ? window : globalThis);

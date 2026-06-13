/* Okane Admin — shell, auth, routing */
(function () {
  'use strict';

  var supabase = window.supabase
    ? window.supabase.createClient(window.OKANE_SUPABASE_URL, window.OKANE_SUPABASE_KEY)
    : null;

  var state = {
    user: null,
    isAdmin: false,
    route: 'dashboard',
    globalIcons: {}
  };

  var TITLES = {
    dashboard: 'แดชบอร์ด',
    icons: 'ไอคอน SVG',
    assets: 'Assets',
    strings: 'ข้อความ',
    config: 'Config'
  };

  function $(id) { return document.getElementById(id); }

  function toast(msg, isErr) {
    var el = $('admToast');
    if (!el) return;
    el.textContent = msg;
    el.style.background = isErr ? 'var(--rd)' : 'var(--tx)';
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }

  function setGateErr(msg) {
    var el = $('gateErr');
    if (el) el.textContent = msg || '';
  }

  function showGate() {
    $('adminGate').hidden = false;
    $('adminApp').hidden = true;
  }

  function showApp() {
    $('adminGate').hidden = true;
    $('adminApp').hidden = false;
    document.documentElement.setAttribute('data-theme', 'light');
  }

  async function checkAdmin(userId) {
    if (!supabase || !userId) return false;
    var res = await supabase.from('profiles').select('is_admin,email,display_name').eq('id', userId).maybeSingle();
    if (res.error) throw res.error;
    return !!(res.data && res.data.is_admin);
  }

  async function afterAuth(session) {
    if (!session || !session.user) {
      showGate();
      return;
    }
    state.user = session.user;
    try {
      state.isAdmin = await checkAdmin(session.user.id);
    } catch (e) {
      setGateErr('ตรวจสอบสิทธิ์ไม่สำเร็จ: ' + e.message);
      showGate();
      return;
    }
    if (!state.isAdmin) {
      setGateErr('บัญชีนี้ไม่มีสิทธิ์ admin — ตั้ง is_admin ใน Supabase profiles');
      await supabase.auth.signOut();
      showGate();
      return;
    }
    setGateErr('');
    showApp();
    var label = session.user.email || session.user.id;
    $('adminUserLabel').textContent = label;
    await refreshCmsData();
    navigate(location.hash.replace('#', '') || 'dashboard');
  }

  async function refreshCmsData() {
    if (!window.OkaneCMS || !supabase) return;
    await OkaneCMS.loadGlobalCMS(supabase, { force: true });
    state.globalIcons = OkaneCMS.data.icons || {};
    var meta = OkaneCMS.data.meta;
    var line = meta && meta.updated_at
      ? 'CMS อัปเดตล่าสุด ' + new Date(meta.updated_at).toLocaleString('th-TH')
      : 'ยังไม่มีข้อมูล CMS';
    $('admMetaLine').textContent = line;
  }

  function navigate(route) {
    route = TITLES[route] ? route : 'dashboard';
    state.route = route;
    location.hash = route;
    $('admPageTitle').textContent = TITLES[route];
    document.querySelectorAll('.adm-nav-item').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-route') === route);
    });
    var host = $('admContent');
    if (!host) return;
    if (route === 'dashboard' && window.AdminDashboard) AdminDashboard.render(host, state);
    else if (route === 'icons' && window.AdminIcons) AdminIcons.render(host, state);
    else if (route === 'assets' && window.AdminAssets) AdminAssets.render(host, state);
    else if (route === 'strings' && window.AdminStrings) AdminStrings.render(host, state);
    else if (route === 'config' && window.AdminConfig) AdminConfig.render(host, state);
    else host.innerHTML = '<div class="adm-card">โมดูลไม่พร้อม</div>';
  }

  async function emailLogin() {
    var email = ($('gateEmail').value || '').trim();
    var pass = ($('gatePass').value || '').trim();
    if (!email || !pass) { setGateErr('กรอกอีเมลและรหัสผ่าน'); return; }
    setGateErr('');
    $('gateLoginBtn').disabled = true;
    var res = await supabase.auth.signInWithPassword({ email: email, password: pass });
    $('gateLoginBtn').disabled = false;
    if (res.error) { setGateErr(res.error.message); return; }
    await afterAuth(res.data.session);
  }

  function googleLogin() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href.split('#')[0] }
    });
  }

  async function logout() {
    await supabase.auth.signOut();
    state.user = null;
    state.isAdmin = false;
    showGate();
  }

  window.AdminApp = {
    supabase: supabase,
    state: state,
    toast: toast,
    refreshCmsData: refreshCmsData,
    navigate: navigate,
    publishIcon: async function (iconKey, svgContent) {
      var safe = OkaneSvgUtils.sanitizeSvg(svgContent);
      if (!safe) throw new Error('SVG ไม่ถูกต้องหรือไม่ปลอดภัย');
      if (iconKey.indexOf('INDEX.') === 0) {
        safe = OkaneSvgUtils.ensureIconIdAttr(safe, iconKey.slice('INDEX.'.length));
      }
      var res = await supabase.from('global_icons').upsert({
        icon_key: iconKey,
        svg_content: safe,
        updated_at: new Date().toISOString()
      });
      if (res.error) throw res.error;
      await OkaneCMS.bumpAppMeta(supabase);
      state.globalIcons[iconKey] = safe;
      await refreshCmsData();
    },
    deleteIcon: async function (iconKey) {
      var res = await supabase.from('global_icons').delete().eq('icon_key', iconKey);
      if (res.error) throw res.error;
      delete state.globalIcons[iconKey];
      await OkaneCMS.bumpAppMeta(supabase);
      await refreshCmsData();
    },
    saveString: async function (key, value) {
      var res = await supabase.from('app_strings').upsert({
        string_key: key,
        value: String(value),
        updated_at: new Date().toISOString()
      });
      if (res.error) throw res.error;
      await OkaneCMS.bumpAppMeta(supabase);
      await refreshCmsData();
    },
    deleteString: async function (key) {
      var res = await supabase.from('app_strings').delete().eq('string_key', key);
      if (res.error) throw res.error;
      await OkaneCMS.bumpAppMeta(supabase);
      await refreshCmsData();
    },
    saveAssetRecord: async function (assetKey, publicUrl, mimeType) {
      var res = await supabase.from('app_assets').upsert({
        asset_key: assetKey,
        public_url: publicUrl,
        mime_type: mimeType || null,
        updated_at: new Date().toISOString()
      });
      if (res.error) throw res.error;
      var metaRes = await supabase.from('app_meta').select('assets').eq('id', 'default').maybeSingle();
      var assets = (metaRes.data && metaRes.data.assets) || {};
      assets[assetKey] = publicUrl;
      await supabase.from('app_meta').upsert({
        id: 'default',
        assets: assets,
        updated_at: new Date().toISOString()
      });
      await OkaneCMS.bumpAppMeta(supabase);
      await refreshCmsData();
    },
    uploadAssetFile: async function (assetKey, file) {
      var ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      var path = assetKey + '/' + Date.now() + '.' + ext;
      var res = await supabase.storage.from('app-assets').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || undefined
      });
      if (res.error) throw res.error;
      var pub = supabase.storage.from('app-assets').getPublicUrl(path);
      var url = pub.data.publicUrl;
      await AdminApp.saveAssetRecord(assetKey, url, file.type);
      return url;
    },
    saveAppMeta: async function (patch) {
      var row = Object.assign({ id: 'default', updated_at: new Date().toISOString() }, patch);
      var res = await supabase.from('app_meta').upsert(row);
      if (res.error) throw res.error;
      await OkaneCMS.bumpAppMeta(supabase);
      await refreshCmsData();
    }
  };

  window.AdminDashboard = {
    render: function (host, st) {
      var icons = Object.keys(st.globalIcons || {}).length;
      var strings = Object.keys(OkaneCMS.data.strings || {}).length;
      var assets = Object.keys(OkaneCMS.data.assets || {}).length;
      host.innerHTML =
        '<div class="adm-stat-grid">' +
        '<div class="adm-stat"><b>' + icons + '</b><small>ไอคอน global</small></div>' +
        '<div class="adm-stat"><b>' + strings + '</b><small>ข้อความแก้แล้ว</small></div>' +
        '<div class="adm-stat"><b>' + assets + '</b><small>assets</small></div>' +
        '</div>' +
        '<div class="adm-card" style="margin-top:12px"><div class="adm-card-t">เริ่มต้น</div>' +
        '<p style="font-size:13px;color:var(--tx2);line-height:1.6;margin-bottom:12px">Publish ไอคอนหรือข้อความแล้วผู้ใช้ทุกคนจะเห็นหลัง refresh (cache CMS ~5 นาที)</p>' +
        '<div class="adm-row"><button class="btn btn-ac" type="button" onclick="AdminApp.navigate(\'icons\')">จัดการไอคอน</button>' +
        '<button class="btn btn-gh" type="button" onclick="AdminApp.refreshCmsData()">รีเฟรช CMS</button></div></div>';
    }
  };

  document.querySelectorAll('.adm-nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      navigate(btn.getAttribute('data-route'));
    });
  });

  $('gateGoogleBtn').addEventListener('click', googleLogin);
  $('gateLoginBtn').addEventListener('click', emailLogin);
  $('gatePass').addEventListener('keydown', function (e) { if (e.key === 'Enter') emailLogin(); });
  $('adminLogoutBtn').addEventListener('click', logout);
  window.addEventListener('hashchange', function () {
    if (state.isAdmin) navigate(location.hash.replace('#', '') || 'dashboard');
  });

  if (!supabase) {
    setGateErr('Supabase ไม่พร้อม');
    return;
  }

  supabase.auth.getSession().then(function (r) { return afterAuth(r.data.session); });
  supabase.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_OUT') showGate();
    else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') afterAuth(session);
  });
})();

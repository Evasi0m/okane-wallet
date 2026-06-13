/* Admin — App config, export/import */
(function () {
  'use strict';

  async function saveTheme() {
    var sel = document.getElementById('admCfgTheme');
    if (!sel) return;
    try {
      await AdminApp.saveAppMeta({ default_theme: sel.value });
      AdminApp.toast('บันทึก theme แล้ว');
    } catch (e) {
      AdminApp.toast(e.message, true);
    }
  }

  function exportBundle() {
    var json = OkaneCMS.exportBundle();
    var blob = new Blob([json], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'okane-cms-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    AdminApp.toast('Export แล้ว');
  }

  async function importBundle(input) {
    var file = input.files[0];
    if (!file) return;
    var text = await file.text();
    try {
      await OkaneCMS.importBundle(text, AdminApp.supabase);
      await AdminApp.refreshCmsData();
      AdminApp.toast('Import สำเร็จ');
      AdminApp.navigate('config');
    } catch (e) {
      AdminApp.toast(e.message || String(e), true);
    }
  }

  window.AdminConfig = {
    render: function (host) {
      var meta = (window.OkaneCMS && OkaneCMS.data.meta) || {};
      host.innerHTML =
        '<div class="adm-card"><div class="adm-card-t">App meta</div>' +
        '<label style="font-size:13px;display:block;margin-bottom:6px">Default theme</label>' +
        '<div class="adm-row"><select class="adm-inp" id="admCfgTheme" style="max-width:240px;margin:0">' +
        [{ id: 'light', label: 'Champagne Luxe' }, { id: 'pink-vanilla', label: 'Pink Vanilla' }, { id: 'pistachio-nature', label: 'Pistachio Nature' }].map(function (t) {
          return '<option value="' + t.id + '"' + (meta.default_theme === t.id ? ' selected' : '') + '>' + t.label + '</option>';
        }).join('') +
        '</select><button type="button" class="btn btn-ac" onclick="AdminConfig.saveTheme()">บันทึก</button></div>' +
        '<p style="font-size:11px;color:var(--tx3);margin-top:10px">updated_at: ' + (meta.updated_at || '—') + '</p></div>' +
        '<div class="adm-card"><div class="adm-card-t">Backup / Restore</div>' +
        '<p style="font-size:12px;color:var(--tx2);margin-bottom:12px">Export/Import JSON bundle (icons + strings + assets refs)</p>' +
        '<div class="adm-row">' +
        '<button type="button" class="btn btn-gh" onclick="AdminConfig.exportBundle()">Export JSON</button>' +
        '<label class="btn btn-gh" style="cursor:pointer">Import JSON<input type="file" accept="application/json,.json" hidden onchange="AdminConfig.importBundle(this)"></label>' +
        '<button type="button" class="btn btn-gh" onclick="OkaneCMS.clearCache();AdminApp.toast(\'ล้าง cache แล้ว\')">ล้าง CMS cache (local)</button>' +
        '</div></div>' +
        '<div class="adm-card"><div class="adm-card-t">Setup</div>' +
        '<p style="font-size:12px;color:var(--tx2);line-height:1.6">1. รัน SQL ใน <code>supabase/migrations/001_global_cms.sql</code><br>' +
        '2. ตั้ง admin: <code>UPDATE profiles SET is_admin = true WHERE email = \'...\';</code></p></div>';
    },
    saveTheme: saveTheme,
    exportBundle: exportBundle,
    importBundle: importBundle
  };
})();

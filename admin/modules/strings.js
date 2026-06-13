/* Admin — String editor */
(function () {
  'use strict';

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function catalog() {
    return window.OkaneCMS ? OkaneCMS.STRING_CATALOG : {};
  }

  async function saveKey(key) {
    var inp = document.getElementById('str_' + key.replace(/\./g, '_'));
    if (!inp) return;
    try {
      await AdminApp.saveString(key, inp.value);
      AdminApp.toast('บันทึก ' + key);
    } catch (e) {
      AdminApp.toast(e.message, true);
    }
  }

  async function resetKey(key) {
    if (!confirm('ลบ override ของ ' + key + '?')) return;
    try {
      await AdminApp.deleteString(key);
      AdminApp.toast('รีเซ็ตแล้ว');
      AdminApp.navigate('strings');
    } catch (e) {
      AdminApp.toast(e.message, true);
    }
  }

  window.AdminStrings = {
    render: function (host) {
      var cat = catalog();
      var remote = (window.OkaneCMS && OkaneCMS.data.strings) || {};
      var rows = Object.keys(cat).map(function (key) {
        var id = 'str_' + key.replace(/\./g, '_');
        var val = remote[key] != null ? remote[key] : cat[key];
        var overridden = remote[key] != null;
        return '<div class="adm-string-row">' +
          '<div><code style="font-size:11px">' + esc(key) + '</code>' +
          (overridden ? ' <span style="color:var(--ac);font-size:10px">●</span>' : '') + '</div>' +
          '<textarea class="adm-ta" id="' + id + '" rows="2">' + esc(val) + '</textarea>' +
          '<div style="display:flex;flex-direction:column;gap:4px">' +
          '<button type="button" class="btn btn-ac" onclick="AdminStrings.save(\'' + key + '\')">Save</button>' +
          (overridden ? '<button type="button" class="btn btn-gh" onclick="AdminStrings.reset(\'' + key + '\')">Reset</button>' : '') +
          '</div></div>';
      }).join('');
      host.innerHTML =
        '<div class="adm-card"><div class="adm-card-t">ข้อความ UI (data-cms)</div>' +
        '<p style="font-size:12px;color:var(--tx2);margin-bottom:12px">แก้ข้อความที่มี <code>data-cms</code> ใน index.html และจุดที่เรียก <code>cms()</code></p>' +
        rows + '</div>';
    },
    save: saveKey,
    reset: resetKey
  };
})();

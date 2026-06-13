/* Admin — Asset manager (Supabase Storage) */
(function () {
  'use strict';

  var KEYS = [
    { key: 'mascot', label: 'Mascot / Logo', hint: '.w-logo, #hdrLogoImg, favicon' },
    { key: 'income_wallet', label: 'Income wallet icon', hint: 'ไอคอนรายรับ' },
    { key: 'favicon', label: 'Favicon', hint: 'link rel=icon' }
  ];

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  async function onUpload(assetKey, input) {
    var file = input.files[0];
    if (!file) return;
    try {
      AdminApp.toast('กำลังอัปโหลด…');
      var url = await AdminApp.uploadAssetFile(assetKey, file);
      AdminApp.toast('อัปโหลดสำเร็จ');
      AdminApp.navigate('assets');
    } catch (e) {
      AdminApp.toast(e.message || String(e), true);
    }
  }

  window.AdminAssets = {
    render: function (host, st) {
      var assets = (window.OkaneCMS && OkaneCMS.data.assets) || {};
      var rows = KEYS.map(function (item) {
        var url = assets[item.key] || '';
        return '<div class="adm-asset-row">' +
          (url ? '<img class="adm-asset-thumb" src="' + esc(url) + '" alt="">' : '<div class="adm-asset-thumb"></div>') +
          '<div style="flex:1"><strong>' + esc(item.label) + '</strong><br>' +
          '<small style="color:var(--tx3)">' + esc(item.hint) + '</small><br>' +
          (url ? '<code style="font-size:10px;word-break:break-all">' + esc(url) + '</code>' : '<span style="font-size:11px;color:var(--tx3)">ยังไม่ตั้งค่า</span>') +
          '</div>' +
          '<label class="btn btn-gh" style="cursor:pointer">' +
          'อัปโหลด<input type="file" accept=".svg,.png,.jpg,.jpeg,.webp,image/*" hidden onchange="AdminAssets.upload(\'' + item.key + '\',this)">' +
          '</label></div>';
      }).join('');
      host.innerHTML =
        '<div class="adm-card"><div class="adm-card-t">Global assets</div>' +
        '<p style="font-size:12px;color:var(--tx2);margin-bottom:12px;line-height:1.5">ไฟล์เก็บใน Supabase Storage bucket <code>app-assets</code> (public read)</p>' +
        rows + '</div>';
    },
    upload: onUpload
  };
})();

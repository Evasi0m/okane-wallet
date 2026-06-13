/* Admin — Global icon editor */
(function () {
  'use strict';

  var defs = window.OkaneIconDefaults || {};
  var DEFAULTS = defs.DEFAULTS || {};
  var CAT_KEYS = defs.CAT_KEYS || [];
  var SYS_KEYS = defs.SYS_KEYS || [];

  var indexDefaults = {};
  var indexKeys = [];
  var editingKey = null;
  var currentTab = 'svg';
  var pendingFile = null;

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function currentSvg(key, globalIcons) {
    if (globalIcons && globalIcons[key]) return globalIcons[key];
    return DEFAULTS[key] || indexDefaults[key] || '';
  }

  function isModified(key, globalIcons) {
    return !!(globalIcons && globalIcons[key]);
  }

  function cardHtml(key, label, globalIcons) {
    var svg = currentSvg(key, globalIcons);
    var mod = isModified(key, globalIcons);
    return '<div class="adm-ic-card' + (mod ? ' modified' : '') + '" data-key="' + esc(key) + '">' +
      '<div class="adm-ic-card-dot"></div>' +
      '<div class="adm-ic-prev">' + svg + '</div>' +
      '<div class="adm-ic-lbl">' + esc(label) + '</div></div>';
  }

  async function loadIndexDefaults() {
    try {
      var res = await fetch('../index.html', { cache: 'no-store' });
      var text = await res.text();
      var doc = new DOMParser().parseFromString(text, 'text/html');
      indexDefaults = {};
      indexKeys = [];
      doc.querySelectorAll('svg[data-icon-id]').forEach(function (svg) {
        var id = svg.getAttribute('data-icon-id');
        if (!id) return;
        var key = 'INDEX.' + id;
        if (indexDefaults[key]) return;
        indexDefaults[key] = svg.outerHTML;
        indexKeys.push(key);
      });
    } catch (e) {
      indexDefaults = {};
      indexKeys = [];
    }
  }

  function ensureModal() {
    if (document.getElementById('admIconModal')) return;
    var bg = document.createElement('div');
    bg.id = 'admIconModalBg';
    bg.className = 'adm-modal-bg';
    bg.onclick = closeModal;
    var modal = document.createElement('div');
    modal.id = 'admIconModal';
    modal.className = 'adm-modal';
    modal.innerHTML =
      '<div class="adm-modal-hd"><code id="admIconKey"></code><button type="button" class="btn btn-gh" onclick="AdminIcons.closeModal()">✕</button></div>' +
      '<div class="adm-modal-bd">' +
      '<div class="adm-preview"><div class="adm-preview-ic" id="admIconPreview"></div>' +
      '<div style="font-size:11px;color:var(--tx3);line-height:1.5">Preview — ใช้ <code>stroke="currentColor"</code> เพื่อตามธีม</div></div>' +
      '<div class="adm-tabs"><button type="button" class="adm-tab on" data-tab="svg" onclick="AdminIcons.switchTab(\'svg\')">SVG Code</button>' +
      '<button type="button" class="adm-tab" data-tab="file" onclick="AdminIcons.switchTab(\'file\')">Upload</button></div>' +
      '<div class="adm-panel on" id="admIconPanelSvg"><textarea class="adm-ta" id="admIconSvgInput" oninput="AdminIcons.onSvgInput()"></textarea></div>' +
      '<div class="adm-panel" id="admIconPanelFile"><label class="adm-upload"><input type="file" id="admIconFile" accept=".svg,image/svg+xml,.png,.jpg,.jpeg" onchange="AdminIcons.handleFile(this)">คลิกเลือก .svg / .png / .jpg</label>' +
      '<div class="adm-preview" id="admIconFilePreview" style="display:none"><div class="adm-preview-ic" id="admIconFilePrevIc"></div><div id="admIconFileInfo" style="font-size:11px;color:var(--tx2)"></div></div></div>' +
      '<div id="admIconErr" style="font-size:12px;color:var(--rd);margin-top:8px"></div></div>' +
      '<div class="adm-modal-ft"><button type="button" class="btn btn-gh" onclick="AdminIcons.resetOne()">รีเซ็ต</button>' +
      '<button type="button" class="btn btn-ac" style="flex:2" onclick="AdminIcons.publish()">Publish</button></div>';
    document.body.appendChild(bg);
    document.body.appendChild(modal);
  }

  function openModal(key, globalIcons) {
    ensureModal();
    editingKey = key;
    pendingFile = null;
    document.getElementById('admIconKey').textContent = key;
    document.getElementById('admIconSvgInput').value = currentSvg(key, globalIcons);
    document.getElementById('admIconErr').textContent = '';
    document.getElementById('admIconFilePreview').style.display = 'none';
    document.getElementById('admIconFile').value = '';
    updatePreview(currentSvg(key, globalIcons));
    switchTab('svg');
    document.getElementById('admIconModalBg').classList.add('open');
    document.getElementById('admIconModal').classList.add('open');
  }

  function closeModal() {
    var bg = document.getElementById('admIconModalBg');
    var m = document.getElementById('admIconModal');
    if (bg) bg.classList.remove('open');
    if (m) m.classList.remove('open');
    editingKey = null;
    pendingFile = null;
  }

  function updatePreview(code) {
    var el = document.getElementById('admIconPreview');
    if (el) el.innerHTML = code || '';
  }

  function switchTab(name) {
    currentTab = name;
    document.querySelectorAll('#admIconModal .adm-tab').forEach(function (t) {
      t.classList.toggle('on', t.getAttribute('data-tab') === name);
    });
    document.getElementById('admIconPanelSvg').classList.toggle('on', name === 'svg');
    document.getElementById('admIconPanelFile').classList.toggle('on', name === 'file');
  }

  function onSvgInput() {
    updatePreview(document.getElementById('admIconSvgInput').value.trim());
    document.getElementById('admIconErr').textContent = '';
  }

  function handleFile(input) {
    var file = input.files[0];
    if (!file) return;
    var err = document.getElementById('admIconErr');
    var previewWrap = document.getElementById('admIconFilePreview');
    var previewIc = document.getElementById('admIconFilePrevIc');
    var previewInfo = document.getElementById('admIconFileInfo');
    err.textContent = '';
    var isSvg = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml';
    var reader = new FileReader();
    reader.onload = function (e) {
      if (isSvg) {
        pendingFile = e.target.result.trim();
        previewIc.innerHTML = pendingFile;
        previewInfo.innerHTML = '<b>' + esc(file.name) + '</b><br>SVG';
      } else if (file.type.indexOf('image/') === 0) {
        pendingFile = '<img src="' + e.target.result + '" alt="" style="width:100%;height:100%;object-fit:contain">';
        previewIc.innerHTML = pendingFile;
        previewInfo.innerHTML = '<b>' + esc(file.name) + '</b><br>Static image';
      } else {
        err.textContent = 'ไฟล์ไม่รองรับ';
        return;
      }
      previewWrap.style.display = 'flex';
      updatePreview(pendingFile);
    };
    if (isSvg) reader.readAsText(file);
    else if (file.type.indexOf('image/') === 0) reader.readAsDataURL(file);
    else err.textContent = 'ไฟล์ไม่รองรับ';
  }

  async function publish() {
    if (!editingKey) return;
    var code;
    if (currentTab === 'svg') {
      code = document.getElementById('admIconSvgInput').value.trim();
      if (!code) {
        document.getElementById('admIconErr').textContent = 'กรุณาใส่ SVG';
        return;
      }
    } else {
      if (!pendingFile) {
        document.getElementById('admIconErr').textContent = 'กรุณาเลือกไฟล์';
        return;
      }
      code = pendingFile;
    }
    try {
      await AdminApp.publishIcon(editingKey, code);
      AdminApp.toast('Publish สำเร็จ');
      closeModal();
      AdminApp.navigate('icons');
    } catch (e) {
      document.getElementById('admIconErr').textContent = e.message || String(e);
    }
  }

  async function resetOne() {
    if (!editingKey) return;
    if (!confirm('รีเซ็ตไอคอนนี้กลับค่าเริ่มต้น (ลบจาก global)?')) return;
    try {
      if (AdminApp.state.globalIcons[editingKey]) {
        await AdminApp.deleteIcon(editingKey);
      }
      AdminApp.toast('รีเซ็ตแล้ว');
      closeModal();
      AdminApp.navigate('icons');
    } catch (e) {
      AdminApp.toast(e.message, true);
    }
  }

  function bindGrid(host, globalIcons) {
    host.querySelectorAll('.adm-ic-card[data-key]').forEach(function (card) {
      card.onclick = function () { openModal(card.getAttribute('data-key'), globalIcons); };
    });
  }

  window.AdminIcons = {
    render: async function (host, st) {
      await loadIndexDefaults();
      var g = st.globalIcons || {};
      host.innerHTML =
        '<div class="adm-card"><div class="adm-card-t">ไอคอนหมวดหมู่</div><div class="adm-grid" id="admGridCats">' +
        CAT_KEYS.map(function (k) { return cardHtml('ICON_LIST.' + k, k, g); }).join('') +
        '</div></div>' +
        '<div class="adm-card"><div class="adm-card-t">ไอคอนระบบ</div><div class="adm-grid" id="admGridSys">' +
        SYS_KEYS.map(function (k) { return cardHtml('IC.' + k, 'IC.' + k, g); }).join('') +
        '</div></div>' +
        '<div class="adm-card"><div class="adm-card-t">index.html (data-icon-id)</div><div class="adm-grid" id="admGridIndex">' +
        (indexKeys.length
          ? indexKeys.map(function (k) { return cardHtml(k, k.replace(/^INDEX\./, ''), g); }).join('')
          : '<div style="grid-column:1/-1;font-size:12px;color:var(--tx3)">ไม่พบ data-icon-id</div>') +
        '</div></div>';
      bindGrid(host, g);
    },
    closeModal: closeModal,
    switchTab: switchTab,
    onSvgInput: onSvgInput,
    handleFile: handleFile,
    publish: publish,
    resetOne: resetOne
  };
})();

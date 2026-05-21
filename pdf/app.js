/* =========================================================
   駿河台西町会サイト ― 実運用版
   ・お知らせデータは notices.json から読み込み
   ・管理画面：プレビュー＋notices.json書き出し（GitHubで編集する運用）
   ========================================================= */

let notices = [];
let editingId = null;
let dataLoaded = false;

// ----- ユーティリティ -----
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function sortedNotices() {
  return [...notices].sort((a, b) => b.vol - a.vol);
}
function getLatest() {
  return notices.find(n => n.latest) || sortedNotices()[0] || null;
}
function scrollTop(e) {
  if (e) e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----- データ読み込み -----
async function loadNotices() {
  try {
    const res = await fetch('notices.json?_=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    notices = Array.isArray(data) ? data : (data.notices || []);
    dataLoaded = true;
  } catch (e) {
    console.error('notices.json の読み込みに失敗:', e);
    notices = [];
    dataLoaded = false;
  }
  renderPublic();
}

// ----- 公開サイトの描画 -----
function renderPublic() {
  renderLatest();
  renderNoticeGrid();
  renderArchive();
}

function renderLatest() {
  const el = document.getElementById('latestBlock');
  const n = getLatest();
  if (!n) {
    const msg = dataLoaded
      ? 'お知らせがまだ登録されていません。'
      : 'お知らせデータを読み込めませんでした。';
    el.innerHTML = '<div class="latest-main"><p style="color:rgba(255,255,255,0.7)">' + msg + '</p></div>';
    return;
  }
  const topics = n.topics.map(t => '<li>' + esc(t) + '</li>').join('');
  const pdfBtn = n.pdf
    ? '<a href="' + esc(n.pdf) + '" class="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>PDFをダウンロード</a>'
    : '<a class="btn btn-primary" style="opacity:.5;cursor:default;">PDF準備中</a>';
  el.innerHTML =
    '<div class="latest-meta">' +
      '<span class="latest-label">最新号</span>' +
      '<span class="latest-vol">VOL. ' + esc(n.vol) + '</span>' +
      '<span class="latest-date">' + esc(n.issued) + ' 発行</span>' +
    '</div>' +
    '<div class="latest-main">' +
      '<h2 class="latest-title">町会からのお知らせ<br><span class="latest-period">' + esc(n.period) + '</span></h2>' +
      '<ul class="latest-topics">' + topics + '</ul>' +
      '<div class="latest-actions">' +
        pdfBtn +
        '<a href="#notices" class="btn btn-ghost-light">過去の号を見る</a>' +
      '</div>' +
    '</div>';
}

function renderNoticeGrid() {
  const el = document.getElementById('noticeGrid');
  const list = sortedNotices().slice(0, 3);
  if (list.length === 0) {
    el.innerHTML = '<div class="notice-empty">お知らせがまだ登録されていません。</div>';
    return;
  }
  el.innerHTML = list.map(n => {
    const topics = n.topics.slice(0, 4).map(t => '<li>' + esc(t) + '</li>').join('');
    const latestCls = n.latest ? ' is-latest' : '';
    const href = n.pdf ? ' href="' + esc(n.pdf) + '"' : '';
    return '<a' + href + ' class="notice-card' + latestCls + '">' +
      '<div class="num">VOL. ' + esc(n.vol) + '</div>' +
      '<div class="date">' + esc(n.range || '') + '</div>' +
      '<h3 class="title">' + esc(n.title) + '</h3>' +
      '<ul class="topics">' + topics + '</ul>' +
      '<div class="footer-row"><span>' + esc(n.pages || '') + '</span>' +
      '<span class="read">' + (n.pdf ? '読む &rarr;' : '準備中') + '</span></div>' +
      '</a>';
  }).join('');
}

function renderArchive() {
  const el = document.getElementById('archiveList');
  const list = sortedNotices();
  if (list.length === 0) {
    el.innerHTML = '<div class="notice-empty">バックナンバーがまだありません。</div>';
    return;
  }
  el.innerHTML = list.map(n => {
    const year = (n.range || '').slice(0, 4) || '—';
    const tags = (n.tags || []).map(t => '<span class="archive-tag">' + esc(t) + '</span>').join('');
    const href = n.pdf ? ' href="' + esc(n.pdf) + '"' : '';
    return '<a' + href + ' class="archive-row">' +
      '<span class="archive-year">' + esc(year) + '</span>' +
      '<span class="archive-title">VOL.' + esc(n.vol) + ' ／ ' + esc(n.period) + '</span>' +
      '<div class="archive-tags">' + tags + '</div>' +
      '<span class="archive-pdf">' + (n.pdf ? 'PDF &darr;' : '準備中') + '</span>' +
      '</a>';
  }).join('');
}

// ----- 管理画面 -----
function openAdmin() {
  document.body.classList.add('admin-mode');
  window.scrollTo(0, 0);
}
function closeAdmin() {
  document.body.classList.remove('admin-mode');
}
function doLogin() {
  const pass = document.getElementById('adminPass').value;
  const err = document.getElementById('loginErr');
  if (pass === 'surugadai') {
    document.body.classList.add('admin-authed');
    err.textContent = '';
    document.getElementById('adminPass').value = '';
    renderAdminTable();
  } else {
    err.textContent = 'パスワードが正しくありません。';
  }
}
function doLogout() {
  document.body.classList.remove('admin-authed');
  closeAdmin();
}

function renderAdminTable() {
  const tb = document.getElementById('adminTableBody');
  const list = sortedNotices();
  if (list.length === 0) {
    tb.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--navy-faint);padding:40px;">お知らせがありません。「＋ 新しいお知らせ」から追加してください。</td></tr>';
    return;
  }
  tb.innerHTML = list.map(n => {
    const badge = n.latest ? '<span class="badge-latest">最新号</span>' : '';
    return '<tr>' +
      '<td class="col-vol">VOL.' + esc(n.vol) + '</td>' +
      '<td><span class="col-title">' + esc(n.title) + '</span>' + badge +
        '<br><span class="col-period">' + esc(n.period) + '</span></td>' +
      '<td>' + n.topics.length + ' 項目</td>' +
      '<td><div class="row-actions">' +
        '<button class="mini-btn edit" onclick="openEditor(\'' + n.id + '\')">編集</button>' +
        '<button class="mini-btn danger" onclick="deleteNotice(\'' + n.id + '\')">削除</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

// ----- 編集モーダル -----
function openEditor(id) {
  editingId = id || null;
  const m = document.getElementById('editorModal');
  const t = document.getElementById('editorTitle');
  if (editingId) {
    const n = notices.find(x => x.id === editingId);
    t.textContent = 'お知らせを編集（VOL.' + n.vol + '）';
    document.getElementById('f_id').value = n.id;
    document.getElementById('f_vol').value = n.vol;
    document.getElementById('f_issued').value = n.issued || '';
    document.getElementById('f_title').value = n.title || '';
    document.getElementById('f_period').value = n.period || '';
    document.getElementById('f_range').value = n.range || '';
    document.getElementById('f_topics').value = (n.topics || []).join('\n');
    document.getElementById('f_pdf').value = n.pdf || '';
    document.getElementById('f_pages').value = n.pages || '';
    document.getElementById('f_tags').value = (n.tags || []).join(', ');
    document.getElementById('f_latest').checked = !!n.latest;
  } else {
    t.textContent = '新しいお知らせ';
    ['f_id','f_vol','f_issued','f_title','f_period','f_range','f_topics','f_pdf','f_pages','f_tags']
      .forEach(i => document.getElementById(i).value = '');
    document.getElementById('f_latest').checked = false;
    const maxVol = notices.reduce((m, n) => Math.max(m, n.vol), 0);
    document.getElementById('f_vol').value = maxVol + 1;
  }
  m.classList.add('open');
}
function closeEditor() {
  document.getElementById('editorModal').classList.remove('open');
  editingId = null;
}

function saveNotice() {
  const vol = parseInt(document.getElementById('f_vol').value, 10);
  const issued = document.getElementById('f_issued').value.trim();
  const title = document.getElementById('f_title').value.trim();
  const period = document.getElementById('f_period').value.trim();
  const topicsRaw = document.getElementById('f_topics').value.trim();

  if (!vol || !issued || !title || !period || !topicsRaw) {
    toast('号数・発行年月・タイトル・対象期間・掲載項目は必須です。', 'danger');
    return;
  }
  const topics = topicsRaw.split('\n').map(s => s.trim()).filter(Boolean);
  const tags = document.getElementById('f_tags').value
    .split(',').map(s => s.trim()).filter(Boolean);
  const latest = document.getElementById('f_latest').checked;

  const data = {
    vol: vol,
    issued: issued,
    title: title,
    period: period,
    range: document.getElementById('f_range').value.trim(),
    topics: topics,
    pdf: document.getElementById('f_pdf').value.trim(),
    pages: document.getElementById('f_pages').value.trim(),
    tags: tags,
    latest: latest
  };

  if (latest) notices.forEach(n => n.latest = false);

  if (editingId) {
    const idx = notices.findIndex(x => x.id === editingId);
    notices[idx] = Object.assign({}, notices[idx], data);
    toast('プレビューを更新しました（確定にはJSON書き出しが必要）', 'ok');
  } else {
    data.id = 'n' + Date.now();
    notices.push(data);
    toast('プレビューに追加しました（確定にはJSON書き出しが必要）', 'ok');
  }
  closeEditor();
  renderAdminTable();
  renderPublic();
}

function deleteNotice(id) {
  const n = notices.find(x => x.id === id);
  if (!n) return;
  if (!confirm('「VOL.' + n.vol + '　' + n.title + '」をプレビューから削除します。\n（確定にはJSON書き出しが必要です）\n\nよろしいですか？')) return;
  notices = notices.filter(x => x.id !== id);
  toast('プレビューから削除しました（確定にはJSON書き出しが必要）', 'danger');
  renderAdminTable();
  renderPublic();
}

// ----- JSON書き出し -----
function exportJSON() {
  const data = JSON.stringify({ notices: sortedNotices() }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notices.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('notices.json を書き出しました。GitHubに上げて確定してください。', 'ok');
}

// ----- トースト通知 -----
let toastTimer = null;
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3600);
}

// ----- 起動 -----
document.addEventListener('DOMContentLoaded', function () {
  loadNotices();
  if (location.hash === '#admin') openAdmin();
});

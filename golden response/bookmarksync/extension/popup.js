// ============================================================
// popup.js — Main extension popup logic
// ============================================================

// ---- State ----
let allBookmarks  = [];
let editingId     = null;
let currentFilter = 'home'; // 'home' | 'all' | 'favs'

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  const loggedIn = await isLoggedIn();
  if (loggedIn) {
    showMainView();
    await loadAndRender();
  } else {
    showAuthView();
  }
  bindEvents();
});

// ---- Show/hide views ----
function showAuthView() {
  document.getElementById('auth-view').style.display = 'flex';
  document.getElementById('main-view').classList.add('hidden');
  document.getElementById('main-view').classList.remove('flex');
}

function showMainView() {
  document.getElementById('auth-view').style.display = 'none';
  document.getElementById('main-view').classList.remove('hidden');
  document.getElementById('main-view').classList.add('flex');
}

// ---- Load + render ----
async function loadAndRender() {
  // Show cache immediately for fast load
  const cached = await getCachedBookmarks();
  if (cached.length) renderList(cached);

  // Fetch fresh from API
  try {
    allBookmarks = await API.getBookmarks();
    cacheBookmarks(allBookmarks);
    renderList(allBookmarks);
  } catch (err) {
    showFormError('ext-form-error', err.message);
  }
}

// ---- Render bookmark list ----
function renderList(bookmarks) {
  const search = document.getElementById('ext-search').value.toLowerCase();
  let list = [...bookmarks];

  if (search) list = list.filter(b =>
    b.title.toLowerCase().includes(search) ||
    b.url.toLowerCase().includes(search) ||
    (b.category || '').toLowerCase().includes(search)
  );

  if (currentFilter === 'favs') list = list.filter(b => b.favorite);

  // Show only first 15 to keep popup snappy
  const visible = list.slice(0, 15);

  document.getElementById('ext-bm-count').textContent = `${list.length} items`;
  const el = document.getElementById('ext-bookmark-list');

  if (!visible.length) {
    el.innerHTML = `<div class="text-body-sm text-text-muted text-center py-lg">${search ? 'No results' : 'No bookmarks yet'}</div>`;
    return;
  }

  el.innerHTML = visible.map(b => {
    const favFill  = b.favorite ? "style=\"font-variation-settings:'FILL' 1\"" : '';
    const favColor = b.favorite ? 'text-tertiary' : 'text-secondary';
    return `
    <div class="group flex items-center gap-md p-md bg-surface border border-border rounded hover:border-primary cursor-pointer transition-colors" data-id="${b._id}">
      <div class="w-10 h-10 bg-surface-container-high rounded flex items-center justify-center shrink-0 border border-border">
        <span class="material-symbols-outlined text-secondary group-hover:text-primary transition-colors">${iconForUrl(b.url)}</span>
      </div>
      <div class="min-w-0 flex-1" onclick="window.open('${b.url}','_blank')">
        <p class="text-body-sm font-medium truncate group-hover:text-primary transition-colors">${b.title}</p>
        <p class="text-label-caps text-text-muted truncate">${shortUrl(b.url)}</p>
        ${b.category ? `<span class="text-[10px] px-base bg-secondary-container text-on-secondary-container rounded">${b.category}</span>` : ''}
      </div>
      <div class="flex flex-col gap-base opacity-0 group-hover:opacity-100 transition-opacity">
        <button data-action="edit"   data-id="${b._id}" class="text-secondary hover:text-primary transition-colors" title="Edit"><span class="material-symbols-outlined" style="font-size:16px">edit</span></button>
        <button data-action="fav"    data-id="${b._id}" class="${favColor} transition-colors" title="Favorite"><span class="material-symbols-outlined" style="font-size:16px" ${favFill}>star</span></button>
        <button data-action="delete" data-id="${b._id}" class="text-secondary hover:text-danger transition-colors" title="Delete"><span class="material-symbols-outlined" style="font-size:16px">delete</span></button>
      </div>
    </div>`;
  }).join('');

  // Delegate row action events
  el.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id     = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit')   openEdit(id);
      if (action === 'fav')    await doFav(id);
      if (action === 'delete') await doDelete(id);
    });
  });
}

// ---- CRUD ----
async function doSave() {
  const title       = document.getElementById('ext-title').value.trim();
  const url         = document.getElementById('ext-url').value.trim();
  const category    = document.getElementById('ext-category').value.trim();
  const description = document.getElementById('ext-description').value.trim();
  const errEl       = document.getElementById('ext-form-error');

  if (!title || !url) { showFormError('ext-form-error', 'Title and URL are required'); return; }
  if (!url.startsWith('http')) { showFormError('ext-form-error', 'URL must start with http:// or https://'); return; }
  errEl.classList.add('hidden');

  const saveBtn = document.getElementById('btn-ext-save');
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled    = true;

  try {
    if (editingId) {
      await API.updateBookmark(editingId, { title, url, category, description });
    } else {
      await API.addBookmark({ title, url, category, description });
    }
    resetForm();
    allBookmarks = await API.getBookmarks();
    cacheBookmarks(allBookmarks);
    renderList(allBookmarks);
    saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">check</span> Saved!';
    setTimeout(() => {
      saveBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">bookmark_add</span> Save Bookmark';
      saveBtn.disabled = false;
    }, 1500);
  } catch (err) {
    showFormError('ext-form-error', err.message);
    saveBtn.textContent = 'Save Bookmark';
    saveBtn.disabled    = false;
  }
}

async function doDelete(id) {
  try {
    await API.deleteBookmark(id);
    allBookmarks = allBookmarks.filter(b => b._id !== id);
    cacheBookmarks(allBookmarks);
    renderList(allBookmarks);
  } catch (err) { console.error(err); }
}

async function doFav(id) {
  try {
    const updated = await API.toggleFavorite(id);
    const idx = allBookmarks.findIndex(b => b._id === id);
    if (idx !== -1) allBookmarks[idx] = updated;
    cacheBookmarks(allBookmarks);
    renderList(allBookmarks);
  } catch (err) { console.error(err); }
}

function openEdit(id) {
  const b = allBookmarks.find(x => x._id === id);
  if (!b) return;
  editingId = id;
  document.getElementById('ext-title').value         = b.title;
  document.getElementById('ext-url').value           = b.url;
  document.getElementById('ext-category').value      = b.category || '';
  document.getElementById('ext-description').value   = b.description || '';
  document.getElementById('ext-edit-id').value       = id;
  document.getElementById('form-section-title').textContent = 'EDITING BOOKMARK';
  document.getElementById('btn-ext-cancel').classList.remove('hidden');
  document.getElementById('ext-title').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('ext-title').focus();
}

function resetForm() {
  editingId = null;
  document.getElementById('ext-title').value         = '';
  document.getElementById('ext-url').value           = '';
  document.getElementById('ext-category').value      = '';
  document.getElementById('ext-description').value   = '';
  document.getElementById('ext-edit-id').value       = '';
  document.getElementById('form-section-title').textContent = 'QUICK ADD CURRENT TAB';
  document.getElementById('btn-ext-cancel').classList.add('hidden');
  document.getElementById('ext-form-error').classList.add('hidden');
}

// ---- Auto-fill current tab ----
async function autoFillCurrentTab() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' }, response => {
      if (response && response.tab) {
        document.getElementById('ext-title').value = response.tab.title || '';
        document.getElementById('ext-url').value   = response.tab.url  || '';
      }
      resolve();
    });
  });
}

// ---- Auth ----
async function doExtLogin() {
  const email    = document.getElementById('ext-login-email').value.trim();
  const password = document.getElementById('ext-login-password').value;
  try {
    const data = await API.login({ email, password });
    saveAuth(data.token, { name: data.name, email: data.email });
    showMainView();
    await loadAndRender();
  } catch (err) {
    showFormError('ext-login-error', err.message);
  }
}

async function doExtSignup() {
  const name     = document.getElementById('ext-signup-name').value.trim();
  const email    = document.getElementById('ext-signup-email').value.trim();
  const password = document.getElementById('ext-signup-password').value;
  try {
    const data = await API.signup({ name, email, password });
    saveAuth(data.token, { name: data.name, email: data.email });
    showMainView();
    await loadAndRender();
  } catch (err) {
    showFormError('ext-signup-error', err.message);
  }
}

// ---- Helpers ----
function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function iconForUrl(url) {
  if (!url) return 'language';
  if (url.includes('github'))  return 'code';
  if (url.includes('youtube')) return 'play_circle';
  if (url.includes('figma'))   return 'brush';
  if (url.includes('medium') || url.includes('blog')) return 'article';
  return 'language';
}

function shortUrl(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

// ---- Event bindings ----
function bindEvents() {
  // Auth
  document.getElementById('btn-ext-login').addEventListener('click', doExtLogin);
  document.getElementById('btn-ext-signup').addEventListener('click', doExtSignup);
  document.getElementById('btn-ext-logout').addEventListener('click', () => {
    clearAuth(); clearCache(); showAuthView();
  });
  document.getElementById('ext-show-signup').addEventListener('click', () => {
    document.getElementById('ext-login-form').classList.add('hidden');
    document.getElementById('ext-signup-form').classList.remove('hidden');
  });
  document.getElementById('ext-show-login').addEventListener('click', () => {
    document.getElementById('ext-signup-form').classList.add('hidden');
    document.getElementById('ext-login-form').classList.remove('hidden');
  });

  // Enter key for auth forms
  ['ext-login-email','ext-login-password'].forEach(id =>
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') doExtLogin(); }));
  ['ext-signup-name','ext-signup-email','ext-signup-password'].forEach(id =>
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') doExtSignup(); }));

  // Bookmark form
  document.getElementById('btn-ext-save').addEventListener('click', doSave);
  document.getElementById('btn-ext-cancel').addEventListener('click', resetForm);
  document.getElementById('btn-quick-add-tab').addEventListener('click', autoFillCurrentTab);

  // Enter to save
  ['ext-title','ext-url','ext-category','ext-description'].forEach(id =>
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') doSave(); }));

  // Search
  document.getElementById('ext-search').addEventListener('input', () => renderList(allBookmarks));

  // Dashboard button
  document.getElementById('btn-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5501/dashboard/index.html' }); // Update after deployment
  });

  // Bottom nav
  document.getElementById('nav-home').addEventListener('click', () => { currentFilter='home'; renderList(allBookmarks); setActiveNav('nav-home'); });
  document.getElementById('nav-all').addEventListener('click',  () => { currentFilter='all';  renderList(allBookmarks); setActiveNav('nav-all'); });
  document.getElementById('nav-favs').addEventListener('click', () => { currentFilter='favs'; renderList(allBookmarks); setActiveNav('nav-favs'); });
  document.getElementById('nav-add').addEventListener('click',  () => {
    resetForm();
    document.getElementById('ext-title').scrollIntoView({ behavior:'smooth' });
    document.getElementById('ext-title').focus();
  });
}

function setActiveNav(activeId) {
  ['nav-home','nav-all','nav-favs','nav-add'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.toggle('text-primary', id === activeId);
    el.classList.toggle('font-bold',    id === activeId);
    el.classList.toggle('text-secondary', id !== activeId);
  });
}

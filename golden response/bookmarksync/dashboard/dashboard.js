// ============================================================
// BookmarkSync — Dashboard JavaScript
// Handles auth, API calls, rendering, and navigation
// ============================================================

const API_BASE = 'http://localhost:5000/api'; // Update after deployment

// ---- State ----
let bookmarks = [];
let currentPage = 'home';
let currentSort = 'date'; // 'date' | 'alpha' | 'fav'
let editingId = null;

// ---- Auth helpers ----
const getToken  = () => localStorage.getItem('bs_token');
const saveToken = (t, user) => { localStorage.setItem('bs_token', t); localStorage.setItem('bs_user', JSON.stringify(user)); };
const clearToken = () => { localStorage.removeItem('bs_token'); localStorage.removeItem('bs_user'); };
const getUser   = () => { try { return JSON.parse(localStorage.getItem('bs_user')); } catch { return null; } };

// ---- API helpers ----
async function apiFetch(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  const token = getToken();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);
  const res  = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
const apiGet    = (path)      => apiFetch('GET',    path);
const apiPost   = (path, b)   => apiFetch('POST',   path, b);
const apiPut    = (path, b)   => apiFetch('PUT',    path, b);
const apiDelete = (path)      => apiFetch('DELETE', path);
const apiPatch  = (path)      => apiFetch('PATCH',  path);

// ---- Toast ----
function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ---- Navigation ----
function navigate(page) {
  currentPage = page;
  ['home','bookmarks','categories'].forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.toggle('hidden', p !== page);
  });
  // Update active nav link style
  document.querySelectorAll('.nav-link').forEach(a => {
    const isActive = a.dataset.page === page;
    a.classList.toggle('text-primary',    isActive);
    a.classList.toggle('font-bold',       isActive);
    a.classList.toggle('border-r-2',      isActive);
    a.classList.toggle('border-primary',  isActive);
    a.classList.toggle('bg-surface-container-low', isActive);
    a.classList.toggle('text-secondary',  !isActive);
    a.classList.toggle('bg-transparent',  !isActive);
  });
  if (page === 'home')        renderHome();
  if (page === 'bookmarks')   renderBookmarks();
  if (page === 'categories')  renderCategories();
}

// ---- Load bookmarks ----
async function loadBookmarks() {
  try {
    bookmarks = await apiGet('/bookmarks');
  } catch (err) {
    showToast(err.message, 'error');
    bookmarks = [];
  }
}

// ---- Render: Home ----
function renderHome() {
  const total     = bookmarks.length;
  const favs      = bookmarks.filter(b => b.favorite).length;
  const cats      = [...new Set(bookmarks.map(b => b.category).filter(Boolean))];
  const favPct    = total ? Math.round((favs / total) * 100) : 0;

  document.getElementById('stat-total').textContent      = total;
  document.getElementById('stat-favorites').textContent  = favs;
  document.getElementById('stat-categories').textContent = cats.length;
  document.getElementById('fav-bar').style.width         = `${favPct}%`;
  document.getElementById('collection-subtitle').textContent = `${total} bookmarks organized`;

  // Category avatars
  const avatarEl = document.getElementById('cat-avatars');
  avatarEl.innerHTML = cats.slice(0, 3).map(c =>
    `<div class="w-6 h-6 rounded-full border border-surface bg-primary-fixed flex items-center justify-center text-[10px] font-bold">${c[0].toUpperCase()}</div>`
  ).join('') + (cats.length > 3 ? `<div class="w-6 h-6 rounded-full border border-surface bg-surface-container-highest flex items-center justify-center text-[10px] font-bold">+${cats.length - 3}</div>` : '');

  // Tags cloud
  document.getElementById('tags-cloud').innerHTML = cats.length
    ? cats.slice(0, 8).map(c =>
        `<span class="px-md py-tight bg-surface-container-low border border-border rounded-full text-body-sm hover:border-primary cursor-pointer transition-colors">#${c}</span>`
      ).join('')
    : '<span class="text-body-sm text-text-muted">No categories yet</span>';

  // Recent list (last 5)
  const recent = [...bookmarks].slice(0, 5);
  const listEl = document.getElementById('recent-list');
  listEl.innerHTML = recent.length ? recent.map(b => bookmarkRowHTML(b)).join('') : '<div class="px-xl py-lg text-body-sm text-text-muted">No bookmarks yet. Add your first one!</div>';
  attachRowActions(listEl);
}

// ---- Render: Bookmarks ----
function renderBookmarks() {
  let list = [...bookmarks];
  const search = document.getElementById('global-search').value.toLowerCase();
  if (search) list = list.filter(b => b.title.toLowerCase().includes(search) || b.url.toLowerCase().includes(search) || (b.category || '').toLowerCase().includes(search));
  if (currentSort === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title));
  if (currentSort === 'fav')   list = list.filter(b => b.favorite).concat(list.filter(b => !b.favorite));

  document.getElementById('bm-count-label').textContent = `Showing ${list.length} of ${bookmarks.length} bookmarks`;
  const el = document.getElementById('bookmarks-list');
  el.innerHTML = list.length ? list.map(b => bookmarkRowHTML(b)).join('') : '<div class="text-body-sm text-text-muted py-lg text-center">No bookmarks found.</div>';
  attachRowActions(el);
}

// ---- Render: Categories ----
function renderCategories() {
  const grouped = {};
  bookmarks.forEach(b => {
    const cat = b.category || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  });
  const el = document.getElementById('categories-list');
  el.innerHTML = Object.keys(grouped).length
    ? Object.entries(grouped).map(([cat, items]) => `
        <div class="bg-surface border border-border rounded-lg overflow-hidden">
          <div class="px-xl py-md bg-surface-container-low border-b border-border flex items-center justify-between">
            <span class="text-label-caps font-label-caps text-text-muted uppercase">${cat}</span>
            <span class="text-body-sm text-text-muted">${items.length} items</span>
          </div>
          <div class="divide-y divide-border">${items.map(b => bookmarkRowHTML(b)).join('')}</div>
        </div>`).join('')
    : '<div class="text-body-sm text-text-muted">No bookmarks yet.</div>';
  attachRowActions(el);
}

// ---- Shared bookmark row HTML ----
function bookmarkRowHTML(b) {
  const icon  = iconForUrl(b.url);
  const faved = b.favorite ? `style="font-variation-settings:'FILL' 1"` : '';
  const favColor = b.favorite ? 'text-tertiary' : 'text-secondary';
  return `
  <div class="bookmark-row group flex items-center justify-between p-md bg-surface hover:bg-surface-container-lowest transition-all" data-id="${b._id}">
    <div class="flex items-center gap-md flex-1 min-w-0">
      <div class="h-10 w-10 flex-shrink-0 bg-primary-fixed rounded flex items-center justify-center text-primary">
        <span class="material-symbols-outlined">${icon}</span>
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-tight">
          <h3 class="text-body-base font-semibold text-on-surface truncate">
            <a href="${b.url}" target="_blank" class="hover:text-primary transition-colors">${b.title}</a>
          </h3>
        </div>
        <div class="flex items-center gap-md mt-base">
          <span class="text-body-sm text-text-muted truncate max-w-[220px]">${b.url}</span>
          ${b.category ? `<span class="bg-secondary-container text-on-secondary-container text-[10px] px-base py-px rounded font-bold uppercase tracking-wider">${b.category}</span>` : ''}
        </div>
      </div>
    </div>
    <div class="flex items-center gap-md ml-xl">
      <div class="row-actions md:opacity-0 group-hover:opacity-100 flex items-center gap-tight transition-opacity duration-200">
        <button data-action="edit" data-id="${b._id}" class="p-base rounded hover:bg-surface-container-high text-secondary hover:text-primary transition-colors" title="Edit">
          <span class="material-symbols-outlined text-[20px]">edit</span>
        </button>
        <button data-action="fav" data-id="${b._id}" class="p-base rounded hover:bg-surface-container-high ${favColor} transition-colors" title="Favorite">
          <span class="material-symbols-outlined text-[20px]" ${faved}>star</span>
        </button>
        <button data-action="delete" data-id="${b._id}" class="p-base rounded hover:bg-error-container text-secondary hover:text-danger transition-colors" title="Delete">
          <span class="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  </div>`;
}

// ---- Row action delegation ----
function attachRowActions(container) {
  container.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'delete') await handleDelete(id);
    if (action === 'fav')    await handleFav(id);
    if (action === 'edit')   openEditModal(id);
  }, { once: true });
  // Re-attach after each render since innerHTML replaces listeners
  // (Works fine for this density of items)
}

// ---- Icon helper ----
function iconForUrl(url) {
  if (!url) return 'language';
  if (url.includes('github'))   return 'code';
  if (url.includes('youtube'))  return 'play_circle';
  if (url.includes('twitter') || url.includes('x.com')) return 'tag';
  if (url.includes('figma'))    return 'brush';
  if (url.includes('medium') || url.includes('blog')) return 'article';
  return 'language';
}

// ---- CRUD handlers ----
async function handleDelete(id) {
  if (!confirm('Delete this bookmark?')) return;
  try {
    await apiDelete(`/bookmarks/${id}`);
    showToast('Bookmark deleted');
    await loadBookmarks();
    navigate(currentPage);
  } catch (err) { showToast(err.message, 'error'); }
}

async function handleFav(id) {
  try {
    await apiPatch(`/bookmarks/${id}/favorite`);
    await loadBookmarks();
    navigate(currentPage);
  } catch (err) { showToast(err.message, 'error'); }
}

function openEditModal(id) {
  const b = bookmarks.find(x => x._id === id);
  if (!b) return;
  editingId = id;
  document.getElementById('modal-title').textContent       = 'Edit Bookmark';
  document.getElementById('input-title').value             = b.title;
  document.getElementById('input-url').value               = b.url;
  document.getElementById('input-category').value          = b.category || '';
  document.getElementById('input-description').value       = b.description || '';
  document.getElementById('edit-id').value                 = id;
  document.getElementById('add-modal').classList.remove('hidden');
  document.getElementById('add-modal').scrollIntoView({ behavior: 'smooth' });
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Bookmark';
  document.getElementById('input-title').value       = '';
  document.getElementById('input-url').value         = '';
  document.getElementById('input-category').value   = '';
  document.getElementById('input-description').value = '';
  document.getElementById('edit-id').value           = '';
  document.getElementById('form-error').classList.add('hidden');
  document.getElementById('add-modal').classList.remove('hidden');
  document.getElementById('add-modal').scrollIntoView({ behavior: 'smooth' });
}

function closeModal() {
  document.getElementById('add-modal').classList.add('hidden');
  editingId = null;
}

async function saveBookmark() {
  const title       = document.getElementById('input-title').value.trim();
  const url         = document.getElementById('input-url').value.trim();
  const category    = document.getElementById('input-category').value.trim();
  const description = document.getElementById('input-description').value.trim();
  const errEl       = document.getElementById('form-error');

  if (!title || !url) { errEl.textContent = 'Title and URL are required.'; errEl.classList.remove('hidden'); return; }
  if (!url.startsWith('http')) { errEl.textContent = 'URL must start with http:// or https://'; errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');

  try {
    if (editingId) {
      await apiPut(`/bookmarks/${editingId}`, { title, url, category, description });
      showToast('Bookmark updated');
    } else {
      await apiPost('/bookmarks', { title, url, category, description });
      showToast('Bookmark saved');
    }
    closeModal();
    await loadBookmarks();
    navigate(currentPage);
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

// ---- Auth flow ----
async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  try {
    const data = await apiPost('/auth/login', { email, password });
    saveToken(data.token, { name: data.name, email: data.email });
    showMainApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

async function doSignup() {
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errEl    = document.getElementById('signup-error');
  try {
    const data = await apiPost('/auth/signup', { name, email, password });
    saveToken(data.token, { name: data.name, email: data.email });
    showMainApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

async function showMainApp() {
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('main-view').classList.remove('hidden');
  const user = getUser();
  if (user) document.getElementById('user-avatar').textContent = user.name ? user.name[0].toUpperCase() : '?';
  await loadBookmarks();
  navigate('home');
}

function doLogout() {
  clearToken();
  document.getElementById('main-view').classList.add('hidden');
  document.getElementById('auth-view').classList.remove('hidden');
}

// ---- Theme toggle ----
document.getElementById('btn-theme-toggle').addEventListener('click', () => {
  const html = document.documentElement;
  html.classList.toggle('dark');
  localStorage.setItem('bs_theme', html.classList.contains('dark') ? 'dark' : 'light');
});

// ---- Event wiring ----
document.addEventListener('DOMContentLoaded', () => {
  // Restore theme
  if (localStorage.getItem('bs_theme') === 'dark') document.documentElement.classList.add('dark');

  // Auth listeners
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('btn-signup').addEventListener('click', doSignup);
  document.getElementById('btn-logout').addEventListener('click', doLogout);
  document.getElementById('show-signup').addEventListener('click', () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
  });
  document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
  });

  // Keyboard: login on Enter
  ['login-email','login-password'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); }));
  ['signup-name','signup-email','signup-password'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') doSignup(); }));

  // Nav links (delegated)
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-page]');
    if (link && link.dataset.page) { e.preventDefault(); navigate(link.dataset.page); }
  });

  // Bookmark actions
  document.getElementById('btn-add-bookmark').addEventListener('click', openAddModal);
  document.getElementById('btn-quick-save').addEventListener('click', openAddModal);
  document.getElementById('btn-save-bookmark').addEventListener('click', saveBookmark);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal2').addEventListener('click', closeModal);

  // Sort buttons
  ['date','alpha','fav'].forEach(s => {
    const btn = document.getElementById(`sort-${s}`);
    if (btn) btn.addEventListener('click', () => {
      currentSort = s;
      document.querySelectorAll('#sort-date,#sort-alpha,#sort-fav').forEach(b => {
        b.classList.toggle('bg-primary', b.id === `sort-${s}`);
        b.classList.toggle('text-on-primary', b.id === `sort-${s}`);
        b.classList.toggle('text-secondary', b.id !== `sort-${s}`);
      });
      renderBookmarks();
    });
  });

  // Search
  document.getElementById('global-search').addEventListener('input', () => {
    if (currentPage === 'bookmarks') renderBookmarks();
  });

  // Check login state
  if (getToken()) {
    showMainApp();
  }
});

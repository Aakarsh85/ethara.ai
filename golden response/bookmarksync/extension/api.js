// ============================================================
// api.js — Thin fetch wrapper for the BookmarkSync backend
// ============================================================

const API_BASE = 'http://localhost:5000/api'; // Update after deployment

async function getToken() {
  return new Promise(resolve => {
    chrome.storage.local.get('bs_token', data => resolve(data.bs_token || null));
  });
}

async function request(method, path, body) {
  const token = await getToken();
  const opts  = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);
  const res  = await fetch(API_BASE + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const API = {
  signup:         (b)     => request('POST',   '/auth/signup',           b),
  login:          (b)     => request('POST',   '/auth/login',            b),
  getBookmarks:   ()      => request('GET',    '/bookmarks'),
  addBookmark:    (b)     => request('POST',   '/bookmarks',             b),
  updateBookmark: (id, b) => request('PUT',    `/bookmarks/${id}`,       b),
  deleteBookmark: (id)    => request('DELETE', `/bookmarks/${id}`),
  toggleFavorite: (id)    => request('PATCH',  `/bookmarks/${id}/favorite`)
};

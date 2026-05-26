// Thin wrapper around fetch for the backend API.
// Reads the token from chrome.storage.local.

const API_BASE = 'http://localhost:5000/api';

async function getToken() {
  return new Promise(resolve => {
    chrome.storage.local.get('token', data => resolve(data.token || null));
  });
}

async function request(method, path, body) {
  const token = await getToken();
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body)  options.body = JSON.stringify(body);

  const res  = await fetch(API_BASE + path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const API = {
  signup:          (b) => request('POST', '/auth/signup',          b),
  login:           (b) => request('POST', '/auth/login',           b),
  getBookmarks:    ()  => request('GET',  '/bookmarks'),
  addBookmark:     (b) => request('POST', '/bookmarks',            b),
  updateBookmark:  (id, b) => request('PUT',  `/bookmarks/${id}`,  b),
  deleteBookmark:  (id)    => request('DELETE',`/bookmarks/${id}`),
  toggleFavorite:  (id)    => request('PATCH', `/bookmarks/${id}/favorite`)
};
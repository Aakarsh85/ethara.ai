// ============================================================
// auth.js — Auth token helpers using chrome.storage.local
// ============================================================

function saveAuth(token, user) {
  chrome.storage.local.set({ bs_token: token, bs_user: user });
}

function clearAuth() {
  chrome.storage.local.remove(['bs_token', 'bs_user']);
}

async function getStoredUser() {
  return new Promise(resolve => {
    chrome.storage.local.get('bs_user', data => resolve(data.bs_user || null));
  });
}

async function isLoggedIn() {
  return new Promise(resolve => {
    chrome.storage.local.get('bs_token', data => resolve(!!data.bs_token));
  });
}

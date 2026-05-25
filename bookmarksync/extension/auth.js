// Handles saving/clearing the JWT in chrome.storage.local

function saveAuth(token, user) {
  chrome.storage.local.set({ token, user });
}

function clearAuth() {
  chrome.storage.local.remove(['token', 'user']);
}

async function getStoredUser() {
  return new Promise(resolve => {
    chrome.storage.local.get('user', data => resolve(data.user || null));
  });
}

async function isLoggedIn() {
  return new Promise(resolve => {
    chrome.storage.local.get('token', data => resolve(!!data.token));
  });
}

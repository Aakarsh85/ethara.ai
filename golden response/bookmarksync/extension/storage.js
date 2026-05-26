// ============================================================
// storage.js — Local bookmark cache (instant load on open)
// ============================================================

const CACHE_KEY = 'bs_cached_bookmarks';

function cacheBookmarks(bookmarks) {
  chrome.storage.local.set({ [CACHE_KEY]: bookmarks });
}

function getCachedBookmarks() {
  return new Promise(resolve => {
    chrome.storage.local.get(CACHE_KEY, data => resolve(data[CACHE_KEY] || []));
  });
}

function clearCache() {
  chrome.storage.local.remove(CACHE_KEY);
}

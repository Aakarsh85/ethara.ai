// Local cache so bookmarks load instantly before the API responds

const CACHE_KEY = 'cached_bookmarks';

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

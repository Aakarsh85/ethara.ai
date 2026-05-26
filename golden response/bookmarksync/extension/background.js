// ============================================================
// background.js — Manifest V3 Service Worker
// ============================================================

chrome.runtime.onInstalled.addListener(() => {
  console.log('BookmarkSync installed');
});

// Handle messages from popup (e.g. get current tab)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      sendResponse({ tab: tabs[0] });
    });
    return true; // keep message channel open for async response
  }
});

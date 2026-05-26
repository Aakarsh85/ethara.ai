// Service worker — handles extension lifecycle events

// Open popup on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('BookmarkSync installed');
});

// Listen for messages from popup (optional — for future keyboard shortcuts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      sendResponse({ tab: tabs[0] });
    });
    return true; // keep channel open for async response
  }
});

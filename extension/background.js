chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'OPEN_TAB') {
    chrome.tabs.create({ url: `http://localhost:3000?v=${msg.videoId}` });
  }
});
document.getElementById('open-quiz').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const url = new URL(tab.url);
    const videoId = url.searchParams.get('v');
    if (!videoId) {
      document.getElementById('status').textContent = 'Navigate to a YouTube video first.';
      return;
    }
    chrome.tabs.create({ url: `http://localhost:3000?v=${videoId}` });
  });
});
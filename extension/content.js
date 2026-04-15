function waitForPlayer() {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      const controls = document.querySelector('.ytp-right-controls');
      if (controls) { clearInterval(interval); resolve(controls); }
    }, 300);
  });
}

function injectQuizButton() {
  if (document.getElementById('yt-quiz-btn')) return;
  const controls = document.querySelector('.ytp-right-controls');
  if (!controls) return;

  const btn = document.createElement('button');
  btn.id = 'yt-quiz-btn';
  btn.className = 'ytp-button';
  btn.title = 'Take AI Quiz';
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 
               17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 
               1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 
               2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
    </svg>`;

  btn.addEventListener('click', () => {
    console.log('quiz button clicked');
    const videoId = new URLSearchParams(window.location.search).get('v');
    console.log('videoId:', videoId);
    chrome.runtime.sendMessage({ type: 'OPEN_TAB', videoId });
  });

  controls.appendChild(btn);
}

window.addEventListener('yt-navigate-start', () => {
  document.getElementById('yt-quiz-btn')?.remove();
});

window.addEventListener('yt-navigate-finish', () => {
  if (window.location.search.includes('v=')) {
    waitForPlayer().then(injectQuizButton);
  }
});

if (window.location.search.includes('v=')) {
  waitForPlayer().then(injectQuizButton);
}
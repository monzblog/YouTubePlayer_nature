'use strict';

// ── Nature sound playlist ──────────────────────────────────────────────────────
const TRACKS = [
  {
    id: 'eKFTSSKCzWA',
    title: 'Forest Rain — 10 Hours',
    emoji: '🌧️',
    duration: '10:00:00',
  },
  {
    id: 'BHACKCNDMW8',
    title: 'Gentle Rain — Relax',
    emoji: '🌂',
    duration: '3:00:00',
  },
  {
    id: 'V1RPi2MYptM',
    title: 'Ocean Waves — White Noise',
    emoji: '🌊',
    duration: '8:00:00',
  },
  {
    id: 'q76bMs-NwRk',
    title: 'Babbling Brook',
    emoji: '🏞️',
    duration: '3:00:00',
  },
  {
    id: 'lFEGoB_p5Fw',
    title: 'Deep Forest Sounds',
    emoji: '🌲',
    duration: '1:00:00',
  },
  {
    id: 'nMfPqeZjc2c',
    title: 'Seaside Night — Waves & Wind',
    emoji: '🌙',
    duration: '8:00:00',
  },
  {
    id: 'xNN7iTA57jM',
    title: 'Waterfall — Focus & Meditation',
    emoji: '🌀',
    duration: '3:00:00',
  },
  {
    id: 'bP9gMpl1gyQ',
    title: 'Thunderstorm Night — Sleep',
    emoji: '⛈️',
    duration: '8:00:00',
  },
  {
    id: '9Q634rbsypE',
    title: 'Bird Song — Morning Forest',
    emoji: '🐦',
    duration: '3:00:00',
  },
  {
    id: 'Qm846KdZN_M',
    title: 'Night Insects — Autumn',
    emoji: '🦗',
    duration: '3:00:00',
  },
];

// ── State ─────────────────────────────────────────────────────────────────────
let player = null;
let currentIndex = 0;
let isShuffled = false;
let isLooping = true;
let isPlaying = false;
let shuffledOrder = [];

// ── DOM refs ─────────────────────────────────────────────────────────────────
const elPlaylist   = document.getElementById('playlist');
const elTitle      = document.getElementById('track-title');
const elStatus     = document.getElementById('status-bar');
const btnPlay      = document.getElementById('btn-play');
const btnPrev      = document.getElementById('btn-prev');
const btnNext      = document.getElementById('btn-next');
const btnShuffle   = document.getElementById('btn-shuffle');
const btnLoop      = document.getElementById('btn-loop');
const iconPlay     = document.getElementById('icon-play');
const iconPause    = document.getElementById('icon-pause');
const volumeSlider = document.getElementById('volume');

// Auto switch
const autoToggle    = document.getElementById('auto-toggle');
const autoInterval  = document.getElementById('auto-interval');
const autoCountdown = document.getElementById('auto-countdown');

// Pomodoro
const pomoMode     = document.getElementById('pomo-mode');
const pomoTime     = document.getElementById('pomo-time');
const pomoCycle    = document.getElementById('pomo-cycle');
const pomoStart    = document.getElementById('pomo-start');
const pomoReset    = document.getElementById('pomo-reset');
const pomoSkip     = document.getElementById('pomo-skip');
const pomoWorkIn   = document.getElementById('pomo-work');
const pomoBreakIn  = document.getElementById('pomo-break');
const pomoPauseBgm = document.getElementById('pomo-pause-bgm');

// ── Utilities ────────────────────────────────────────────────────────────
function buildShuffledOrder() {
  shuffledOrder = [...Array(TRACKS.length).keys()];
  for (let i = shuffledOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOrder[i], shuffledOrder[j]] = [shuffledOrder[j], shuffledOrder[i]];
  }
}

function getOrderedIndex(pos) {
  return isShuffled ? shuffledOrder[pos] : pos;
}

function setStatus(msg) {
  elStatus.textContent = msg;
}

function setPlayIcon(playing) {
  isPlaying = playing;
  iconPlay.style.display  = playing ? 'none' : '';
  iconPause.style.display = playing ? '' : 'none';
}

// ── Playlist UI ───────────────────────────────────────────────────────────
function renderPlaylist() {
  elPlaylist.innerHTML = '';
  TRACKS.forEach((track, i) => {
    const li = document.createElement('li');
    li.dataset.index = i;
    if (getOrderedIndex(currentIndex) === i) li.classList.add('active');

    li.innerHTML = `
      <span class="pl-icon">${track.emoji}</span>
      <div class="pl-info">
        <div class="pl-name">${track.title}</div>
        <div class="pl-duration">${track.duration}</div>
      </div>`;

    li.addEventListener('click', () => {
      const targetPos = isShuffled
        ? shuffledOrder.indexOf(i)
        : i;
      currentIndex = targetPos !== -1 ? targetPos : i;
      if (!isShuffled) currentIndex = i;
      loadTrack(currentIndex, true);
    });

    elPlaylist.appendChild(li);
  });
}

function highlightActive() {
  const activeIdx = getOrderedIndex(currentIndex);
  elPlaylist.querySelectorAll('li').forEach(li => {
    li.classList.toggle('active', Number(li.dataset.index) === activeIdx);
  });
  const activeLi = elPlaylist.querySelector('li.active');
  if (activeLi) activeLi.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ── Track controls ──────────────────────────────────────────────────────────────
function loadTrack(pos, autoplay = true) {
  currentIndex = ((pos % TRACKS.length) + TRACKS.length) % TRACKS.length;
  const track = TRACKS[getOrderedIndex(currentIndex)];
  elTitle.textContent = track.title;
  setStatus(`${track.emoji}  ${track.title}`);
  highlightActive();

  if (player && player.loadVideoById) {
    if (autoplay) {
      player.loadVideoById(track.id);
    } else {
      player.cueVideoById(track.id);
    }
  }

  // Reset auto-switch countdown on track change
  resetAutoSwitch();
}

function playNext() {
  loadTrack(currentIndex + 1, true);
}

function playPrev() {
  loadTrack(currentIndex - 1, true);
}

// ── YouTube IFrame API callbacks ───────────────────────────────────────────
window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player('youtube-player', {
    height: '100%',
    width: '100%',
    videoId: TRACKS[getOrderedIndex(currentIndex)].id,
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      iv_load_policy: 3,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    },
  });
};

function onPlayerReady(event) {
  const track = TRACKS[getOrderedIndex(currentIndex)];
  elTitle.textContent = track.title;
  setStatus(`${track.emoji}  ${track.title}`);
  player.setVolume(Number(volumeSlider.value));
  event.target.playVideo();
}

function onPlayerStateChange(event) {
  const state = event.data;
  if (state === YT.PlayerState.PLAYING) {
    setPlayIcon(true);
    const data = player.getVideoData();
    if (data && data.title) elTitle.textContent = data.title;
    setStatus(`▶ Now playing: ${TRACKS[getOrderedIndex(currentIndex)].emoji}  ${elTitle.textContent}`);
  } else if (state === YT.PlayerState.PAUSED) {
    setPlayIcon(false);
    setStatus('⏸ Paused');
  } else if (state === YT.PlayerState.ENDED) {
    setPlayIcon(false);
    if (isLooping) {
      playNext();
    }
  } else if (state === YT.PlayerState.BUFFERING) {
    setStatus('⏳ Buffering...');
  }
}

function onPlayerError(event) {
  setStatus(`⚠ Playback error (${event.data}) — skipping to next`);
  setTimeout(playNext, 2000);
}

// ── Button events ────────────────────────────────────────────────────────────
btnPlay.addEventListener('click', () => {
  if (!player) return;
  if (isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
});

btnPrev.addEventListener('click', () => {
  if (player && player.getCurrentTime && player.getCurrentTime() > 5) {
    player.seekTo(0);
  } else {
    playPrev();
  }
});

btnNext.addEventListener('click', playNext);

btnShuffle.addEventListener('click', () => {
  isShuffled = !isShuffled;
  btnShuffle.classList.toggle('active', isShuffled);
  if (isShuffled) {
    buildShuffledOrder();
    currentIndex = shuffledOrder.indexOf(getOrderedIndex(currentIndex));
  }
  setStatus(isShuffled ? '🔀 Shuffle ON' : '➡ Shuffle OFF');
});

btnLoop.addEventListener('click', () => {
  isLooping = !isLooping;
  btnLoop.classList.toggle('active', isLooping);
  setStatus(isLooping ? '🔁 Loop ON' : '▶ Loop OFF');
});

volumeSlider.addEventListener('input', () => {
  if (player && player.setVolume) {
    player.setVolume(Number(volumeSlider.value));
  }
});

// ── Chime sound via Web Audio ─────────────────────────────────────────
let audioCtx = null;
function beep(freq = 660, duration = 0.18, delay = 0) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + duration);
  } catch (e) { /* ignore in environments without audio */ }
}

function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '' });
  }
}

// ── Auto BGM switch ─────────────────────────────────────────────────────────
let autoRemaining = 0;   // remaining seconds
let autoTimerId = null;

function autoIntervalSec() {
  return Number(autoInterval.value) * 60;
}

function formatMMSS(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function resetAutoSwitch() {
  autoRemaining = autoIntervalSec();
  updateAutoCountdown();
}

function updateAutoCountdown() {
  if (!autoToggle.checked) {
    autoCountdown.textContent = 'OFF';
  } else {
    autoCountdown.textContent = formatMMSS(autoRemaining);
  }
}

function tickAutoSwitch() {
  // Do not advance during Pomodoro break while BGM is paused
  if (!autoToggle.checked) return;
  if (pomoActive && pomoIsBreak && pomoPauseBgm.checked) return;
  if (!isPlaying) return; // do not count while paused

  autoRemaining--;
  if (autoRemaining <= 0) {
    setStatus('🔄 Auto-switching BGM');
    playNext();          // playNext → loadTrack → resetAutoSwitch resets the timer
    return;
  }
  updateAutoCountdown();
}

autoToggle.addEventListener('change', () => {
  resetAutoSwitch();
  setStatus(autoToggle.checked
    ? `🔄 Auto-switch ON (every ${autoInterval.value} min)`
    : '🔄 Auto-switch OFF');
});

autoInterval.addEventListener('change', () => {
  resetAutoSwitch();
  setStatus(`🔄 Interval: ${autoInterval.value} min`);
});

// ── Pomodoro timer ────────────────────────────────────────────────────────
let pomoActive = false;     // running
let pomoIsBreak = false;    // break phase
let pomoRemaining = 25 * 60;
let pomoCompleted = 0;      // completed work sets
let pomoTimerId = null;
let bgmWasPlayingBeforeBreak = false;

function pomoWorkSec()  { return Math.max(1, Number(pomoWorkIn.value))  * 60; }
function pomoBreakSec() { return Math.max(1, Number(pomoBreakIn.value)) * 60; }

function renderPomo() {
  pomoTime.textContent = formatMMSS(pomoRemaining);
  pomoMode.textContent = pomoIsBreak ? 'Break' : 'Work';
  pomoMode.classList.toggle('mode-work', !pomoIsBreak);
  pomoMode.classList.toggle('mode-break', pomoIsBreak);
  pomoCycle.textContent = `${pomoCompleted} sets done`;
  pomoStart.textContent = pomoActive ? 'Pause' : 'Start';
}

function pomoResetToWork() {
  pomoIsBreak = false;
  pomoRemaining = pomoWorkSec();
  renderPomo();
}

function startBreak() {
  pomoIsBreak = true;
  pomoRemaining = pomoBreakSec();
  beep(660); beep(880, 0.18, 0.2);
  notify('🍅 Work done!', `Take a ${pomoBreakIn.value} min break`);
  setStatus('☕ Break time');
  // Stop BGM during break
  if (pomoPauseBgm.checked && player) {
    bgmWasPlayingBeforeBreak = isPlaying;
    if (isPlaying) player.pauseVideo();
  }
  renderPomo();
}

function startWork() {
  pomoIsBreak = false;
  pomoRemaining = pomoWorkSec();
  beep(880); beep(660, 0.18, 0.2);
  notify('🍅 Break over!', 'Time to get back to work');
  setStatus('💪 Work time');
  // Resume BGM if it was playing before break
  if (pomoPauseBgm.checked && player && bgmWasPlayingBeforeBreak) {
    player.playVideo();
  }
  renderPomo();
}

function tickPomo() {
  if (!pomoActive) return;
  pomoRemaining--;
  if (pomoRemaining <= 0) {
    if (pomoIsBreak) {
      startWork();
    } else {
      pomoCompleted++;
      startBreak();
    }
    return;
  }
  renderPomo();
}

pomoStart.addEventListener('click', () => {
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  pomoActive = !pomoActive;
  if (pomoActive) setStatus(pomoIsBreak ? '☕ Break time' : '💪 Work time — stay focused');
  else setStatus('⏸ Pomodoro paused');
  renderPomo();
});

pomoReset.addEventListener('click', () => {
  pomoActive = false;
  pomoCompleted = 0;
  pomoResetToWork();
  setStatus('🍅 Pomodoro reset');
});

pomoSkip.addEventListener('click', () => {
  if (pomoIsBreak) {
    startWork();
  } else {
    pomoCompleted++;
    startBreak();
  }
});

// Update display on settings change when stopped
pomoWorkIn.addEventListener('change', () => {
  if (!pomoActive && !pomoIsBreak) { pomoRemaining = pomoWorkSec(); renderPomo(); }
});
pomoBreakIn.addEventListener('change', () => {
  if (!pomoActive && pomoIsBreak) { pomoRemaining = pomoBreakSec(); renderPomo(); }
});

// ── Shared 1-second ticker ─────────────────────────────────────────────────────────
setInterval(() => {
  tickAutoSwitch();
  tickPomo();
}, 1000);

// ── Keyboard shortcuts ──────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  switch (e.key) {
    case ' ':
    case 'k':
      e.preventDefault();
      btnPlay.click();
      break;
    case 'ArrowRight':
    case 'n':
      playNext();
      break;
    case 'ArrowLeft':
    case 'p':
      btnPrev.click();
      break;
    case 's':
      btnShuffle.click();
      break;
    case 'l':
      btnLoop.click();
      break;
    case 'ArrowUp':
      e.preventDefault();
      volumeSlider.value = Math.min(100, Number(volumeSlider.value) + 5);
      volumeSlider.dispatchEvent(new Event('input'));
      break;
    case 'ArrowDown':
      e.preventDefault();
      volumeSlider.value = Math.max(0, Number(volumeSlider.value) - 5);
      volumeSlider.dispatchEvent(new Event('input'));
      break;
  }
});

// ── Init ────────────────────────────────────────────────────────────────────
buildShuffledOrder();
renderPlaylist();
resetAutoSwitch();
pomoResetToWork();
setStatus('Loading YouTube IFrame API...');

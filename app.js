'use strict';

// ── 自然音楽プレイリスト ──────────────────────────────────────────────────────
const TRACKS = [
  {
    id: 'eKFTSSKCzWA',
    title: '森の雨音 — 10時間',
    emoji: '🌧️',
    duration: '10:00:00',
  },
  {
    id: 'BHACKCNDMW8',
    title: '穏やかな雨音 — リラックス',
    emoji: '🌂',
    duration: '3:00:00',
  },
  {
    id: 'V1RPi2MYptM',
    title: '海の波音 — 白いノイズ',
    emoji: '🌊',
    duration: '8:00:00',
  },
  {
    id: 'q76bMs-NwRk',
    title: '小川のせせらぎ',
    emoji: '🏞️',
    duration: '3:00:00',
  },
  {
    id: 'lFEGoB_p5Fw',
    title: '深い森のサウンド',
    emoji: '🌲',
    duration: '1:00:00',
  },
  {
    id: 'nMfPqeZjc2c',
    title: '海辺の夜 — 波と風',
    emoji: '🌙',
    duration: '8:00:00',
  },
  {
    id: 'xNN7iTA57jM',
    title: '滝の音 — 集中と瞑想',
    emoji: '🌀',
    duration: '3:00:00',
  },
  {
    id: 'bP9gMpl1gyQ',
    title: '雷雨の夜 — 睡眠用',
    emoji: '⛈️',
    duration: '8:00:00',
  },
  {
    id: '9Q634rbsypE',
    title: '鳥のさえずり — 朝の森',
    emoji: '🐦',
    duration: '3:00:00',
  },
  {
    id: 'Qm846KdZN_M',
    title: '夜の虫の声 — 秋',
    emoji: '🦗',
    duration: '3:00:00',
  },
];

// ── 状態 ─────────────────────────────────────────────────────────────────────
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

// 自動切り替え
const autoToggle    = document.getElementById('auto-toggle');
const autoInterval  = document.getElementById('auto-interval');
const autoCountdown = document.getElementById('auto-countdown');

// ポモドーロ
const pomoMode     = document.getElementById('pomo-mode');
const pomoTime     = document.getElementById('pomo-time');
const pomoCycle    = document.getElementById('pomo-cycle');
const pomoStart    = document.getElementById('pomo-start');
const pomoReset    = document.getElementById('pomo-reset');
const pomoSkip     = document.getElementById('pomo-skip');
const pomoWorkIn   = document.getElementById('pomo-work');
const pomoBreakIn  = document.getElementById('pomo-break');
const pomoPauseBgm = document.getElementById('pomo-pause-bgm');

// ── ユーティリティ ────────────────────────────────────────────────────────────
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

// ── プレイリスト UI ───────────────────────────────────────────────────────────
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

// ── トラック操作 ──────────────────────────────────────────────────────────────
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

  // 曲が切り替わったら自動切り替えカウントダウンをリセット
  resetAutoSwitch();
}

function playNext() {
  loadTrack(currentIndex + 1, true);
}

function playPrev() {
  loadTrack(currentIndex - 1, true);
}

// ── YouTube IFrame API コールバック ───────────────────────────────────────────
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
    setStatus(`▶ 再生中: ${TRACKS[getOrderedIndex(currentIndex)].emoji}  ${elTitle.textContent}`);
  } else if (state === YT.PlayerState.PAUSED) {
    setPlayIcon(false);
    setStatus('⏸ 一時停止');
  } else if (state === YT.PlayerState.ENDED) {
    setPlayIcon(false);
    if (isLooping) {
      playNext();
    }
  } else if (state === YT.PlayerState.BUFFERING) {
    setStatus('⏳ バッファリング中...');
  }
}

function onPlayerError(event) {
  setStatus(`⚠ 再生エラー (${event.data}) — 次の曲へ移動します`);
  setTimeout(playNext, 2000);
}

// ── ボタンイベント ────────────────────────────────────────────────────────────
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
  setStatus(isShuffled ? '🔀 シャッフルON' : '➡ シャッフルOFF');
});

btnLoop.addEventListener('click', () => {
  isLooping = !isLooping;
  btnLoop.classList.toggle('active', isLooping);
  setStatus(isLooping ? '🔁 ループON' : '▶ ループOFF');
});

volumeSlider.addEventListener('input', () => {
  if (player && player.setVolume) {
    player.setVolume(Number(volumeSlider.value));
  }
});

// ── 通知音 (Web Audio で短いチャイム) ─────────────────────────────────────────
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
  } catch (e) { /* 音声非対応環境では無視 */ }
}

function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '' });
  }
}

// ── 自動 BGM 切り替え ─────────────────────────────────────────────────────────
let autoRemaining = 0;   // 残り秒
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
  // ポモドーロ休憩中で BGM 停止中は切り替えを進めない
  if (!autoToggle.checked) return;
  if (pomoActive && pomoIsBreak && pomoPauseBgm.checked) return;
  if (!isPlaying) return; // 一時停止中はカウントしない

  autoRemaining--;
  if (autoRemaining <= 0) {
    setStatus('🔄 BGM を自動切り替えします');
    playNext();          // playNext → loadTrack → resetAutoSwitch で再セット
    return;
  }
  updateAutoCountdown();
}

autoToggle.addEventListener('change', () => {
  resetAutoSwitch();
  setStatus(autoToggle.checked
    ? `🔄 自動切り替え ON (${autoInterval.value}分ごと)`
    : '🔄 自動切り替え OFF');
});

autoInterval.addEventListener('change', () => {
  resetAutoSwitch();
  setStatus(`🔄 自動切り替え間隔: ${autoInterval.value}分`);
});

// ── ポモドーロタイマー ────────────────────────────────────────────────────────
let pomoActive = false;     // 動作中
let pomoIsBreak = false;    // 休憩フェーズか
let pomoRemaining = 25 * 60;
let pomoCompleted = 0;      // 完了した作業セット数
let pomoTimerId = null;
let bgmWasPlayingBeforeBreak = false;

function pomoWorkSec()  { return Math.max(1, Number(pomoWorkIn.value))  * 60; }
function pomoBreakSec() { return Math.max(1, Number(pomoBreakIn.value)) * 60; }

function renderPomo() {
  pomoTime.textContent = formatMMSS(pomoRemaining);
  pomoMode.textContent = pomoIsBreak ? '休憩' : '作業';
  pomoMode.classList.toggle('mode-work', !pomoIsBreak);
  pomoMode.classList.toggle('mode-break', pomoIsBreak);
  pomoCycle.textContent = `${pomoCompleted} セット完了`;
  pomoStart.textContent = pomoActive ? '一時停止' : '開始';
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
  notify('🍅 作業終了！', `${pomoBreakIn.value}分の休憩を取りましょう`);
  setStatus('☕ 休憩タイム');
  // 休憩中は BGM を止める
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
  notify('🍅 休憩終了！', '作業を再開しましょう');
  setStatus('💪 作業タイム');
  // 休憩前に再生していたら BGM を再開
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
  // 通知許可をリクエスト
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  pomoActive = !pomoActive;
  if (pomoActive) setStatus(pomoIsBreak ? '☕ 休憩中' : '💪 作業中 — 集中しましょう');
  else setStatus('⏸ ポモドーロ一時停止');
  renderPomo();
});

pomoReset.addEventListener('click', () => {
  pomoActive = false;
  pomoCompleted = 0;
  pomoResetToWork();
  setStatus('🍅 ポモドーロをリセットしました');
});

pomoSkip.addEventListener('click', () => {
  if (pomoIsBreak) {
    startWork();
  } else {
    pomoCompleted++;
    startBreak();
  }
});

// 設定変更時、停止中なら表示を更新
pomoWorkIn.addEventListener('change', () => {
  if (!pomoActive && !pomoIsBreak) { pomoRemaining = pomoWorkSec(); renderPomo(); }
});
pomoBreakIn.addEventListener('change', () => {
  if (!pomoActive && pomoIsBreak) { pomoRemaining = pomoBreakSec(); renderPomo(); }
});

// ── 共通 1 秒タイマー ─────────────────────────────────────────────────────────
setInterval(() => {
  tickAutoSwitch();
  tickPomo();
}, 1000);

// ── キーボードショートカット ──────────────────────────────────────────────────
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

// ── 初期化 ────────────────────────────────────────────────────────────────────
buildShuffledOrder();
renderPlaylist();
resetAutoSwitch();
pomoResetToWork();
setStatus('YouTube IFrame API を読み込み中...');

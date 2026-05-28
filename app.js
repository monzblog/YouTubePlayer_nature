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
setStatus('YouTube IFrame API を読み込み中...');

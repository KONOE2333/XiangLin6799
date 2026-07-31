// ===================== 全站背景音乐（播放列表 · 跨页面续播） =====================
(function () {
  const KEY = "xl_bgm";
  const audio = document.getElementById("bgm");
  const btn = document.getElementById("music-btn");
  if (!audio) return;

  // 播放列表：想加歌时，把 mp3 放进 site/audio/ 然后在这里加一项即可
  const PLAYLIST = (window.MUSIC_PLAYLIST && window.MUSIC_PLAYLIST.length)
    ? window.MUSIC_PLAYLIST
    : [{ title: "站点主题曲", src: "audio/bgm.mp3", artist: "XiangLin" }];
  window.MUSIC_PLAYLIST = PLAYLIST;

  let cur = 0;
  let hasFile = true;
  let suspendedByVideo = false;
  let wasPlayingBeforeVideo = false;
  const listeners = [];

  function notify() {
    const info = {
      index: cur,
      title: PLAYLIST[cur].title,
      artist: PLAYLIST[cur].artist || "",
      playing: !audio.paused,
      duration: audio.duration || 0,
      time: audio.currentTime || 0
    };
    listeners.forEach((fn) => { try { fn(info); } catch (e) {} });
  }
  function toast(msg) {
    const old = document.querySelector(".music-toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.className = "music-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }
  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  }
  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ playing: !audio.paused, time: audio.currentTime, index: cur }));
    } catch {}
  }
  function tryPlay() {
    return audio.play()
      .then(() => { if (btn) btn.classList.add("playing"); notify(); })
      .catch(() => {
        if (!hasFile) toast("还没有背景音乐哦～把音乐文件命名为 bgm.mp3 放进 site/audio/ 即可。");
      });
  }
  function setTrack(i, autoplay) {
    cur = (i % PLAYLIST.length + PLAYLIST.length) % PLAYLIST.length;
    audio.src = PLAYLIST[cur].src;
    if (autoplay) tryPlay(); else notify();
    saveState();
  }

  audio.addEventListener("error", () => { hasFile = false; });

  let state = loadState();
  if (!state) state = { playing: true, time: 0, index: 0 };
  cur = state.index || 0;
  audio.src = PLAYLIST[cur].src;

  if (state.playing && hasFile) {
    try { audio.currentTime = state.time || 0; } catch {}
    if (btn) btn.classList.add("playing");
    tryPlay();
  }
  notify();

  // 进入页面后首次交互补播（点音乐按钮 / 播放器控件除外）
  const resume = (e) => {
    if (e.target.closest && e.target.closest("#music-btn")) return;
    if (e.target.closest && e.target.closest(".mp-toggle")) return;
    if (!audio.paused) { document.removeEventListener("pointerdown", resume); return; }
    if (suspendedByVideo) return;
    if (!state.playing) return;
    tryPlay().then(() => document.removeEventListener("pointerdown", resume));
  };
  if (state.playing && hasFile) document.addEventListener("pointerdown", resume);

  if (btn) btn.addEventListener("click", () => {
    if (audio.paused) tryPlay().then(saveState);
    else { audio.pause(); if (btn) btn.classList.remove("playing"); saveState(); }
    notify();
  });

  audio.addEventListener("timeupdate", notify);
  audio.addEventListener("ended", () => setTrack(cur + 1, true));

  // ---- 暴露控制接口（供首页音乐播放器与各页视频暂停恢复使用） ----
  window.XLAudio = window.XLAudio || {};
  window.XLAudio.onChange = function (fn) { listeners.push(fn); };
  window.XLAudio.play = function (i) { if (typeof i === "number") setTrack(i, true); else tryPlay(); };
  window.XLAudio.toggle = function () {
    if (audio.paused) tryPlay().then(saveState);
    else { audio.pause(); if (btn) btn.classList.remove("playing"); saveState(); }
    notify();
  };
  window.XLAudio.next = function () { setTrack(cur + 1, true); };
  window.XLAudio.prev = function () { setTrack(cur - 1, true); };
  window.XLAudio.getInfo = function () {
    return { index: cur, title: PLAYLIST[cur].title, artist: PLAYLIST[cur].artist || "", playing: !audio.paused };
  };
  window.XLAudio.pauseForVideo = function () {
    suspendedByVideo = true;
    wasPlayingBeforeVideo = !audio.paused;
    if (!audio.paused) { audio.pause(); if (btn) btn.classList.remove("playing"); saveState(); notify(); }
  };
  window.XLAudio.resumeAfterVideo = function () {
    suspendedByVideo = false;
    if (wasPlayingBeforeVideo) tryPlay().then(saveState);
  };
  window.XLAudio.isPlaying = function () { return !audio.paused; };

  function persist() { saveState(); }
  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", () => { if (document.hidden) persist(); });
})();

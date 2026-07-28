// ===================== 全站背景音乐（跨页面续播，不从头重播） =====================
(function () {
  const KEY = "xl_bgm";
  const audio = document.getElementById("bgm");
  const btn = document.getElementById("music-btn");
  if (!audio || !btn) return;

  let hasFile = true;
  audio.addEventListener("error", () => { hasFile = false; });

  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
  }
  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ playing: !audio.paused, time: audio.currentTime }));
    } catch {}
  }

  // 首次访问默认播放；之后读取上次的播放状态与进度
  let state = loadState();
  if (!state) state = { playing: true, time: 0 };

  function toast(msg) {
    const old = document.querySelector(".music-toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.className = "music-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4200);
  }

  function tryPlay() {
    return audio.play()
      .then(() => { btn.classList.add("playing"); })
      .catch(() => {
        if (!hasFile) toast("还没有背景音乐哦～把音乐文件命名为 bgm.mp3 放进 site/audio/ 文件夹即可。");
      });
  }

  // 进入页面：若上次在播放，恢复到上次进度（浏览器限制需用户手势才会真正出声）
  if (state.playing && hasFile) {
    try { audio.currentTime = state.time || 0; } catch {}
    btn.classList.add("playing");
    tryPlay();
  }

  // 跳转后用户第一次交互时补播（点按钮 / 看视频期间除外）
  const resume = (e) => {
    if (e.target.closest && e.target.closest("#music-btn")) return;
    if (!audio.paused) { document.removeEventListener("pointerdown", resume); return; }
    if (suspendedByVideo) return;            // 看视频时保持静音
    if (!state.playing) return;              // 用户上次本就关了音乐
    tryPlay().then(() => document.removeEventListener("pointerdown", resume));
  };
  if (state.playing && hasFile) document.addEventListener("pointerdown", resume);

  btn.addEventListener("click", () => {
    if (audio.paused) {
      tryPlay().then(saveState);
    } else {
      audio.pause();
      btn.classList.remove("playing");
      saveState();
    }
  });

  // 离开页面时保存进度与状态，跳到别的板块后不会从头播放
  function persist() { saveState(); }
  window.addEventListener("pagehide", persist);
  document.addEventListener("visibilitychange", () => { if (document.hidden) persist(); });

  // ---- 供其它脚本调用：看视频时暂停 BGM，关闭后恢复 ----
  let suspendedByVideo = false;
  let wasPlayingBeforeVideo = false;
  window.XLAudio = {
    pauseForVideo() {
      suspendedByVideo = true;
      wasPlayingBeforeVideo = !audio.paused;
      if (!audio.paused) {
        audio.pause();
        btn.classList.remove("playing");
        saveState();
      }
    },
    resumeAfterVideo() {
      suspendedByVideo = false;
      if (wasPlayingBeforeVideo) tryPlay().then(saveState);
    },
    isPlaying() { return !audio.paused; }
  };
})();

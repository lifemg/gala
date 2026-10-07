/* ==================================================================
 * SILENTFORGE DEV STATION — 音乐播放器
 * ------------------------------------------------------------------
 * 行为说明：
 *   1. 优先播放 data.js 里 TRACKS[].file 指向的 mp3。
 *   2. 如果那个文件不存在（还没上传），自动切换到内置合成器，
 *      按曲目生成一段可听的演示旋律 —— 这样栏目永远不会是空的。
 *   3. 你把 mp3 放进 assets/music/ 并保持文件名一致，就自动变成真曲。
 * ================================================================== */
(function () {
  'use strict';

  const SF = window.SF;
  const { $, $$, esc, toast, sfx, fmtTime } = SF;

  const el = {};
  let tracks = [];
  let current = -1;
  let mode = 'idle';        // 'file' | 'demo' | 'idle'
  let demo = null;          // 合成器实例
  let seeking = false;

  /* ================================================================
   * 内置合成器（占位试听）
   * ================================================================ */
  function createSynth(seed, onTick) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;

    let ctx, master, timer = null, startAt = 0, loopDur = 0, stopped = true;
    let step = 0;

    // 简易可复现随机
    let s = seed * 9301 + 49297;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    // 五声音阶（听感安全，随机也不会难听）
    const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const BASS = [65.41, 73.42, 87.31, 98.0];
    const BPM = 84 + Math.floor(rnd() * 24);
    const SPB = 60 / BPM / 2;              // 八分音符
    const STEPS = 32;                      // 32 个八分音符 = 4 小节

    // 预生成旋律
    const melody = [];
    let cur = Math.floor(rnd() * SCALE.length);
    for (let i = 0; i < STEPS; i++) {
      if (rnd() < 0.62) {
        cur = Math.max(0, Math.min(SCALE.length - 1, cur + Math.round((rnd() - 0.5) * 4)));
      }
      melody.push(rnd() < 0.22 ? null : SCALE[cur]);   // 留白，别太满
    }
    const bassLine = [];
    for (let i = 0; i < STEPS; i++) {
      bassLine.push(i % 8 === 0 ? BASS[Math.floor(i / 8) % BASS.length] : null);
    }

    function note(freq, t, dur, type, vol) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    function scheduleLoop() {
      const t0 = ctx.currentTime + 0.08;
      startAt = t0;
      for (let i = 0; i < STEPS; i++) {
        const t = t0 + i * SPB;
        const f = melody[i];
        if (f) {
          note(f, t, SPB * 1.7, 'triangle', 0.055);
          note(f * 2, t, SPB * 1.1, 'sine', 0.016);
        }
        const b = bassLine[i];
        if (b) note(b, t, SPB * 3.6, 'sine', 0.075);
      }
      loopDur = STEPS * SPB;
    }

    return {
      get duration() { return loopDur; },
      get position() {
        if (stopped || !ctx) return 0;
        return Math.max(0, ctx.currentTime - startAt);
      },
      get playing() { return !stopped; },
      start() {
        if (!ctx) {
          ctx = new Ctx();
          master = ctx.createGain();
          master.gain.value = 0.5;
          master.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        stopped = false;
        step = 0;
        scheduleLoop();
        clearInterval(timer);
        timer = setInterval(() => {
          if (stopped) return;
          // 循环：每圈重新排程
          if (ctx.currentTime - startAt >= loopDur - 0.6) scheduleLoop();
          if (onTick) onTick();
        }, 120);
      },
      stop() {
        stopped = true;
        clearInterval(timer);
        timer = null;
        if (master && ctx) {
          try { master.disconnect(); } catch (e) {}
          master = ctx.createGain();
          master.gain.value = 0.5;
          master.connect(ctx.destination);
        }
        startAt = ctx ? ctx.currentTime : 0;
      },
      setVolume(v) {
        if (master) master.gain.value = SF.clamp(v, 0, 1) * 0.7;
        else if (ctx) master.gain.value = SF.clamp(v, 0, 1) * 0.7;
      },
    };
  }

  /* ================================================================
   * 渲染
   * ================================================================ */
  function renderList() {
    el.list.innerHTML = tracks.map((t, i) => `
      <li class="track" data-i="${i}" role="button" tabindex="0" aria-label="播放 ${esc(t.title)}">
        <span class="track-no">${String(i + 1).padStart(2, '0')}</span>
        <span class="track-main">
          <span class="track-title">${esc(t.title)}</span>
          <span class="track-sub">${esc(t.artist)} · ${esc(t.album)}</span>
        </span>
        <span class="track-tags">${(t.tags || []).map((g) => `<span class="tag">${esc(g)}</span>`).join('')}</span>
        <span class="track-dur" data-dur="${i}">${esc(t.duration || '—')}</span>
      </li>`).join('');

    SF.$$('.track', el.list).forEach((row) => {
      const go = () => play(Number(row.dataset.i));
      row.addEventListener('click', go);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
  }

  function paintTags(container, tags) {
    container.innerHTML = (tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  }

  function highlight() {
    SF.$$('.track', el.list).forEach((row, i) => {
      row.classList.toggle('is-active', i === current);
      const durEl = row.querySelector('[data-dur]');
      if (!durEl) return;
      if (i === current && mode === 'demo') durEl.textContent = 'DEMO';
      else durEl.textContent = tracks[i].duration || '—';
    });
  }

  function setPlayIcon(playing) {
    el.playIconPath.setAttribute('d', playing
      ? 'M7 5h4v14H7zM13 5h4v14h-4z'                 // 暂停
      : 'M8 5v14l11-7z');                            // 播放
    el.btnPlay.setAttribute('aria-label', playing ? '暂停' : '播放');
    el.player.classList.toggle('is-playing', playing);
  }

  function note(text) {
    el.note.textContent = text || '';
  }

  /* ================================================================
   * 播放控制
   * ================================================================ */
  function play(i) {
    if (!tracks.length) return;
    i = ((i % tracks.length) + tracks.length) % tracks.length;

    const wasSame = i === current;
    stopAll();
    current = i;
    const t = tracks[i];

    el.playerTitle.textContent = t.title;
    el.playerArtist.textContent = t.artist + ' · ' + t.album;
    paintTags(el.playerTags, t.tags);
    el.playerArtImg.src = t.cover || 'assets/img/icon.png';
    el.playerArtImg.alt = t.title + ' 封面';
    highlight();

    // 先试真文件
    mode = 'file';
    el.audio.src = t.file;
    el.audio.volume = Number(el.vol.value) / 100;

    const p = el.audio.play();
    if (p && p.catch) {
      p.catch(() => {
        // 自动播放被拦截时给出提示，不切演示模式
        if (!el.audio.error) return;
        startDemo(i);
      });
    }
    if (!wasSame) note('');
  }

  function startDemo(i) {
    mode = 'demo';
    const t = tracks[i];
    demo = createSynth(i + 1, () => {
      if (mode === 'demo' && demo) updateProgress(demo.position, demo.duration);
    });
    if (!demo) {
      note('浏览器不支持 WebAudio，无法试听。把 mp3 放进 assets/music/ 即可正常播放。');
      return;
    }
    demo.setVolume(Number(el.vol.value) / 100);
    demo.start();
    setPlayIcon(true);
    highlight();
    note('未找到音频文件 "' + t.file + '" —— 正在播放内置演示旋律。把 mp3 放到该路径即可自动换成真曲。');
  }

  function stopAll() {
    // 停掉音频元素
    try {
      el.audio.pause();
      el.audio.removeAttribute('src');
      el.audio.load();
    } catch (e) { /* 忽略 */ }
    // 停掉合成器
    if (demo) { demo.stop(); demo = null; }
    mode = 'idle';
    setPlayIcon(false);
  }

  function pause() {
    if (mode === 'file') {
      el.audio.pause();
      setPlayIcon(false);
    } else if (mode === 'demo' && demo) {
      demo.stop();
      demo = null;
      setPlayIcon(false);
      mode = 'demo-paused';
    }
  }

  function resume() {
    if (mode === 'demo-paused') { startDemo(current); return; }
    if (mode === 'file') {
      el.audio.play().catch(() => {});
      setPlayIcon(true);
    } else {
      play(current < 0 ? 0 : current);
    }
  }

  function toggle() {
    const playing = mode === 'file' ? !el.audio.paused : (mode === 'demo' && demo && demo.playing);
    if (playing) pause();
    else resume();
  }

  function next() { play(current + 1); }
  function prev() {
    // 播放超过 3 秒时，先回到开头
    if (mode === 'file' && el.audio.currentTime > 3) { el.audio.currentTime = 0; return; }
    play(current - 1);
  }

  function updateProgress(pos, dur) {
    if (seeking) return;
    el.time.textContent = fmtTime(pos) + ' / ' + fmtTime(dur);
    el.seek.value = dur > 0 ? Math.round((pos / dur) * 1000) : 0;
  }

  /* ================================================================
   * 事件绑定
   * ================================================================ */
  function bind() {
    el.btnPlay.addEventListener('click', () => { sfx.click(); toggle(); });
    el.btnNext.addEventListener('click', () => { sfx.ui(); next(); });
    el.btnPrev.addEventListener('click', () => { sfx.ui(); prev(); });

    // 音频元素事件
    el.audio.addEventListener('play', () => { setPlayIcon(true); if (mode === 'file') note(''); });
    el.audio.addEventListener('pause', () => setPlayIcon(false));
    el.audio.addEventListener('ended', () => {
      if (el.loop.checked) next();
      else setPlayIcon(false);
    });
    el.audio.addEventListener('loadedmetadata', () => {
      const d = el.audio.duration;
      if (isFinite(d) && d > 0) updateProgress(el.audio.currentTime, d);
    });
    el.audio.addEventListener('timeupdate', () => {
      if (mode === 'file') updateProgress(el.audio.currentTime, el.audio.duration);
    });
    el.audio.addEventListener('error', () => {
      // 文件不存在 / 解码失败 -> 演示模式
      if (mode === 'file' && current > -1) {
        const p = el.audio.play();
        if (p && p.catch) p.catch(() => {});
        startDemo(current);
      }
    });
    // 用 error 事件可能因播放未启动而不触发，补一个显式探测
    el.audio.addEventListener('stalled', () => {
      if (mode === 'file' && el.audio.readyState === 0 && current > -1) startDemo(current);
    });

    // 进度条
    el.seek.addEventListener('input', () => { seeking = true; });
    el.seek.addEventListener('change', () => {
      const ratio = Number(el.seek.value) / 1000;
      if (mode === 'file' && isFinite(el.audio.duration)) {
        el.audio.currentTime = ratio * el.audio.duration;
      }
      seeking = false;
    });
    el.seek.addEventListener('pointerup', () => {
      const ratio = Number(el.seek.value) / 1000;
      if (mode === 'file' && isFinite(el.audio.duration)) el.audio.currentTime = ratio * el.audio.duration;
      seeking = false;
    });

    // 音量
    el.vol.addEventListener('input', () => {
      const v = Number(el.vol.value) / 100;
      el.audio.volume = v;
      if (demo) demo.setVolume(v);
      try { localStorage.setItem('sf.volume', String(el.vol.value)); } catch (e) {}
    });

    // 循环
    el.loop.addEventListener('change', () => {
      try { localStorage.setItem('sf.loop', el.loop.checked ? '1' : '0'); } catch (e) {}
    });

    // 键盘：仅在音乐区块可见时生效，避免和页面滚动抢键
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const sec = document.getElementById('music');
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      const visible = r.top < window.innerHeight * 0.72 && r.bottom > window.innerHeight * 0.28;
      if (!visible) return;

      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });
  }

  /* ================================================================
   * 初始化
   * ================================================================ */
  function init() {
    el.player = $('#player');
    if (!el.player) return;

    el.list = $('#trackList');
    el.audio = $('#audio');
    el.playIconPath = $('#playIconPath');
    el.btnPlay = $('#btnPlay');
    el.btnNext = $('#btnNext');
    el.btnPrev = $('#btnPrev');
    el.seek = $('#plSeek');
    el.vol = $('#plVol');
    el.loop = $('#plLoop');
    el.time = $('#plTime');
    el.note = $('#playerNote');
    el.playerTitle = $('#playerTitle');
    el.playerArtist = $('#playerArtist');
    el.playerTags = $('#playerTags');
    el.playerArtImg = $('#playerArtImg');

    tracks = (window.TRACKS || []).slice();

    /* 还没有曲目 -> 整块换成「敬请期待」，不显示空播放器 */
    if (!tracks.length) {
      const section = document.getElementById('music');
      const wrap = section ? section.querySelector('.wrap') : null;
      if (wrap) {
        const oldPlayer = el.player;
        const oldList = el.list;
        if (oldPlayer) oldPlayer.hidden = true;
        if (oldList) oldList.hidden = true;
        const box = document.createElement('div');
        box.className = 'soon';
        box.innerHTML =
          '<div class="soon-mark" aria-hidden="true">♪</div>' +
          '<h3 class="soon-title">敬请期待</h3>' +
          '<p class="soon-note">原创 BGM 与主题曲还在制作中，做好会放在这里试听。</p>' +
          '<div class="soon-line" aria-hidden="true"><i></i><i></i><i></i></div>';
        wrap.appendChild(box);
      }
      return;
    }

    // 恢复上次音量 / 循环
    try {
      const v = localStorage.getItem('sf.volume');
      if (v !== null) el.vol.value = v;
      const lp = localStorage.getItem('sf.loop');
      if (lp !== null) el.loop.checked = lp === '1';
    } catch (e) { /* 忽略 */ }

    el.audio.volume = Number(el.vol.value) / 100;
    renderList();
    bind();

    // 有真文件就探测时长，让列表显示真实时长
    tracks.forEach((t, i) => {
      const probe = document.createElement('audio');
      probe.preload = 'metadata';
      probe.src = t.file;
      probe.addEventListener('loadedmetadata', () => {
        if (!isFinite(probe.duration) || probe.duration <= 0) return;
        tracks[i].duration = fmtTime(probe.duration);
        const cell = el.list.querySelector('[data-dur="' + i + '"]');
        if (cell && i !== current) cell.textContent = tracks[i].duration;
      });
      probe.addEventListener('error', () => { /* 没文件就用默认 '—' */ });
    });

    // 首次进入音乐区块时不自动播放（浏览器会拦截），只预热 UI
    updateProgress(0, 0);
  }

  SF.player = { init, play, next, prev, toggle };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

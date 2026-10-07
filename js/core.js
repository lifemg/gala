/* ==================================================================
 * SILENTFORGE DEV STATION — 核心库
 * 设置存储 / 主题 / 提示 / 音效 / 小工具
 * 必须在其他脚本之前加载。
 * ================================================================== */
(function () {
  'use strict';

  const STORE_KEY = 'sf.settings.v1';

  /* ----------------------------------------------------------------
   * 默认设置
   * ---------------------------------------------------------------- */
  const DEFAULTS = {
    theme: (window.SITE && SITE.defaultTheme) || 'dark',
    accent: '#e0a03a',
    bg: (window.SITE && SITE.background) || '',
    dim: 100,
    blur: 0,
    parallax: true,
    pet: window.SITE ? SITE.petDefaultOn !== false : true,
    petLean: true,
    fx: true,
    sfx: true,
    cursor: true,
    reduce: false,
  };

  function loadSettings() {
    const out = Object.assign({}, DEFAULTS);
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        for (const k of Object.keys(DEFAULTS)) {
          if (saved[k] !== undefined && saved[k] !== null) out[k] = saved[k];
        }
      }
    } catch (e) {
      /* localStorage 不可用时静默用默认值 */
    }
    // 系统层面要求减少动画时，尊重系统设置
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      out.reduce = true;
    }
    return out;
  }

  const settings = loadSettings();

  function saveSettings() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(settings));
    } catch (e) { /* 忽略写入失败 */ }
  }

  /* ----------------------------------------------------------------
   * 事件总线
   * ---------------------------------------------------------------- */
  const listeners = {};
  function on(evt, cb) {
    (listeners[evt] || (listeners[evt] = [])).push(cb);
    return () => off(evt, cb);
  }
  function off(evt, cb) {
    const arr = listeners[evt];
    if (!arr) return;
    const i = arr.indexOf(cb);
    if (i > -1) arr.splice(i, 1);
  }
  function emit(evt, payload) {
    (listeners[evt] || []).forEach((cb) => {
      try { cb(payload); } catch (e) { console.warn('[SF] 监听器出错:', evt, e); }
    });
  }

  /* ----------------------------------------------------------------
   * 工具
   * ---------------------------------------------------------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /** 安全的 URL：只允许 http/https/相对路径/mailto，避免 javascript: 注入 */
  function safeUrl(url) {
    const s = String(url || '').trim();
    if (!s) return '';
    if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return '';   // 其他协议一律拒绝
    return s;                                        // 相对路径
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isTouch = () => window.matchMedia('(hover: none)').matches;

  /** 数字格式化：秒 -> m:ss */
  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ----------------------------------------------------------------
   * 主题
   * ---------------------------------------------------------------- */
  const mqLight = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function resolveTheme() {
    if (settings.theme === 'auto') return mqLight && mqLight.matches ? 'light' : 'dark';
    return settings.theme;
  }

  function applyTheme() {
    const t = resolveTheme();
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#e9e7e2' : '#0b0e13');
    emit('theme', t);
  }

  if (mqLight) {
    const onChange = () => { if (settings.theme === 'auto') applyTheme(); };
    if (mqLight.addEventListener) mqLight.addEventListener('change', onChange);
    else if (mqLight.addListener) mqLight.addListener(onChange);
  }

  /* ----------------------------------------------------------------
   * 应用设置到 DOM
   * ---------------------------------------------------------------- */
  function applyAll() {
    const html = document.documentElement;

    applyTheme();

    html.style.setProperty('--accent', settings.accent);

    // 背景图
    const bgImage = document.getElementById('bgImage');
    if (bgImage) {
      const url = safeUrl(settings.bg);
      if (url) {
        bgImage.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
        bgImage.classList.add('has-image');
        bgImage.style.opacity = String(clamp(settings.dim / 100, 0.2, 1));
        bgImage.style.filter = settings.blur > 0 ? 'blur(' + settings.blur + 'px)' : '';
      } else {
        bgImage.style.backgroundImage = '';
        bgImage.classList.remove('has-image');
        bgImage.style.opacity = '0';
        bgImage.style.filter = '';
      }
    }

    html.setAttribute('data-cursor', settings.cursor ? '1' : '0');
    html.setAttribute('data-reduce', settings.reduce ? '1' : '0');
    html.setAttribute('data-parallax', settings.parallax ? '1' : '0');

    emit('settings', settings);
  }

  function set(key, value) {
    if (!(key in DEFAULTS)) return;
    settings[key] = value;
    saveSettings();
    applyAll();
  }

  function reset() {
    Object.assign(settings, DEFAULTS);
    // 系统减少动画的偏好仍然保留
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      settings.reduce = true;
    }
    saveSettings();
    applyAll();
  }

  /* ----------------------------------------------------------------
   * Toast 提示
   * ---------------------------------------------------------------- */
  let toastTimer = null;
  function toast(msg, ms) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    // 强制回流，保证过渡生效
    void el.offsetWidth;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('is-on');
      setTimeout(() => { el.hidden = true; }, 360);
    }, ms || 2200);
  }

  /* ----------------------------------------------------------------
   * 音效（WebAudio 合成，无需音频文件）
   * ---------------------------------------------------------------- */
  let actx = null;
  function audioCtx() {
    if (!settings.sfx) return null;
    if (!actx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      try { actx = new Ctx(); } catch (e) { return null; }
    }
    if (actx.state === 'suspended') actx.resume().catch(() => {});
    return actx;
  }

  /** 单个音符 */
  function tone(opts) {
    const ctx = audioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + (opts.delay || 0);
    const dur = opts.dur || 0.2;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = opts.type || 'triangle';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), t0 + dur);

    const vol = (opts.gain == null ? 0.16 : opts.gain);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.03, dur * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** 噪声（剑鸣 / 破空） */
  function noise(opts) {
    const ctx = audioCtx();
    if (!ctx) return;
    const dur = opts.dur || 0.3;
    const t0 = ctx.currentTime + (opts.delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // 带衰减的白噪声，越到后面越弱
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, opts.decay || 2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = opts.filter || 'bandpass';
    filter.frequency.setValueAtTime(opts.freq || 1800, t0);
    if (opts.to) filter.frequency.exponentialRampToValueAtTime(Math.max(40, opts.to), t0 + dur);
    filter.Q.value = opts.q == null ? 1.2 : opts.q;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.gain == null ? 0.14 : opts.gain, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  const sfx = {
    /** 通用点击 */
    click() { tone({ freq: 720, dur: 0.07, type: 'square', gain: 0.05 }); },

    /** 界面切换 */
    ui() {
      tone({ freq: 520, to: 780, dur: 0.1, type: 'triangle', gain: 0.07 });
    },

    /** 剑出鞘：金属噪声 + 高频泛音 */
    sword() {
      noise({ freq: 4200, to: 900, dur: 0.42, gain: 0.13, q: 1.6, decay: 2.4 });
      tone({ freq: 1480, to: 2600, dur: 0.28, type: 'triangle', gain: 0.09 });
      tone({ freq: 2960, to: 1900, dur: 0.34, type: 'sine', gain: 0.05, delay: 0.03 });
    },

    /** 雷法：低频轰鸣 + 长噪声 */
    thunder() {
      noise({ freq: 260, to: 60, dur: 1.15, gain: 0.2, filter: 'lowpass', decay: 1.4, q: 0.7 });
      noise({ freq: 5200, to: 700, dur: 0.5, gain: 0.12, delay: 0.04, decay: 2.6 });
      tone({ freq: 70, to: 38, dur: 0.9, type: 'sawtooth', gain: 0.12 });
    },

    /** 护盾 / 灵光：上行和弦 */
    barrier() {
      [392, 523.25, 659.25, 783.99].forEach((f, i) => {
        tone({ freq: f, dur: 0.55, type: 'sine', gain: 0.075, delay: i * 0.055 });
      });
    },

    /** 剑阵：密集剑气 */
    swordArray() {
      for (let i = 0; i < 7; i++) {
        noise({
          freq: 3000 + Math.random() * 2600,
          to: 700,
          dur: 0.22,
          gain: 0.075,
          delay: i * 0.075,
          decay: 3,
          q: 2,
        });
      }
      tone({ freq: 880, to: 1760, dur: 0.6, type: 'triangle', gain: 0.07, delay: 0.1 });
    },

    /** 大招：全屏爆发 */
    ultimate() {
      noise({ freq: 180, to: 45, dur: 1.6, gain: 0.22, filter: 'lowpass', decay: 1.2, q: 0.6 });
      [261.63, 329.63, 392, 523.25, 659.25].forEach((f, i) => {
        tone({ freq: f, dur: 1.2, type: 'sine', gain: 0.07, delay: i * 0.06 });
      });
      for (let i = 0; i < 10; i++) {
        noise({
          freq: 3600 + Math.random() * 3000,
          to: 800,
          dur: 0.3,
          gain: 0.06,
          delay: 0.12 + i * 0.055,
          decay: 3,
          q: 2.4,
        });
      }
    },

    /** 术法：柔和上升 */
    spell() {
      tone({ freq: 300, to: 1200, dur: 0.5, type: 'sine', gain: 0.08 });
      tone({ freq: 452, to: 1810, dur: 0.46, type: 'triangle', gain: 0.05, delay: 0.04 });
    },

    /** 失败 / 冷却中 */
    deny() {
      tone({ freq: 220, to: 150, dur: 0.16, type: 'square', gain: 0.06 });
    },

    /** 提示音 */
    ping() {
      tone({ freq: 1320, dur: 0.14, type: 'sine', gain: 0.06 });
      tone({ freq: 1980, dur: 0.18, type: 'sine', gain: 0.035, delay: 0.06 });
    },
  };

  /* ----------------------------------------------------------------
   * 点击波纹（全站反馈，让人感觉“有回应”）
   * ---------------------------------------------------------------- */
  function initRipple() {
    document.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (settings.reduce) return;
      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 660);
    }, { passive: true });
  }

  /* ----------------------------------------------------------------
   * 导出
   * ---------------------------------------------------------------- */
  window.SF = {
    settings,
    DEFAULTS,
    set,
    reset,
    save: saveSettings,
    applyAll,
    applyTheme,
    resolveTheme,
    on,
    off,
    emit,
    $,
    $$,
    esc,
    safeUrl,
    clamp,
    isTouch,
    fmtTime,
    toast,
    sfx,
    initRipple,
  };
})();

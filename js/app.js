/* ==================================================================
 * SILENTFORGE DEV STATION — 主应用
 * 内容渲染 / 导航 / 设置面板 / 灯箱 / 滚动动效
 * ================================================================== */
(function () {
  'use strict';

  const SF = window.SF;
  const { $, $$, esc, safeUrl, toast, sfx, clamp, isTouch } = SF;

  /* ================================================================
   * 1. 站点基本信息
   * ================================================================ */
  function renderSite() {
    const s = window.SITE || {};
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

    set('brandName', s.name || 'SILENTFORGE');
    set('brandTag', s.tagline || 'DEV STATION');
    set('heroTitle', s.name || 'SILENTFORGE');
    set('heroSub', s.tagline || 'DEV STATION');
    set('heroDesc', s.intro || '制作 Galgame、RPG 等游戏并提供相关服务。');
    set('footerBrand', (s.name || 'SILENTFORGE') + ' ' + (s.tagline || ''));
    set('footerNote', s.intro || '');
    set('year', String(new Date().getFullYear()));

    document.title = (s.name || 'SILENTFORGE') + ' ' + (s.tagline || '') + ' — Galgame & RPG 开发站';

    // 首屏统计数字
    set('statProjects', String((window.GAMES || []).length).padStart(2, '0'));
    set('statTracks', String((window.TRACKS || []).length).padStart(2, '0'));
    set('statArt', String((window.GALLERY || []).length).padStart(2, '0'));
    set('statDevs', String((window.DEVS || []).length).padStart(2, '0'));
  }

  /* ================================================================
   * 2. 游戏下载
   * ================================================================ */
  const LINK_ICONS = {
    lanzou: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 3v10.6l-3.3-3.3-1.4 1.4L12 17.4l4.7-4.7-1.4-1.4L12 14.6V3zM4 19h16v2H4z"/></svg>',
    github: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>',
    default: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M14 3v2h3.6l-9.3 9.3 1.4 1.4L19 6.4V10h2V3h-7zM5 5h5v2H7v10h10v-3h2v5H5z"/></svg>',
  };

  function statusClass(status) {
    if (/已发布|已完结/.test(status)) return 'is-live';
    if (/开发中|试玩/.test(status)) return 'is-dev';
    return 'is-plan';
  }

  /** 「敬请期待」占位块：内容还没做的栏目用它撑住版面 */
  function comingSoonBlock(title, note, icon) {
    return '<div class="soon">' +
      '<div class="soon-mark" aria-hidden="true">' + (icon || '◈') + '</div>' +
      '<h3 class="soon-title">' + esc(title) + '</h3>' +
      '<p class="soon-note">' + esc(note) + '</p>' +
      '<div class="soon-line" aria-hidden="true"><i></i><i></i><i></i></div>' +
    '</div>';
  }

  function renderGames() {
    const list = $('#gamesList');
    if (!list) return;
    const games = window.GAMES || [];

    if (!games.length) {
      list.innerHTML = comingSoonBlock('敬请期待', '项目还在准备中，做好会第一时间放上来。');
      return;
    }

    list.innerHTML = games.map((g) => {
      /* ---------- 链接按钮 ---------- */
      const links = (g.links || []).map((l) => {
        const url = safeUrl(l.url);
        const pending = !url || url === '#';
        const icon = LINK_ICONS[l.type] || LINK_ICONS.default;
        const ext = pending ? '待补充' : '↗';
        if (pending) {
          return '<button class="link-btn is-pending type-' + esc(l.type || 'default') + '" type="button" ' +
            'data-pending="' + esc(l.hint || '链接待补充') + '">' + icon +
            '<span>' + esc(l.label) + '</span><span class="ext">' + ext + '</span></button>';
        }
        return '<a class="link-btn type-' + esc(l.type || 'default') + '" href="' + esc(url) + '" ' +
          'target="_blank" rel="noopener noreferrer">' + icon +
          '<span>' + esc(l.label) + '</span><span class="ext">' + ext + '</span></a>';
      }).join('');

      /* ---------- 蓝奏云密码（可一键复制） ---------- */
      const pw = g.password || (g.links || []).reduce((acc, l) => acc || l.password || '', '');
      const pwRow = pw
        ? '<div class="game-pw">' +
            '<span class="pw-k">提取码</span>' +
            '<code class="pw-v">' + esc(pw) + '</code>' +
            '<button class="pw-copy" type="button" data-copy="' + esc(pw) + '">复制</button>' +
          '</div>'
        : '';

      const features = (g.features || []).length
        ? '<ul class="game-features">' + g.features.map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul>'
        : '';

      const meta = [g.genre, g.engine].filter(Boolean)
        .map((m) => '<span class="tag">' + esc(m) + '</span>').join('');

      /* ---------- 敬请期待的项目 ---------- */
      if (g.comingSoon) {
        return '<article class="game-card is-soon" data-reveal>' +
          '<div class="game-cover">' +
            '<span class="game-status is-plan">' + esc(g.status || '敬请期待') + '</span>' +
            '<img src="' + esc(g.cover || 'assets/img/icon.png') + '" alt="" loading="lazy">' +
          '</div>' +
          '<div class="game-body">' +
            '<div class="game-head">' +
              '<h3 class="game-title">' + esc(g.title) + '</h3>' +
              (g.titleEn ? '<span class="game-title-en">' + esc(g.titleEn) + '</span>' : '') +
            '</div>' +
            '<p class="game-desc">' + esc(g.desc) + '</p>' +
            '<div class="game-links"><span class="slot-hint">敬请期待</span></div>' +
          '</div>' +
        '</article>';
      }

      /* ---------- 正常项目 ---------- */
      return '<article class="game-card" data-reveal>' +
        '<div class="game-cover">' +
          '<span class="game-status ' + statusClass(g.status) + '">' + esc(g.status || '未知') + '</span>' +
          '<img src="' + esc(g.cover || 'assets/img/icon.png') + '" alt="' + esc(g.title) + ' 封面" loading="lazy">' +
        '</div>' +
        '<div class="game-body">' +
          '<div class="game-head">' +
            '<h3 class="game-title">' + esc(g.title) + '</h3>' +
            (g.titleEn ? '<span class="game-title-en">' + esc(g.titleEn) + '</span>' : '') +
            (g.version ? '<span class="game-ver">' + esc(g.version) + '</span>' : '') +
          '</div>' +
          '<div class="game-meta">' + meta + '</div>' +
          '<p class="game-desc">' + esc(g.desc) + '</p>' +
          features +
          pwRow +
          '<div class="game-links">' + links + '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    // 复制提取码
    $$('[data-copy]', list).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyText(btn.dataset.copy);
      });
    });

    // 待补充的链接给出提示，而不是跳到 '#'
    $$('.link-btn.is-pending', list).forEach((btn) => {
      btn.addEventListener('click', () => {
        sfx.deny();
        toast(btn.dataset.pending || '链接待补充');
      });
    });
  }

  /* ================================================================
   * 3. 推图
   * ================================================================ */
  let galItems = [];
  let galVisible = [];

  function renderGallery() {
    const grid = $('#galleryGrid');
    const filterBox = $('#galFilter');
    if (!grid) return;

    galItems = (window.GALLERY || []).slice();

    // 内容是空的 -> 显示「敬请期待」
    if (!galItems.length) {
      if (filterBox) filterBox.innerHTML = '';
      grid.classList.add('is-empty');
      grid.innerHTML = comingSoonBlock(
        '敬请期待',
        '插画、设定与摸鱼图还在路上，画好了就放上来。',
        '◈'
      );
      return;
    }
    grid.classList.remove('is-empty');

    // 收集标签
    const tagSet = [];
    galItems.forEach((it) => (it.tags || []).forEach((t) => {
      if (tagSet.indexOf(t) === -1) tagSet.push(t);
    }));

    if (filterBox) {
      filterBox.innerHTML = '<button type="button" class="is-active" data-tag="">全部</button>' +
        tagSet.map((t) => '<button type="button" data-tag="' + esc(t) + '">' + esc(t) + '</button>').join('');

      $$('button', filterBox).forEach((b) => {
        b.addEventListener('click', () => {
          $$('button', filterBox).forEach((x) => x.classList.remove('is-active'));
          b.classList.add('is-active');
          applyFilter(b.dataset.tag);
          sfx.click();
        });
      });
    }

    applyFilter('');
  }

  function applyFilter(tag) {
    const grid = $('#galleryGrid');
    if (!grid) return;

    galVisible = galItems
      .map((it, idx) => ({ it, idx }))
      .filter(({ it }) => !tag || (it.tags || []).indexOf(tag) > -1);

    grid.innerHTML = galVisible.map(({ it, idx }, i) => `
      <figure class="gal-item" data-gi="${i}" data-ratio="${esc(it.ratio || 'wide')}" style="animation-delay:${(i * 42)}ms">
        <img src="${esc(it.src)}" alt="${esc(it.title)}" loading="lazy">
        <button class="gal-zoom" type="button" aria-label="查看大图 ${esc(it.title)}">⤢</button>
        <figcaption class="gal-overlay">
          <span class="gal-title">${esc(it.title)}</span>
          <span class="gal-tags">${(it.tags || []).map((t) => `<span>${esc(t)}</span>`).join('')}</span>
        </figcaption>
      </figure>`).join('');

    // 瀑布流高度
    layoutGallery();

    // 点击开灯箱
    $$('.gal-item', grid).forEach((fig) => {
      const open = (e) => {
        e.stopPropagation();
        const i = Number(fig.dataset.gi);
        if (!isNaN(i)) {
          sfx.click();
          openLightbox(i);
        }
      };
      fig.addEventListener('click', open);
      fig.setAttribute('tabindex', '0');
      fig.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); }
      });
    });
  }

  /** 把 data-ratio 解析成 高/宽 比例；返回 0 表示未指定 */
  function parseRatio(val) {
    if (val == null || val === '') return 0;
    if (val === 'wide') return 0.72;     // 约 16:9
    if (val === 'tall') return 1.3;      // 竖图
    if (val === 'square') return 1.0;
    const n = Number(val);
    return isFinite(n) && n > 0 ? n : 0;
  }

  /** 用 JS 计算瀑布流行高，避免 grid-auto-rows 在不同图片比例下留大缝 */
  function layoutGallery() {
    const grid = $('#galleryGrid');
    if (!grid) return;
    const isSmall = window.innerWidth <= 720;
    const rowH = isSmall ? 8 : 10;
    const gap = isSmall ? 10 : 16;

    grid.style.gridAutoRows = rowH + 'px';
    grid.style.gap = gap + 'px';

    $$('.gal-item', grid).forEach((fig) => {
      const img = fig.querySelector('img');
      // data-ratio 是作者指定的版式意图，优先采用；没写才退回图片真实比例
      const hinted = parseRatio(fig.dataset.ratio);

      const measure = (useNatural) => {
        const w = fig.clientWidth;
        if (!w) return;
        const natural = img.naturalWidth && img.naturalHeight
          ? img.naturalHeight / img.naturalWidth
          : 0;
        const ratio = hinted || (useNatural ? natural : 0) || 0.72;
        const h = Math.max(rowH * 14, w * ratio);
        const span = Math.ceil((h + gap) / (rowH + gap));
        fig.style.gridRowEnd = 'span ' + span;
        fig.dataset.h = Math.round(h);
      };

      // 先按已知比例撑起高度，避免加载期间跳动
      measure(false);

      // 没有指定 ratio 时，等图片真实尺寸再精修
      if (!hinted) {
        if (img.complete && img.naturalWidth) measure(true);
        else img.addEventListener('load', () => measure(true), { once: true });
      }
    });
  }

  /* ================================================================
   * 4. 关于
   * ================================================================ */
  const CONTACT_ICONS = {
    qq: 'QQ',
    github: 'GH',
  };

  function renderAbout() {
    const devList = $('#devList');
    const svcList = $('#serviceList');
    const contactCard = $('#contactCard');

    /* ---- 开发者 ---- */
    if (devList) {
      const devs = window.DEVS || [];

      if (!devs.length) {
        devList.innerHTML = comingSoonBlock('敬请期待', '开发者信息待补充。');
      } else {
      devList.innerHTML = devs.map((d) => {
        // 不展示头像时给一个工业风占位块，而不是破图
        let avatar;
        if (d.showAvatar) {
          avatar = '<div class="dev-avatar">' +
            '<img src="' + esc(d.avatar) + '" alt="' + esc(d.name) + ' 头像" loading="lazy"' +
            (d.avatarFallback ? ' data-fallback="' + esc(d.avatarFallback) + '"' : '') + '>' +
          '</div>';
        } else {
          avatar = '<div class="dev-avatar is-placeholder"><span>NO<br>AVATAR</span></div>';
        }

        const contacts = (d.contacts || []).map((c) => {
          const url = safeUrl(c.url || '');
          const ico = CONTACT_ICONS[c.type] || '•';
          const copyBtn = c.type === 'qq'
            ? '<button class="copy" type="button" data-copy="' + esc(c.value) + '" title="复制">复制</button>'
            : '';
          const inner = '<span class="ico">' + esc(ico) + '</span>' +
            '<span class="k">' + esc(c.label) + '</span>' +
            '<span class="v">' + esc(c.value) + '</span>' + copyBtn;

          if (url) {
            return '<a class="contact-line" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>';
          }
          return '<div class="contact-line is-clickable" data-copy="' + esc(c.value) + '">' + inner + '</div>';
        }).join('');

        return '<article class="dev-card" data-reveal>' +
          '<div class="dev-top">' + avatar +
            '<div class="dev-id">' +
              '<h3 class="dev-name">' + esc(d.name) + '</h3>' +
              (d.handle ? '<span class="dev-handle">' + esc(d.handle) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="dev-contacts">' + contacts + '</div>' +
        '</article>';
      }).join('');
      }

      // 头像加载失败时自动退回备用图（占位图），避免出现破图
      $$('.dev-avatar img', devList).forEach((img) => {
        img.addEventListener('error', () => {
          const fb = img.dataset.fallback;
          if (fb && img.src.indexOf(fb) === -1) img.src = fb;
          else img.closest('.dev-avatar').classList.add('is-placeholder');
        });
      });

      // 复制交互
      $$('[data-copy]', devList).forEach((el) => {
        el.addEventListener('click', (e) => {
          // 链接内部不拦截跳转，只处理按钮
          if (el.tagName === 'A' && e.target.tagName !== 'BUTTON') return;
          e.preventDefault();
          e.stopPropagation();
          copyText(el.dataset.copy);
        });
      });
    }

    /* ---- 服务 ---- */
    if (svcList) {
      svcList.innerHTML = (window.SERVICES || []).map((s) =>
        '<div class="service"><h4>' + esc(s.title) + '</h4><p>' + esc(s.desc) + '</p></div>'
      ).join('');
    }

    /* ---- 联系 ---- */
    if (contactCard) {
      const c = window.CONTACT || {};
      const email = c.email ? safeUrl('mailto:' + c.email) : '';
      contactCard.innerHTML =
        '<h3>找我们聊聊</h3>' +
        '<p>' + esc(c.note || '') + '</p>' +
        '<div class="quick">' +
          '<a class="btn btn-ghost" href="#games" data-nav>看看作品</a>' +
          (email ? '<a class="btn btn-ghost" href="' + esc(email) + '">发邮件</a>' : '') +
        '</div>';
    }
  }

  function copyText(text) {
    if (!text) return;
    const done = () => { sfx.ping(); toast('已复制：' + text); };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); }
    catch (e) { toast('复制失败，请手动复制：' + text); }
    ta.remove();
  }

  /* ================================================================
   * 5. 灯箱
   * ================================================================ */
  let lbIndex = 0;

  function openLightbox(i) {
    const lb = $('#lightbox');
    if (!lb || !galVisible.length) return;
    lbIndex = clamp(i, 0, galVisible.length - 1);
    paintLightbox();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function paintLightbox() {
    const it = galVisible[lbIndex];
    if (!it) return;
    const { it: item } = it;
    $('#lbImg').src = item.src;
    $('#lbImg').alt = item.title;
    $('#lbCap').textContent = item.title + (item.tags && item.tags.length ? '　·　' + item.tags.join(' / ') : '') +
      '　(' + (lbIndex + 1) + '/' + galVisible.length + ')';
  }

  function closeLightbox() {
    const lb = $('#lightbox');
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = '';
  }

  function lbStep(d) {
    if (!galVisible.length) return;
    lbIndex = (lbIndex + d + galVisible.length) % galVisible.length;
    paintLightbox();
    sfx.click();
  }

  function initLightbox() {
    const lb = $('#lightbox');
    if (!lb) return;
    $('#lbClose').addEventListener('click', closeLightbox);
    $('#lbPrev').addEventListener('click', (e) => { e.stopPropagation(); lbStep(-1); });
    $('#lbNext').addEventListener('click', (e) => { e.stopPropagation(); lbStep(1); });
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') lbStep(-1);
      else if (e.key === 'ArrowRight') lbStep(1);
    });

    // 触屏左右滑动
    let sx = 0, sy = 0;
    lb.addEventListener('touchstart', (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy)) lbStep(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ================================================================
   * 6. 设置面板
   * ================================================================ */
  function initSettings() {
    const drawer = $('#settingsDrawer');
    const mask = $('#drawerMask');
    const openBtn = $('#settingsBtn');
    const closeBtn = $('#drawerClose');
    if (!drawer) return;

    let lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      mask.hidden = false;
      drawer.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      drawer.classList.remove('is-closing');
      syncControls();
      sfx.ui();
      // 焦点移入抽屉
      setTimeout(() => { const f = drawer.querySelector('button, input'); if (f) f.focus(); }, 60);
    }

    function close() {
      drawer.classList.add('is-closing');
      drawer.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      setTimeout(() => {
        drawer.hidden = true;
        mask.hidden = true;
        drawer.classList.remove('is-closing');
      }, 260);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      sfx.click();
    }

    openBtn.addEventListener('click', () => {
      if (drawer.hidden) open(); else close();
    });
    closeBtn.addEventListener('click', close);
    mask.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.hidden) close();
    });

    /* ---- 控件绑定 ---- */
    const s = SF.settings;

    // 主题分段
    const seg = $('#themeSeg');
    if (seg) {
      $$('button', seg).forEach((b) => {
        b.addEventListener('click', () => {
          SF.set('theme', b.dataset.themeVal);
          sfx.click();
        });
      });
    }

    // 强调色
    const accent = $('#setAccent');
    if (accent) {
      accent.value = s.accent;
      accent.addEventListener('input', () => SF.set('accent', accent.value));
    }

    // 复选框
    const boxes = {
      setPet: 'pet',
      setFx: 'fx',
      setSfx: 'sfx',
      setCursor: 'cursor',
      setReduce: 'reduce',
    };
    Object.keys(boxes).forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = !!s[boxes[id]];
      el.addEventListener('change', () => {
        SF.set(boxes[id], el.checked);
        sfx.click();
      });
    });

    // 恢复默认
    const reset = $('#setReset');
    if (reset) {
      reset.addEventListener('click', () => {
        SF.reset();
        syncControls();
        toast('已恢复默认设置');
        sfx.ping();
      });
    }

    // 把当前设置同步到面板控件
    function syncControls() {
      const cur = SF.settings;
      if (seg) {
        $$('button', seg).forEach((b) => {
          b.setAttribute('aria-checked', String(b.dataset.themeVal === cur.theme));
        });
      }
      if (accent) accent.value = cur.accent;
      Object.keys(boxes).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!cur[boxes[id]];
      });
    }

    // 主题变化时同步分段控件
    SF.on('theme', (t) => {
      if (!seg) return;
      const cur = SF.settings.theme;
      $$('button', seg).forEach((b) => {
        b.setAttribute('aria-checked', String(b.dataset.themeVal === cur));
      });
    });

    syncControls();

    /* ---- 快捷主题按钮 ---- */
    const quick = $('#themeQuickBtn');
    if (quick) {
      quick.addEventListener('click', () => {
        const resolved = SF.resolveTheme();
        SF.set('theme', resolved === 'dark' ? 'light' : 'dark');
        toast(resolved === 'dark' ? '已切换到浅色模式' : '已切换到暗黑模式');
        sfx.ui();
      });
    }
  }

  /* ================================================================
   * 7. 导航
   * ================================================================ */
  function initNav() {
    const toggle = $('#navToggle');
    const mobile = $('#mobileNav');
    const topbar = $('#topbar');

    // 汉堡菜单
    if (toggle && mobile) {
      const close = () => {
        mobile.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', '打开菜单');
      };
      const open = () => {
        mobile.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', '关闭菜单');
      };
      toggle.addEventListener('click', () => {
        if (mobile.hidden) { open(); sfx.ui(); } else close();
      });
      // 点击链接后收起
      $$('a', mobile).forEach((a) => a.addEventListener('click', close));
      // 点击外部收起
      document.addEventListener('click', (e) => {
        if (mobile.hidden) return;
        if (topbar.contains(e.target)) return;
        close();
      });
      // 窗口变宽时重置
      window.addEventListener('resize', () => {
        if (window.innerWidth > 900 && !mobile.hidden) close();
      });
      // ESC 收起
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !mobile.hidden) close();
      });
      const foot = $('#mobileNavFoot');
      if (foot) foot.textContent = 'H = 桌宠 ／ 1-5 = 技能';
    }

    /* ---- 当前区块高亮 ---- */
    const sections = ['home', 'games', 'music', 'gallery', 'about']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const navLinks = $$('.nav a, .mobile-nav a');

    function markActive(id) {
      navLinks.forEach((a) => {
        const match = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-active', match);
        if (match) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    if ('IntersectionObserver' in window && sections.length) {
      const io = new IntersectionObserver((entries) => {
        // 取最靠上且可见的那个
        const visible = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) markActive(visible[0].target.id);
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach((s) => io.observe(s));
    }

    /* ---- 滚动：顶栏收起 / 阴影 ---- */
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
      const y = window.scrollY;
      topbar.classList.toggle('is-scrolled', y > 12);

      // 向下滚且超过一定距离时收起顶栏（移动端避免误触）
      if (!isTouch() || window.innerWidth > 900) {
        if (y > lastY + 6 && y > 320) topbar.classList.add('is-hidden');
        else if (y < lastY - 6) topbar.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* ---- 平滑滚动 + 焦点管理 ---- */
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[data-nav]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const reduce = SF.settings.reduce;
      const top = target.getBoundingClientRect().top + window.scrollY -
        (document.getElementById('topbar').offsetHeight + 10);

      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', href);
      topbar.classList.remove('is-hidden');
      if (mobile && !mobile.hidden) mobile.hidden = true;
      sfx.click();
    });
  }

  /* ================================================================
   * 8. 滚动进场 + 视差 + 数字滚动
   * ================================================================ */
  function initReveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach((el, i) => {
      // 同组元素做出错落感
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms';
      io.observe(el);
    });
  }

  function initParallax() {
    const bgImage = $('#bgImage');
    if (!bgImage) return;
    if (SF.settings.reduce) return;

    let ticking = false;
    let mx = 0, my = 0, tx = 0, ty = 0;

    function frame() {
      ticking = false;
      if (SF.settings.parallax === false) return;
      // 鼠标视差 + 滚动视差
      ty = window.scrollY * 0.06;
      const px = mx * 12;
      const py = my * 12;
      bgImage.style.transform = 'translate3d(' + px.toFixed(2) + 'px,' + (py - ty).toFixed(2) + 'px,0) scale(1.08)';
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });

    if (!isTouch()) {
      window.addEventListener('mousemove', (e) => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
        if (!ticking) { ticking = true; requestAnimationFrame(frame); }
      }, { passive: true });
    }

    frame();
  }

  /* ================================================================
   * 9. 启动
   * ================================================================ */
  function boot() {
    SF.applyAll();

    renderSite();
    renderGames();
    renderGallery();
    renderAbout();

    // 先渲染再接管进场观察，保证新插入的卡片也能动
    initReveal();

    initNav();
    initSettings();
    initLightbox();
    initParallax();
    SF.initRipple();

    // 窗口尺寸变化时重排瀑布流
    let rTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(rTimer);
      rTimer = setTimeout(layoutGallery, 180);
    });

    // 图片加载完成后重排
    window.addEventListener('load', layoutGallery);
    setTimeout(layoutGallery, 400);
    setTimeout(layoutGallery, 1200);

    // 设置变化时部分效果要重算
    SF.on('settings', (s) => {
      if (s.reduce) {
        const bg = $('#bgImage');
        if (bg) bg.style.transform = 'scale(1.04)';
      }
    });

    // 首次访问的小提示
    let visited = false;
    try { visited = !!localStorage.getItem('sf.visited'); } catch (e) {}
    if (!visited) {
      setTimeout(() => {
        toast('提示：按 H 可开关桌宠，按 1~5 让韩立发动技能', 4200);
        try { localStorage.setItem('sf.visited', '1'); } catch (e) {}
      }, 2600);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

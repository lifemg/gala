/* ==================================================================
 * SILENTFORGE DEV STATION — 桌宠 / 角色 / 3D 技能特效
 * ==================================================================
 * 目录
 *   1. 角色设定（含「换图接口」）
 *   2. 技能表
 *   3. 3D 数学与透视相机
 *   4. 二次元角色绘制（高挑修长比例：约 6 头身）
 *   5. 精灵图（换图接口）
 *   6. 全屏 3D 技能特效
 *   7. 桌宠实例与主循环
 *
 * ── 想换成自己的角色立绘？ ────────────────────────────
 * 把图片放进 assets/img/，命名成下面这些即自动生效，不用改代码：
 *     assets/img/pet-hanli.png        韩立
 *     assets/img/pet-nangongwan.png   南宫婉
 *     assets/img/pet-yuanyao.png      元瑶
 *     assets/img/pet-ziling.png       紫灵
 *     assets/img/pet-<角色>-cast.png  施法用的另一套（可选）
 * 格式：横向排列的帧序列（默认 4 帧）透明 PNG。
 * 有图就用图，没图就用第 4 节的手绘版本，两者自动切换。
 * ================================================================== */
(function () {
  'use strict';

  const SF = window.SF;
  const { $, $$, clamp, isTouch } = SF;

  /* ==================================================================
   * 1. 角色设定
   * ================================================================== */
  const CHARS = {
    hanli: {
      name: '韩立',
      title: '青元剑仙',
      /* 服饰：外袍深青、内衬月白、暗金滚边（参考立绘配色） */
      robe: '#2b3f52', robeDark: '#1a2836', robeLight: '#46647f',
      inner: '#e8eef4', innerShade: '#c4d2de',
      trim: '#c9a24e', sash: '#8e6f2e',
      skin: '#f7dcc6', skinShade: '#e2b99d', blush: '#efa2a2',
      hair: '#14161d', hairLight: '#333b4e', hairShine: '#5c6a8a',
      eye: '#3f6f9c', eyeLight: '#93c7ea', pupil: '#141c28', lash: '#10141c',
      accent: '#7fd6ff',
      hairStyle: 'long',
      hasSword: true,
      idle: ['……', '此地灵气尚可。', '修行如逆水行舟。', '又有新剑意了。', '莫要分心。'],
      greet: ['来了。', '且看这一剑。'],
      sprite: { src: 'assets/img/pet-hanli.png', cast: 'assets/img/pet-hanli-cast.png', frames: 4, fps: 7 },
      height: 1.0,
    },

    nangongwan: {
      name: '南宫婉',
      title: '掩月宗',
      robe: '#e9f0f8', robeDark: '#c0d0e2', robeLight: '#ffffff',
      inner: '#ffffff', innerShade: '#dbe5f0',
      trim: '#7ea9dc', sash: '#6f9bd0',
      skin: '#fce6d6', skinShade: '#e9c5ad', blush: '#f09a9a',
      hair: '#1b1f27', hairLight: '#3a4256', hairShine: '#697695',
      eye: '#4f7fb8', eyeLight: '#abdaf7', pupil: '#141c28', lash: '#10141c',
      accent: '#9fdcff',
      hairStyle: 'long',
      hasSword: false,
      idle: ['韩兄。', '今日天色不错。', '……在看什么？', '此曲可还入耳？'],
      greet: ['我来了。', '又见面了。'],
      sprite: { src: 'assets/img/pet-nangongwan.png', cast: 'assets/img/pet-nangongwan-cast.png', frames: 4, fps: 7 },
      height: 0.99,
    },

    yuanyao: {
      name: '元瑶',
      title: '乱星海',
      robe: '#7a51ab', robeDark: '#583a80', robeLight: '#a077cf',
      inner: '#f3e8ff', innerShade: '#d9c4ef',
      trim: '#ffdd93', sash: '#d8b45e',
      skin: '#fcddca', skinShade: '#e7bca2', blush: '#f0999f',
      hair: '#2a1f36', hairLight: '#4b3960', hairShine: '#7b6496',
      eye: '#b473dc', eyeLight: '#dfb4f6', pupil: '#1c1426', lash: '#180f20',
      accent: '#cba0ff',
      hairStyle: 'twin',
      hasSword: false,
      idle: ['嘻嘻~', '在忙什么呢？', '陪我玩会儿嘛。', '我新学了个法术！'],
      greet: ['我来啦！', '咦，你在这儿。'],
      sprite: { src: 'assets/img/pet-yuanyao.png', cast: 'assets/img/pet-yuanyao-cast.png', frames: 4, fps: 7 },
      height: 0.95,
    },

    ziling: {
      name: '紫灵',
      title: '妙音门',
      robe: '#96436f', robeDark: '#6c2e50', robeLight: '#bb6494',
      inner: '#fbeef5', innerShade: '#e8c8da',
      trim: '#f2cda4', sash: '#cfa87c',
      skin: '#fadcca', skinShade: '#e4b9a0', blush: '#ef9aa2',
      hair: '#241826', hairLight: '#422b43', hairShine: '#6f5270',
      eye: '#c95f9e', eyeLight: '#f2abd2', pupil: '#1c101e', lash: '#180e18',
      accent: '#ffa6ca',
      hairStyle: 'long',
      hasSword: false,
      idle: ['……', '公子安好。', '此间风雅。', '愿闻其详。'],
      greet: ['紫灵在此。', '有礼了。'],
      sprite: { src: 'assets/img/pet-ziling.png', cast: 'assets/img/pet-ziling-cast.png', frames: 4, fps: 7 },
      height: 0.98,
    },
  };

  const RIGHT_ORDER = ['nangongwan', 'yuanyao', 'ziling'];

  /* ==================================================================
   * 2. 技能表
   * ================================================================== */
  const SKILLS = [
    { id: 'sword', key: '1', name: '青元剑诀', lines: ['剑来。', '青元剑气——斩。'], sfx: 'sword', cd: 2800, fx: 'slash' },
    { id: 'array', key: '2', name: '大庚剑阵', lines: ['大庚剑阵，起。', '万剑归宗。'], sfx: 'swordArray', cd: 6200, fx: 'array' },
    { id: 'thunder', key: '3', name: '辟邪神雷', lines: ['辟邪神雷，落。', '天雷竹，助我。'], sfx: 'thunder', cd: 5000, fx: 'thunder' },
    { id: 'light', key: '4', name: '元磁神光', lines: ['元磁神光，护体。', '此光可挡万法。'], sfx: 'barrier', cd: 4200, fx: 'barrier' },
    { id: 'ult', key: '5', name: '化神一击', lines: ['化神一击——退！'], sfx: 'ultimate', cd: 10000, fx: 'ultimate' },
  ];

  /* ==================================================================
   * 3. 3D 数学与透视相机
   * ================================================================== */
  const D2R = Math.PI / 180;

  function rotX(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }
  function vnorm(p) {
    const l = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1;
    return { x: p.x / l, y: p.y / l, z: p.z / l };
  }
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /** 透视相机：位于 (0, height, dist)，俯视原点 */
  function makeCamera() {
    return {
      W: 0, H: 0, focal: 800, cx: 0, cy: 0,
      height: 1.15, dist: 6.8, fov: 52,
      cosA: 1, sinA: 0,

      resize(W, H) {
        this.W = W; this.H = H;
        this.cx = W / 2;
        this.cy = H * 0.54;                       // 视线中心略低于画面中心，给脚下留空间
        this.focal = (H / 2) / Math.tan(this.fov * D2R / 2);
        const a = Math.atan2(this.height, this.dist);
        this.cosA = Math.cos(a);
        this.sinA = Math.sin(a);
      },

      project(p) {
        const x = p.x;
        let y = p.y - this.height;
        let z = p.z - this.dist;
        const y2 = y * this.cosA - z * this.sinA;
        const z2 = y * this.sinA + z * this.cosA;
        const depth = -z2;
        if (depth <= 0.25) return null;
        const f = this.focal / depth;
        return { x: this.cx + x * f, y: this.cy - y2 * f, s: f, d: depth };
      },
    };
  }

  /* ==================================================================
   * 4. 二次元角色绘制（高挑修长）
   * ==================================================================
   * 内部坐标系：原点在脚底，向上为负 y。
   * 全身约 198 单位高，头高约 33 单位 -> 约 6 头身，接近参考立绘的修长感。
   */
  const FH = 198;          // 全身高
  const HEAD_R = 17.2;     // 头半径（略放大，五官更清楚）
  const HEAD_CY = -FH + HEAD_R;
  const NECK_Y = HEAD_CY + HEAD_R * 1.18;
  const SHOULDER_Y = NECK_Y + 7;
  const CHEST_Y = SHOULDER_Y + 26;
  const WAIST_Y = SHOULDER_Y + 52;
  const HIP_Y = WAIST_Y + 13;
  const KNEE_Y = -52;
  /* 肩要够宽、下摆不能太散，否则整个人会变成「圆锥」 */
  const SHOULDER_W = 27;
  const WAIST_W = 17.5;
  const HEM_W = 31;

  function roundRect(g, x, y, w, h, r) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    g.beginPath();
    g.moveTo(x + rr, y);
    g.arcTo(x + w, y, x + w, y + h, rr);
    g.arcTo(x + w, y + h, x, y + h, rr);
    g.arcTo(x, y + h, x, y, rr);
    g.arcTo(x, y, x + w, y, rr);
    g.closePath();
  }

  /** 二次元眼睛 */
  function drawEye(g, side, x, y, ch, st, size) {
    const open = clamp(st.eyeOpen, 0, 1);
    const w = size, h = size * 1.28;

    if (open < 0.13) {
      g.strokeStyle = ch.lash;
      g.lineWidth = 1.7;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(x, y - 0.3, w * 0.86, Math.PI * 1.12, Math.PI * 1.88);
      g.stroke();
      g.beginPath();
      g.moveTo(x + side * w * 0.8, y - 0.9);
      g.lineTo(x + side * w * 1.16, y - 2.2);
      g.stroke();
      return;
    }

    const hh = h * open;
    const gx = st.gazeX * w * 0.26;
    const gy = st.gazeY * h * 0.16;

    g.save();
    g.beginPath();
    g.ellipse(x, y, w, hh, 0, 0, Math.PI * 2);
    g.clip();

    g.fillStyle = '#ffffff';
    g.fillRect(x - w, y - hh, w * 2, hh * 2);

    // 上眼睑阴影
    const sh = g.createLinearGradient(x, y - hh, x, y + hh * 0.3);
    sh.addColorStop(0, 'rgba(110,80,130,.34)');
    sh.addColorStop(1, 'rgba(110,80,130,0)');
    g.fillStyle = sh;
    g.fillRect(x - w, y - hh, w * 2, hh * 1.5);

    // 虹膜（上暗下亮）
    const ir = g.createLinearGradient(x, y - hh * 0.85, x, y + hh * 0.95);
    ir.addColorStop(0, ch.pupil);
    ir.addColorStop(0.42, ch.eye);
    ir.addColorStop(0.78, ch.eyeLight);
    ir.addColorStop(1, ch.eyeLight);
    g.fillStyle = ir;
    g.beginPath();
    g.ellipse(x + gx, y + gy, w * 0.78, hh * 0.92, 0, 0, Math.PI * 2);
    g.fill();

    // 瞳孔
    g.fillStyle = ch.pupil;
    g.beginPath();
    g.ellipse(x + gx, y + gy - hh * 0.06, w * 0.32, hh * 0.46, 0, 0, Math.PI * 2);
    g.fill();

    // 下方反光
    g.fillStyle = ch.eyeLight;
    g.globalAlpha = 0.5;
    g.beginPath();
    g.ellipse(x + gx, y + gy + hh * 0.44, w * 0.48, hh * 0.2, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;

    // 高光
    g.fillStyle = 'rgba(255,255,255,.97)';
    g.beginPath();
    g.ellipse(x + gx - w * 0.36, y + gy - hh * 0.36, w * 0.3, hh * 0.24, -0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.6)';
    g.beginPath();
    g.ellipse(x + gx + w * 0.34, y + gy + hh * 0.32, w * 0.15, hh * 0.11, 0.4, 0, Math.PI * 2);
    g.fill();

    g.restore();

    // 上睫毛
    g.strokeStyle = ch.lash;
    g.lineWidth = 1.9;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(x, y - 0.5, w * 0.99, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
    // 外眼角上挑
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x + side * w * 0.92, y - hh * 0.5);
    g.lineTo(x + side * w * 1.34, y - hh * 0.98);
    g.stroke();
    // 下眼睑
    g.strokeStyle = 'rgba(60,45,60,.4)';
    g.lineWidth = 0.8;
    g.beginPath();
    g.arc(x, y + 0.7, w * 0.88, Math.PI * 0.2, Math.PI * 0.8);
    g.stroke();
  }

  /**
   * 画角色本体
   * @param {CanvasRenderingContext2D} g
   * @param {object} ch 角色
   * @param {object} st 动画状态
   * @param {number} W 画布宽
   * @param {number} H 画布高
   * @param {number} dir 朝向 1=朝右 -1=朝左
   */
  function drawFigure(g, ch, st, W, H, dir) {
    const scale = (H / 218) * (ch.height || 1);

    g.clearRect(0, 0, W, H);
    g.save();
    g.translate(W / 2, H - 5);
    g.scale(scale, scale);

    /* ---------- 地面投影 ---------- */
    g.save();
    g.globalAlpha = 0.24;
    g.fillStyle = '#000';
    g.beginPath();
    g.ellipse(0, 0, HEM_W * 0.72, 5.5, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();

    /* ---------- 姿态 ---------- */
    g.translate(0, st.bob);
    g.scale(dir, 1);
    g.rotate(st.bodyLean * 0.16);

    const breathe = st.breathe;

    /* ---------- 身后长发（垂到腰） ---------- */
    const hairEnd = HIP_Y + 24 + st.hairSway * 3;
    g.save();
    const hairGrad = g.createLinearGradient(0, HEAD_CY, 0, hairEnd);
    hairGrad.addColorStop(0, ch.hair);
    hairGrad.addColorStop(0.5, ch.hairLight);
    hairGrad.addColorStop(1, ch.hair);
    g.fillStyle = hairGrad;

    const sway = st.hairSway;
    g.beginPath();
    g.moveTo(-HEAD_R * 1.02, HEAD_CY + 4);
    g.bezierCurveTo(
      -HEAD_R * 1.7, HEAD_CY + 46,
      -HEAD_R * 1.9 - sway * 5, WAIST_Y + 10,
      -HEAD_R * 1.5 - sway * 8, hairEnd
    );
    g.quadraticCurveTo(-HEAD_R * 0.5, hairEnd + 5, 0, hairEnd + 3);
    g.quadraticCurveTo(HEAD_R * 0.5, hairEnd + 5, HEAD_R * 1.5 + sway * 8, hairEnd);
    g.bezierCurveTo(
      HEAD_R * 1.9 + sway * 5, WAIST_Y + 10,
      HEAD_R * 1.7, HEAD_CY + 46,
      HEAD_R * 1.02, HEAD_CY + 4
    );
    g.closePath();
    g.fill();

    /* 发丝分股暗纹 */
    g.globalAlpha = 0.26;
    g.fillStyle = ch.hair;
    for (let i = -2; i <= 2; i++) {
      g.beginPath();
      g.moveTo(i * 5.5, HEAD_CY + 16);
      g.bezierCurveTo(i * 8 - 2 + sway * 2, WAIST_Y + 6, i * 9 + 2 - sway * 3, hairEnd - 20, i * 8, hairEnd - 2);
      g.bezierCurveTo(i * 6 + 3, hairEnd - 22, i * 5, WAIST_Y + 4, i * 4.4, HEAD_CY + 16);
      g.closePath();
      g.fill();
    }
    g.restore();

    /* ---------- 脚（裙摆下微露） ---------- */
    g.fillStyle = ch.robeDark;
    [-1, 1].forEach((sd) => {
      g.beginPath();
      g.ellipse(sd * 7.5, -3, 7, 3, 0, 0, Math.PI * 2);
      g.fill();
    });

    /* ---------- 下裙（从腰垂到脚，带摆幅） ---------- */
    const hemSway = st.hairSway * 2.6;
    const skirtGrad = g.createLinearGradient(-HEM_W, WAIST_Y, HEM_W, 0);
    skirtGrad.addColorStop(0, ch.robeDark);
    skirtGrad.addColorStop(0.36, ch.robe);
    skirtGrad.addColorStop(0.6, ch.robeLight);
    skirtGrad.addColorStop(1, ch.robeDark);
    g.fillStyle = skirtGrad;
    g.beginPath();
    g.moveTo(-WAIST_W, WAIST_Y - 2);
    g.bezierCurveTo(-WAIST_W * 1.5, WAIST_Y + 34, -HEM_W * 0.94, KNEE_Y, -HEM_W + hemSway, -3);
    g.quadraticCurveTo(0, 3.5, HEM_W + hemSway, -3);
    g.bezierCurveTo(HEM_W * 0.94, KNEE_Y, WAIST_W * 1.5, WAIST_Y + 34, WAIST_W, WAIST_Y - 2);
    g.closePath();
    g.fill();

    /* 裙褶 */
    g.save();
    g.globalAlpha = 0.24;
    g.strokeStyle = ch.robeDark;
    g.lineWidth = 1.4;
    for (let i = -2; i <= 2; i++) {
      g.beginPath();
      g.moveTo(i * 5, WAIST_Y + 6);
      g.quadraticCurveTo(i * 11, WAIST_Y + 44, i * 13 + hemSway, -4);
      g.stroke();
    }
    g.restore();

    /* ---------- 上身外袍 ---------- */
    const torsoGrad = g.createLinearGradient(-SHOULDER_W, SHOULDER_Y, SHOULDER_W, WAIST_Y);
    torsoGrad.addColorStop(0, ch.robeDark);
    torsoGrad.addColorStop(0.3, ch.robeLight);
    torsoGrad.addColorStop(0.62, ch.robe);
    torsoGrad.addColorStop(1, ch.robeDark);
    g.fillStyle = torsoGrad;
    g.beginPath();
    g.moveTo(-SHOULDER_W, SHOULDER_Y + 2);
    g.bezierCurveTo(-SHOULDER_W * 1.12, CHEST_Y, -WAIST_W * 1.22, WAIST_Y - 6, -WAIST_W, WAIST_Y);
    g.lineTo(WAIST_W, WAIST_Y);
    g.bezierCurveTo(WAIST_W * 1.22, WAIST_Y - 6, SHOULDER_W * 1.12, CHEST_Y, SHOULDER_W, SHOULDER_Y + 2);
    g.quadraticCurveTo(0, SHOULDER_Y - 8, -SHOULDER_W, SHOULDER_Y + 2);
    g.closePath();
    g.fill();

    /* ---------- 内衬（交领 V 字） ---------- */
    g.fillStyle = ch.inner;
    g.beginPath();
    g.moveTo(-13.5, SHOULDER_Y + 1);
    g.lineTo(0, SHOULDER_Y + 34);
    g.lineTo(13.5, SHOULDER_Y + 1);
    g.quadraticCurveTo(0, SHOULDER_Y - 7, -13.5, SHOULDER_Y + 1);
    g.closePath();
    g.fill();

    /* 交领滚边 */
    g.strokeStyle = ch.trim;
    g.lineWidth = 2.2;
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(-12, SHOULDER_Y + 3);
    g.lineTo(0, SHOULDER_Y + 31);
    g.lineTo(12, SHOULDER_Y + 3);
    g.stroke();
    /* 内衬阴影 */
    g.fillStyle = ch.innerShade;
    g.globalAlpha = 0.5;
    g.beginPath();
    g.moveTo(3, SHOULDER_Y + 4);
    g.lineTo(0, SHOULDER_Y + 31);
    g.lineTo(12, SHOULDER_Y + 3);
    g.closePath();
    g.fill();
    g.globalAlpha = 1;

    /* ---------- 腰带 + 腰封 ---------- */
    const beltGrad = g.createLinearGradient(0, WAIST_Y - 4, 0, WAIST_Y + 14);
    beltGrad.addColorStop(0, ch.trim);
    beltGrad.addColorStop(0.45, ch.sash);
    beltGrad.addColorStop(1, 'rgba(0,0,0,.42)');
    g.fillStyle = beltGrad;
    roundRect(g, -WAIST_W * 1.06, WAIST_Y - 5, WAIST_W * 2.12, 13, 3);
    g.fill();
    g.globalAlpha = 0.45;
    g.fillStyle = '#fff';
    g.fillRect(-WAIST_W * 1.06, WAIST_Y - 2.4, WAIST_W * 2.12, 1);
    g.globalAlpha = 1;

    /* 腰带垂下的飘带（随动作摆动） */
    g.save();
    g.fillStyle = ch.sash;
    g.globalAlpha = 0.95;
    const tassel = st.hairSway * 3.4;
    g.beginPath();
    g.moveTo(-7, WAIST_Y + 8);
    g.bezierCurveTo(-9 + tassel, WAIST_Y + 34, -6 + tassel * 1.6, HIP_Y + 30, -3 + tassel * 2, HIP_Y + 44);
    g.lineTo(2 + tassel * 2, HIP_Y + 43);
    g.bezierCurveTo(1 + tassel * 1.5, HIP_Y + 28, -1 + tassel, WAIST_Y + 32, -2, WAIST_Y + 8);
    g.closePath();
    g.fill();
    g.restore();

    /* 腰侧玉饰 */
    g.fillStyle = ch.trim;
    g.beginPath(); g.arc(WAIST_W * 0.82, WAIST_Y + 4, 2.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.beginPath(); g.arc(WAIST_W * 0.74, WAIST_Y + 2.8, 0.9, 0, Math.PI * 2); g.fill();

    /* ---------- 手臂 / 广袖 ----------
       关键：袖子画在身体两侧「外侧」，并且用更亮的渐变色 + 描边，
       否则和袍子同色会糊在一起，整个人看起来像圆锥。 */
    function sleeve(side, angle) {
      g.save();
      g.translate(side * (SHOULDER_W - 3), SHOULDER_Y + 6);
      g.rotate(side * angle);

      // 袖子比袍子亮一档，保证能看出是手臂
      const grd = g.createLinearGradient(0, 0, side * 12, 52);
      grd.addColorStop(0, ch.robeLight);
      grd.addColorStop(0.5, ch.robe);
      grd.addColorStop(1, ch.robeDark);
      g.fillStyle = grd;
      /* 广袖：上贴肩、下展开 */
      g.beginPath();
      g.moveTo(-7.5, -2);
      g.bezierCurveTo(side * 10, 10, side * 15.5, 32, side * 13, 54);
      g.quadraticCurveTo(side * 1, 58.5, side * -4, 54);
      g.bezierCurveTo(-2, 32, -5, 12, -7.5, -2);
      g.closePath();
      g.fill();
      // 袖子外缘描边（关键：把手臂从袍子上「拉」出来）
      g.strokeStyle = ch.robeDark;
      g.lineWidth = 1.1;
      g.stroke();

      /* 肩线高光 */
      g.globalAlpha = 0.4;
      g.strokeStyle = '#ffffff';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(-6, 0);
      g.bezierCurveTo(side * 7, 9, side * 11, 22, side * 10, 36);
      g.stroke();
      g.globalAlpha = 1;

      /* 袖口滚边 */
      g.fillStyle = ch.trim;
      g.globalAlpha = 0.85;
      g.beginPath();
      g.moveTo(side * 13, 49.5);
      g.quadraticCurveTo(side * 1, 54.5, side * -3.4, 50);
      g.lineTo(side * -3.8, 55.5);
      g.quadraticCurveTo(side * 1, 60, side * 13.4, 55);
      g.closePath();
      g.fill();
      g.globalAlpha = 1;

      /* 袖内阴影 */
      g.fillStyle = ch.robeDark;
      g.globalAlpha = 0.4;
      g.beginPath();
      g.ellipse(side * 5, 53.5, 6.2, 2.1, 0, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;

      /* 手（比袖口深一点，能看清） */
      g.fillStyle = ch.skin;
      g.beginPath();
      g.ellipse(side * 3.6, 57.5, 3.9, 4.7, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = ch.skinShade;
      g.lineWidth = 0.9;
      g.stroke();

      g.restore();
    }
    sleeve(-1, st.armL);
    sleeve(1, st.armR);

    /* ---------- 背剑（韩立） ---------- */
    if (ch.hasSword) {
      g.save();
      g.translate(0, SHOULDER_Y + 4);
      g.rotate(-0.55);
      g.fillStyle = '#39424f';
      roundRect(g, -2.9, -62, 5.8, 76, 2);
      g.fill();
      g.fillStyle = ch.trim;
      roundRect(g, -4, -64, 8, 6.5, 2);
      g.fill();
      g.fillStyle = '#2a303b';
      roundRect(g, -2, 12, 4, 15, 1.5);
      g.fill();
      g.globalAlpha = 0.38 + st.castGlow * 0.55;
      g.strokeStyle = ch.accent;
      g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(-2.9, -60);
      g.lineTo(-2.9, 10);
      g.stroke();
      g.restore();
    }

    /* ---------- 脖子 ---------- */
    g.fillStyle = ch.skinShade;
    roundRect(g, -4.6, NECK_Y - 5, 9.2, 13, 3.4);
    g.fill();

    /* ---------- 头 ---------- */
    g.save();
    g.translate(0, HEAD_CY);
    g.rotate(st.headTilt * 0.1);

    /* 脸（尖下巴鹅蛋脸） */
    const faceGrad = g.createRadialGradient(-5, -6, 2, 0, 0, HEAD_R * 1.5);
    faceGrad.addColorStop(0, '#fff7f0');
    faceGrad.addColorStop(0.5, ch.skin);
    faceGrad.addColorStop(1, ch.skinShade);
    g.fillStyle = faceGrad;
    const fr = HEAD_R;
    g.beginPath();
    g.moveTo(-fr * 0.92, -fr * 0.2);
    g.bezierCurveTo(-fr * 0.98, fr * 0.34, -fr * 0.62, fr * 0.86, 0, fr * 1.06);
    g.bezierCurveTo(fr * 0.62, fr * 0.86, fr * 0.98, fr * 0.34, fr * 0.92, -fr * 0.2);
    g.bezierCurveTo(fr * 0.9, -fr * 0.84, fr * 0.48, -fr * 1.04, 0, -fr * 1.04);
    g.bezierCurveTo(-fr * 0.48, -fr * 1.04, -fr * 0.9, -fr * 0.84, -fr * 0.92, -fr * 0.2);
    g.closePath();
    g.fill();

    /* 耳 */
    g.fillStyle = ch.skinShade;
    g.beginPath(); g.ellipse(-fr * 0.88, 3, 1.9, 3.2, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(fr * 0.88, 3, 1.9, 3.2, 0, 0, Math.PI * 2); g.fill();

    /* 头顶后发 */
    g.fillStyle = ch.hair;
    g.beginPath();
    g.ellipse(0, -fr * 0.12, fr * 1.0, fr * 1.06, 0, Math.PI, Math.PI * 2);
    g.fill();
    /* 两侧鬓发垂到脸颊下方 */
    [-1, 1].forEach((sd) => {
      g.beginPath();
      g.moveTo(sd * fr * 0.96, -fr * 0.2);
      g.bezierCurveTo(sd * fr * 1.06, fr * 0.4, sd * fr * 0.96, fr * 1.0, sd * fr * 0.62, fr * 1.5);
      g.lineTo(sd * fr * 0.46, fr * 0.5);
      g.bezierCurveTo(sd * fr * 0.62, fr * 0.18, sd * fr * 0.7, -fr * 0.1, sd * fr * 0.72, -fr * 0.2);
      g.closePath();
      g.fill();
    });

    /* 刘海：中分，两侧略长 */
    const fringe = g.createLinearGradient(0, -fr * 1.04, 0, fr * 0.34);
    fringe.addColorStop(0, ch.hairLight);
    fringe.addColorStop(0.42, ch.hair);
    fringe.addColorStop(1, ch.hair);
    g.fillStyle = fringe;
    g.beginPath();
    g.moveTo(-fr * 0.98, -fr * 0.14);
    g.bezierCurveTo(-fr * 1.1, -fr * 1.02, fr * 1.1, -fr * 1.02, fr * 0.98, -fr * 0.14);
    /* 右侧：斜刘海 */
    g.bezierCurveTo(fr * 0.86, -fr * 0.44, fr * 0.6, -fr * 0.28, fr * 0.44, -fr * 0.74);
    g.bezierCurveTo(fr * 0.3, -fr * 0.34, fr * 0.08, -fr * 0.3, -fr * 0.06, -fr * 0.62);
    /* 左侧：较长的一缕 */
    g.bezierCurveTo(-fr * 0.24, -fr * 0.24, -fr * 0.52, -fr * 0.3, -fr * 0.66, -fr * 0.8);
    g.bezierCurveTo(-fr * 0.8, -fr * 0.46, -fr * 0.92, -fr * 0.36, -fr * 0.98, -fr * 0.14);
    g.closePath();
    g.fill();

    /* 头发天使环高光 */
    g.save();
    g.globalAlpha = 0.34;
    g.fillStyle = ch.hairShine;
    g.beginPath();
    g.moveTo(-fr * 0.6, -fr * 0.56);
    g.bezierCurveTo(-fr * 0.16, -fr * 0.92, fr * 0.44, -fr * 0.86, fr * 0.72, -fr * 0.48);
    g.bezierCurveTo(fr * 0.4, -fr * 0.7, -fr * 0.14, -fr * 0.74, -fr * 0.6, -fr * 0.56);
    g.closePath();
    g.fill();
    g.restore();

    /* 双马尾（元瑶） */
    if (ch.hairStyle === 'twin') {
      [-1, 1].forEach((sd) => {
        const sw = st.hairSway * 4 * sd;
        g.fillStyle = ch.hair;
        g.beginPath();
        g.moveTo(sd * fr * 0.9, -fr * 0.5);
        g.bezierCurveTo(sd * fr * 1.9, -fr * 0.2 + sw, sd * fr * 2.1, fr * 1.4 + sw, sd * fr * 1.5, fr * 2.1 + sw * 1.4);
        g.quadraticCurveTo(sd * fr * 0.9, fr * 1.9 + sw, sd * fr * 0.72, fr * 0.9);
        g.bezierCurveTo(sd * fr * 0.86, fr * 0.4, sd * fr * 0.86, -fr * 0.1, sd * fr * 0.9, -fr * 0.5);
        g.closePath();
        g.fill();
        /* 发带 */
        g.fillStyle = ch.trim;
        g.beginPath();
        g.ellipse(sd * fr * 0.98, -fr * 0.42, 3.1, 2.2, sd * 0.3, 0, Math.PI * 2);
        g.fill();
      });
    }

    /* 发饰 */
    if (ch.hairStyle === 'long' && ch.name === '紫灵') {
      /* 紫灵：侧边花饰 */
      g.save();
      g.translate(fr * 0.72, -fr * 0.72);
      g.rotate(-0.45);
      g.fillStyle = ch.accent;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        g.beginPath();
        g.ellipse(Math.cos(a) * 2.9, Math.sin(a) * 2.9, 2.1, 2.1, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#fff8cf';
      g.beginPath(); g.arc(0, 0, 1.5, 0, Math.PI * 2); g.fill();
      g.restore();
    } else if (!ch.hasSword && ch.hairStyle === 'long') {
      /* 南宫婉：发间小珠串 */
      g.fillStyle = ch.accent;
      g.beginPath(); g.arc(-fr * 0.7, -fr * 0.62, 2.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.65)';
      g.beginPath(); g.arc(-fr * 0.76, -fr * 0.7, 1, 0, Math.PI * 2); g.fill();
      /* 垂珠 */
      g.strokeStyle = ch.trim;
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(-fr * 0.7, -fr * 0.56);
      g.quadraticCurveTo(-fr * 0.86, -fr * 0.2, -fr * 0.8, fr * 0.3);
      g.stroke();
      g.fillStyle = ch.trim;
      g.beginPath(); g.arc(-fr * 0.8, fr * 0.34, 1.6, 0, Math.PI * 2); g.fill();
    }

    /* ---------- 五官 ---------- */
    /* 眉眼位置：偏下、放大，桌宠尺寸下也要看得清 */
    const eyeY = fr * 0.26;
    const eyeX = fr * 0.44;
    const eyeSize = fr * 0.245;

    /* 眉 */
    g.strokeStyle = ch.hair;
    g.lineWidth = 1.5;
    g.lineCap = 'round';
    [-1, 1].forEach((sd) => {
      const by = -fr * 0.2 - st.eyeOpen * 0.5;
      g.beginPath();
      g.moveTo(sd * (eyeX + eyeSize * 1.4), by + 0.6);
      g.quadraticCurveTo(sd * eyeX, by - 2.1, sd * (eyeX - eyeSize * 1.2), by + 0.2);
      g.stroke();
    });

    drawEye(g, -1, -eyeX, eyeY, ch, st, eyeSize);
    drawEye(g, 1, eyeX, eyeY, ch, st, eyeSize);

    /* 鼻 */
    g.fillStyle = ch.skinShade;
    g.globalAlpha = 0.6;
    g.beginPath();
    g.ellipse(0.5, fr * 0.66, 0.8, 0.62, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;

    /* 腮红 */
    g.save();
    g.globalAlpha = 0.26 * (1 + st.blush * 0.9);
    const bg2 = g.createRadialGradient(0, fr * 0.52, 1, 0, fr * 0.52, fr * 0.66);
    bg2.addColorStop(0, ch.blush);
    bg2.addColorStop(1, 'rgba(255,150,150,0)');
    g.fillStyle = bg2;
    g.beginPath(); g.ellipse(-fr * 0.66, fr * 0.52, fr * 0.36, fr * 0.21, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(fr * 0.66, fr * 0.52, fr * 0.36, fr * 0.21, 0, 0, Math.PI * 2); g.fill();
    g.restore();

    /* 嘴 */
    const mouth = st.mouth;
    const my = fr * 0.86;
    if (mouth === 'open') {
      g.fillStyle = 'rgba(168,74,84,.62)';
      g.beginPath();
      g.ellipse(0, my, fr * 0.17, fr * 0.14, 0, 0, Math.PI * 2);
      g.fill();
    } else if (mouth === 'smile') {
      g.strokeStyle = 'rgba(158,86,92,.88)';
      g.lineWidth = 1.2;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(0, my - fr * 0.18, fr * 0.21, Math.PI * 0.2, Math.PI * 0.8);
      g.stroke();
    } else {
      g.strokeStyle = 'rgba(158,86,92,.8)';
      g.lineWidth = 1.1;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-fr * 0.11, my);
      g.quadraticCurveTo(0, my + fr * 0.08, fr * 0.11, my);
      g.stroke();
    }

    g.restore(); /* 头 */

    /* ---------- 施法灵光 ---------- */
    if (st.castGlow > 0.01) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      const glow = g.createRadialGradient(0, CHEST_Y, 4, 0, CHEST_Y, 80);
      glow.addColorStop(0, ch.accent);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = st.castGlow * 0.45;
      g.fillStyle = glow;
      g.beginPath();
      g.arc(0, CHEST_Y, 80, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    /* ---------- 环绕灵光 ---------- */
    if (st.motes > 0.01) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 10; i++) {
        const p = (st.t * 0.3 + i / 10) % 1;
        const px = Math.sin(i * 2.3 + st.t * 0.65) * 24;
        const py = -10 - p * 150;
        g.globalAlpha = st.motes * (1 - p) * 0.8;
        g.fillStyle = ch.accent;
        g.beginPath();
        g.arc(px, py, 1.3 + (1 - p) * 0.9, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }

    g.restore();
  }

  /* ==================================================================
   * 5. 精灵图（换图接口）
   * ================================================================== */
  function drawSprite(g, ch, st, W, H, dir) {
    const sp = ch.sprite;
    if (!sp) return false;
    const img = (sp._castImg && st.castGlow > 0.35) ? sp._castImg : sp._img;
    if (!img) return false;

    const frames = sp.frames || 4;
    const fw = img.naturalWidth / frames;
    const fh = img.naturalHeight;
    if (!fw || !fh) return false;

    const fi = Math.floor(st.t * (sp.fps || 7)) % frames;

    g.clearRect(0, 0, W, H);
    g.save();
    // 等比缩放到画布高度
    const scale = (H / fh) * st.breathe * (st.castGlow > 0.35 ? 1.04 : 1);
    g.translate(W / 2, H + st.bob * (H / 218));
    g.scale(dir * scale, scale);
    g.drawImage(img, fi * fw, 0, fw, fh, -fw / 2, -fh, fw, fh);
    if (st.castGlow > 0.01) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = st.castGlow * 0.26;
      g.fillStyle = ch.accent;
      g.beginPath();
      g.arc(0, -fh * 0.5, fw * 0.46, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    return true;
  }

  /* ==================================================================
   * 6. 全屏 3D 技能特效
   * ================================================================== */
  const FX = (function () {
    function create() {
      const canvas = document.getElementById('fxCanvas');
      if (!canvas) return null;
      const g = canvas.getContext('2d');
      const cam = makeCamera();
      let W = 0, H = 0, dpr = 1;
      let raf = null, last = 0, flash = 0, shake = 0, tint = null;

      const parts = [];
      const swords = [];      // 通用飞剑（划击 / 剑雨）
      const formation = [];   // 剑阵编队（整体旋转）
      const bolts = [];
      const rings = [];
      const texts = [];
      const beams = [];
      let circle = null, circle2 = null;

      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * dpr);
        canvas.height = Math.floor(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        cam.resize(W, H);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const on = () => SF.settings.fx !== false;

      /* ---------- 粒子 ---------- */
      function spark(p, opt) {
        opt = opt || {};
        const n = opt.count || 12;
        for (let i = 0; i < n; i++) {
          const a = opt.angle != null ? opt.angle + (Math.random() - 0.5) * (opt.spread || 1.4) : Math.random() * Math.PI * 2;
          const sp = (opt.speed || 1.4) * (0.35 + Math.random());
          const el = opt.elev != null ? opt.elev : (Math.random() - 0.3) * 1.2;
          parts.push({
            p: { x: p.x, y: p.y, z: p.z },
            v: {
              x: Math.cos(a) * Math.cos(el) * sp,
              y: Math.sin(el) * sp + (opt.rise || 0),
              z: Math.sin(a) * Math.cos(el) * sp,
            },
            life: 1,
            decay: opt.decay || 0.012,
            size: (opt.size || 0.03) * (0.6 + Math.random() * 0.9),
            color: opt.color || '#e0a03a',
            grav: opt.grav == null ? -0.008 : opt.grav,
            trail: opt.trail || 0,
          });
        }
      }

      /* ---------- 通用飞剑 ---------- */
      function addSword(o) {
        swords.push({
          p: { x: o.x || 0, y: o.y || 0, z: o.z || 0 },
          to: o.to || null,
          dir: vnorm(o.dir || { x: 0, y: 1, z: 0 }),
          len: o.len || 0.72,
          w: o.w || 0.05,
          life: 1,
          decay: o.decay || 0.006,
          color: o.color || '#bfe9ff',
          edge: o.edge || '#ffffff',
          delay: o.delay || 0,
          mode: o.mode || 'hover',
          spinA: 0,
        });
      }

      /* ---------- 剑阵编队：环形、整体旋转 ---------- */
      function addFormation(ring, count, delayBase) {
        for (let i = 0; i < count; i++) {
          formation.push({
            ring,
            phase: (i / count) * Math.PI * 2 + ring.phase,
            delay: delayBase + i * 0.02,
            flyIn: 0,
            life: 1,
            decay: ring.decay,
            // 飞入起点：同角度、更远更高
            len: ring.len,
            w: ring.w,
            color: i % 3 === 0 ? '#ffffff' : ring.color,
          });
        }
      }

      function addRing(o) {
        rings.push({
          y: o.y || 0,
          r: o.r0 || 0.4,
          grow: o.grow == null ? 0.9 : o.grow,
          max: o.max || 3.6,
          life: 1,
          decay: o.decay || 0.014,
          color: o.color || '#e0a03a',
          width: o.width || 0.045,
          segs: o.segs || 64,
          tilt: o.tilt || 0,
        });
      }

      function addBeam(o) {
        beams.push({
          p: o.p || { x: 0, y: 0, z: 0 },
          r: o.r || 0.3,
          h: o.h || 4,
          life: 1,
          decay: o.decay || 0.014,
          color: o.color || '#9fd8ff',
          grow: o.grow == null ? 0.4 : o.grow,
        });
      }

      function addBolt(from, to, o) {
        o = o || {};
        const a = cam.project(from);
        const b = cam.project(to);
        if (!a || !b) return;
        const segs = [];
        const steps = o.steps || 15;
        const jit = o.jitter || 46;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const j = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * jit;
          segs.push({
            x: a.x + (b.x - a.x) * t + j,
            y: a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 14,
          });
        }
        bolts.push({
          segs, life: 1, decay: o.decay || 0.05,
          color: o.color || '#dff0ff',
          width: Math.max(1.4, (o.width || 3) * (a.s / cam.focal) * 5.5),
        });
      }

      function addText(x, y, text, color, size) {
        texts.push({ x, y, text, color: color || '#ffd98a', size: size || 19, life: 1, decay: 0.009 });
      }

      /* ================================================================
       * 技能
       * ================================================================ */
      const api = {
        resize,
        get enabled() { return on(); },

        centerOf(el) {
          if (!el) return { x: W / 2, y: H / 2 };
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height * 0.4 };
        },

        /* ---------- 1. 青元剑诀 ---------- */
        slash() {
          if (!on()) return;
          const N = isTouch() ? 2 : 3;
          for (let i = 0; i < N; i++) {
            const y0 = 0.8 + i * 0.44;
            const z0 = 1.2 - i * 0.6;
            // 剑气横扫：起点在左外，终点收在画面偏右，全程可见
            addSword({
              x: -3.0, y: y0, z: z0,
              to: { x: 1.25, y: y0 - 0.22, z: z0, dir: { x: 0.97, y: -0.16, z: 0 } },
              dir: { x: 0.97, y: -0.16, z: 0 },
              len: 3.2 - i * 0.3, w: 0.13 - i * 0.02,
              color: i === 0 ? '#ffffff' : '#9fe6ff',
              decay: 0.038, delay: i * 0.07, mode: 'strike',
            });
            // 剑气拖尾（留在画面上，强化「划过去」的感觉）
            for (let k = 0; k < 26; k++) {
              const t = k / 25;
              spark(
                { x: -2.6 + t * 3.6, y: y0 - t * 0.2, z: z0 },
                { count: 1, speed: 0.55, decay: 0.03, size: 0.05, color: '#cfeaff', grav: -0.002, trail: 1 }
              );
            }
          }
          // 三道残留剑气弧，让人看清「斩」的轨迹
          for (let i = 0; i < 3; i++) {
            addRing({
              y: 0.9 + i * 0.42, r0: 0.5, grow: 1.9, max: 3.3,
              color: i === 1 ? '#ffffff' : '#9fe6ff',
              width: 0.05, decay: 0.03, tilt: 0.95,
            });
          }
          addRing({ y: 0.02, r0: 0.3, grow: 3.4, max: 5.2, color: '#9fe6ff', width: 0.032, decay: 0.022 });
          addText(W / 2 + 90, H * 0.3, '青元剑诀', '#bfe9ff', 21);
          flash = Math.max(flash, 0.3);
          shake = Math.max(shake, 8);
        },

        /* ---------- 2. 大庚剑阵（真 3D 环形编队） ---------- */
        swordArray() {
          if (!on()) return;
          const touch = isTouch();

          // 双层地面法阵
          circle = { r: 2.4, life: 1, decay: 0.0034, color: '#8fd3ff', spin: 0, spinSpeed: 0.5, segs: 72 };
          circle2 = { r: 1.72, life: 1, decay: 0.0034, color: '#bfe9ff', spin: 0, spinSpeed: -0.85, segs: 56 };

          // 地面冲击环
          addRing({ y: 0.01, r0: 0.5, grow: 3.6, max: 5.4, color: '#8fd3ff', width: 0.05, decay: 0.016 });
          addRing({ y: 0.01, r0: 0.2, grow: 5.0, max: 6.2, color: '#ffffff', width: 0.02, decay: 0.02 });

          // 中央光柱
          addBeam({ p: { x: 0, y: 0, z: 0 }, r: 0.32, h: 5.2, color: '#a8e2ff', decay: 0.012, grow: 0.55 });

          // 三层环形剑阵：外/中/内，交替反向旋转
          const rings3 = [
            { r: 2.25, y: 0.30, len: 0.78, w: 0.05, tilt: 0.3, phase: 0, dir: 1, decay: 0.0026, color: '#a8e2ff' },
            { r: 1.55, y: 0.98, len: 0.68, w: 0.048, tilt: 0.14, phase: 0.4, dir: -1.35, decay: 0.0026, color: '#bfe9ff' },
            { r: 0.92, y: 1.66, len: 0.58, w: 0.045, tilt: -0.06, phase: 0.85, dir: 1.8, decay: 0.0026, color: '#ffffff' },
          ];
          const counts = touch ? [9, 7, 5] : [14, 10, 7];
          rings3.forEach((ring, i) => addFormation(ring, counts[i], 0.1 + i * 0.12));

          // 阵中灵光
          for (let i = 0; i < (touch ? 26 : 46); i++) {
            const a = Math.random() * Math.PI * 2;
            const rr = 0.5 + Math.random() * 2.3;
            spark(
              { x: Math.cos(a) * rr, y: 0.15 + Math.random() * 2.1, z: Math.sin(a) * rr },
              { count: 1, speed: 0.5, decay: 0.006, size: 0.028, color: '#c7f0ff', grav: 0.008, rise: 0.3 }
            );
          }

          addText(W / 2, H * 0.22, '大庚剑阵', '#bfe9ff', 26);
          flash = Math.max(flash, 0.26);
          shake = Math.max(shake, 8);
        },

        /* ---------- 3. 辟邪神雷 ---------- */
        thunder() {
          if (!on()) return;
          const n = isTouch() ? 4 : 6;
          for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const rr = 0.9 + Math.random() * 2.5;
            const hit = { x: Math.cos(a) * rr, y: 0.02, z: Math.sin(a) * rr };
            addBolt({ x: hit.x * 1.6, y: 8.4, z: hit.z * 1.6 }, hit,
              { jitter: 64, width: 3.2, color: '#dff0ff', decay: 0.055, steps: 17 });
            addBolt({ x: hit.x * 1.6, y: 8.4, z: hit.z * 1.6 },
              { x: hit.x * 0.7, y: 3.6, z: hit.z * 0.7 },
              { jitter: 92, width: 1.4, color: '#8fb8ff', decay: 0.045, steps: 11 });
            addRing({ y: 0.02, r0: 0.15, grow: 2.8, max: 3.2, color: '#9fc4ff', width: 0.03, decay: 0.028 });
            for (let k = 0; k < 18; k++) {
              spark(hit, { count: 1, speed: 2.2, decay: 0.018, size: 0.038, color: '#cfe4ff', elev: 0.5, spread: 1.6 });
            }
          }
          flash = Math.max(flash, 0.72);
          shake = Math.max(shake, 15);
          tint = { c: '180,205,255', a: 0.5, t: 1 };
          addText(W / 2, H * 0.19, '辟邪神雷', '#dff0ff', 23);
        },

        /* ---------- 4. 元磁神光 ---------- */
        barrier() {
          if (!on()) return;
          const touch = isTouch();
          const orients = [{ tilt: 0 }, { tilt: 1.05 }, { tilt: 2.1 }];
          orients.forEach((o, i) => {
            const n = touch ? 22 : 36;
            for (let k = 0; k < n; k++) {
              const a = (k / n) * Math.PI * 2;
              let p = { x: Math.cos(a) * 1.6, y: 0, z: Math.sin(a) * 1.6 };
              p = rotX(p, o.tilt);
              spark(
                { x: p.x, y: p.y + 1.0, z: p.z },
                { count: 1, speed: 0.18, decay: 0.0045, size: 0.028, color: i % 2 ? '#ffd98a' : '#8fd3ff', grav: 0, angle: a + Math.PI / 2, spread: 0.5 }
              );
            }
            addRing({ y: 1.0, r0: 1.55, grow: 0.1, max: 1.68, color: i % 2 ? '#ffd98a' : '#8fd3ff', width: 0.024, decay: 0.005, tilt: o.tilt });
          });
          addRing({ y: 0.02, r0: 0.6, grow: 1.8, max: 3.0, color: '#9fdcff', width: 0.03, decay: 0.01 });
          for (let i = 0; i < (touch ? 20 : 34); i++) {
            const a = Math.random() * Math.PI * 2;
            const rr = 1.2 + Math.random() * 0.5;
            spark({ x: Math.cos(a) * rr, y: 0.3 + Math.random() * 1.6, z: Math.sin(a) * rr },
              { count: 1, speed: 0.3, decay: 0.005, size: 0.026, color: '#ffe9b0', grav: 0.008, rise: 0.2 });
          }
          addText(W / 2, H * 0.21, '元磁神光', '#ffe9b0', 22);
          flash = Math.max(flash, 0.2);
        },

        /* ---------- 5. 化神一击 ---------- */
        ultimate() {
          if (!on()) return;
          const touch = isTouch();

          circle = { r: 3.0, life: 1, decay: 0.0028, color: '#ffd98a', spin: 0, spinSpeed: -0.8, segs: 80 };
          circle2 = { r: 2.1, life: 1, decay: 0.0028, color: '#ffe6a8', spin: 0, spinSpeed: 1.2, segs: 64 };
          addBeam({ p: { x: 0, y: 0, z: 0 }, r: 0.62, h: 8, color: '#ffe6a8', decay: 0.008, grow: 1.1 });

          for (let i = 0; i < 4; i++) {
            addRing({ y: 0.02 + i * 0.015, r0: 0.4, grow: 4.8 - i * 0.7, max: 7.6,
              color: i % 2 ? '#ffe6a8' : '#8fd3ff', width: 0.06 - i * 0.011, decay: 0.011 });
          }

          // 剑雨
          const n = touch ? 16 : 30;
          for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const rr = 0.4 + Math.random() * 2.9;
            const tx = Math.cos(a) * rr, tz = Math.sin(a) * rr;
            addSword({
              x: tx * 1.5, y: 8.2, z: tz * 1.5,
              to: { x: tx, y: 0.05, z: tz, dir: { x: 0, y: -1, z: 0 } },
              dir: { x: 0, y: -1, z: 0 },
              len: 0.9, w: 0.055, color: '#ffeec2',
              decay: 0.011, delay: Math.random() * 0.3, mode: 'strike',
            });
          }

          // 外扩剑气
          const arcs = touch ? 7 : 12;
          for (let i = 0; i < arcs; i++) {
            const a = (i / arcs) * Math.PI * 2 + Math.random() * 0.2;
            addSword({
              x: 0, y: 1.0, z: 0,
              to: { x: Math.cos(a) * 4.4, y: 0.95, z: Math.sin(a) * 4.4, dir: vnorm({ x: Math.cos(a), y: 0.05, z: Math.sin(a) }) },
              dir: vnorm({ x: Math.cos(a), y: 0.06, z: Math.sin(a) }),
              len: 2.9, w: 0.1,
              color: i % 3 === 0 ? '#ffffff' : '#ffd98a',
              decay: 0.013, delay: 0.05 + Math.random() * 0.12, mode: 'strike',
            });
          }

          for (let i = 0; i < (touch ? 34 : 70); i++) {
            const a = Math.random() * Math.PI * 2;
            const rr = Math.random() * 2.6;
            spark({ x: Math.cos(a) * rr, y: 0.1 + Math.random(), z: Math.sin(a) * rr },
              { count: 1, speed: 3.0, decay: 0.008, size: 0.045, color: '#ffe9b0', grav: -0.004, elev: 0.7 });
          }

          addText(W / 2, H * 0.18, '化神一击', '#ffd98a', 32);
          flash = Math.max(flash, 0.95);
          shake = Math.max(shake, 24);
          tint = { c: '255,230,170', a: 0.42, t: 1 };
        },

        ping() {
          if (!on()) return;
          addRing({ y: 0.02, r0: 0.2, grow: 1.8, max: 1.8, color: '#e0a03a', width: 0.03, decay: 0.04 });
          for (let i = 0; i < 12; i++) {
            spark({ x: 0, y: 0.1, z: 0 }, { count: 1, speed: 0.9, decay: 0.024, size: 0.026, color: '#ffe9b0', grav: 0.008, rise: 0.4 });
          }
        },

        /* ================================================================
         * 每帧
         * ================================================================ */
        frame(now) {
          raf = null;
          if (!last) last = now;
          const dt = Math.min(48, now - last) / 16.667;
          const dts = dt / 60;
          last = now;
          const T = now / 1000;

          g.setTransform(dpr, 0, 0, dpr, 0, 0);
          g.clearRect(0, 0, W, H);

          if (flash > 0.01) {
            g.save();
            g.globalCompositeOperation = 'lighter';
            g.fillStyle = 'rgba(205,228,255,' + (flash * 0.32).toFixed(3) + ')';
            g.fillRect(0, 0, W, H);
            g.restore();
            flash *= Math.pow(0.86, dt);
          } else flash = 0;

          if (tint) {
            g.save();
            g.globalCompositeOperation = 'lighter';
            g.fillStyle = 'rgba(' + tint.c + ',' + (tint.a * tint.t * 0.28).toFixed(3) + ')';
            g.fillRect(0, 0, W, H);
            g.restore();
            tint.t -= 0.016 * dt;
            if (tint.t <= 0) tint = null;
          }

          let ox = 0, oy = 0;
          if (shake > 0.2) {
            ox = (Math.random() - 0.5) * shake;
            oy = (Math.random() - 0.5) * shake;
            shake *= Math.pow(0.9, dt);
          } else shake = 0;

          g.save();
          g.translate(ox, oy);

          const draws = [];

          /* 法阵 */
          [circle, circle2].forEach((c) => {
            if (!c) return;
            c.life -= c.decay * dt;
            c.spin += c.spinSpeed * dts;
            const o = cam.project({ x: 0, y: 0, z: 0 });
            if (o) draws.push({ d: o.d + 6, kind: 'circle', o: c });
          });
          if (circle && circle.life <= 0) circle = null;
          if (circle2 && circle2.life <= 0) circle2 = null;

          /* 光柱 */
          for (let i = beams.length - 1; i >= 0; i--) {
            const b = beams[i];
            b.life -= b.decay * dt;
            b.r += b.grow * 0.005 * dt;
            if (b.life <= 0) { beams.splice(i, 1); continue; }
            const bot = cam.project({ x: b.p.x, y: b.p.y, z: b.p.z });
            const top = cam.project({ x: b.p.x, y: b.p.y + b.h, z: b.p.z });
            if (bot && top) draws.push({ d: bot.d, kind: 'beam', o: b, bot, top });
          }

          /* 光环 */
          for (let i = rings.length - 1; i >= 0; i--) {
            const r = rings[i];
            r.r += r.grow * 0.013 * dt;
            r.life -= r.decay * dt;
            if (r.life <= 0 || r.r > r.max) { rings.splice(i, 1); continue; }
            const c0 = cam.project({ x: 0, y: r.y, z: 0 });
            if (c0) draws.push({ d: c0.d, kind: 'ring', o: r });
          }

          /* 剑阵编队：位置由角度直接算出 -> 整体稳定旋转 */
          for (let i = formation.length - 1; i >= 0; i--) {
            const s = formation[i];
          // 正在飞入的剑不衰减，保证阵型完整成型后才开始消散
          if (s.delay > 0) { s.delay -= dts; continue; }
          s.flyIn = Math.min(1, s.flyIn + dts * 0.95);
          if (s.flyIn >= 1) s.life -= s.decay * dt;
          if (s.life <= 0) { formation.splice(i, 1); continue; }

            const ring = s.ring;
            const ang = s.phase + T * ring.dir * 0.5;
            const bobY = Math.sin(T * 1.7 + s.phase * 2.2) * 0.05;

            const target = {
              x: Math.cos(ang) * ring.r,
              y: ring.y + bobY,
              z: Math.sin(ang) * ring.r,
            };
            // 飞入起点
            const start = {
              x: Math.cos(ang) * ring.r * 5.2,
              y: ring.y + 4.2,
              z: Math.sin(ang) * ring.r * 5.2,
            };
            const e = easeOut(s.flyIn);
            const pos = lerp(start, target, e);
            const dirV = vnorm({ x: Math.cos(ang) * ring.tilt, y: 1, z: Math.sin(ang) * ring.tilt });

            const base = cam.project(pos);
            const tip = cam.project({
              x: pos.x + dirV.x * s.len,
              y: pos.y + dirV.y * s.len,
              z: pos.z + dirV.z * s.len,
            });
            if (base && tip) {
              draws.push({
                d: base.d, kind: 'sword', base, tip,
                o: { life: s.life, color: s.color, w: s.w, blade: e < 1 ? 1 + (1 - e) * 2.2 : 1 },
              });
            }
          }

          /* 通用飞剑 */
          for (let i = swords.length - 1; i >= 0; i--) {
            const s = swords[i];
            if (s.delay > 0) { s.delay -= dts; continue; }

            if (s.to) {
              const ease = (s.mode === 'strike' ? 0.16 : 0.1) * dt;
              s.p.x += (s.to.x - s.p.x) * ease;
              s.p.y += (s.to.y - s.p.y) * ease;
              s.p.z += (s.to.z - s.p.z) * ease;
              if (s.to.dir) {
                s.dir.x += (s.to.dir.x - s.dir.x) * ease * 1.5;
                s.dir.y += (s.to.dir.y - s.dir.y) * ease * 1.5;
                s.dir.z += (s.to.dir.z - s.dir.z) * ease * 1.5;
                s.dir = vnorm(s.dir);
              }
            }
            s.life -= s.decay * dt;
            if (s.life <= 0) { swords.splice(i, 1); continue; }

            const base = cam.project(s.p);
            const tip = cam.project({
              x: s.p.x + s.dir.x * s.len,
              y: s.p.y + s.dir.y * s.len,
              z: s.p.z + s.dir.z * s.len,
            });
            if (base && tip) draws.push({ d: base.d, kind: 'sword', base, tip, o: s });
          }

          /* 粒子 */
          for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.p.x += p.v.x * dt * 0.55;
            p.p.y += p.v.y * dt * 0.55;
            p.p.z += p.v.z * dt * 0.55;
            p.v.y += p.grav * dt;
            p.v.x *= Math.pow(0.98, dt);
            p.v.z *= Math.pow(0.98, dt);
            p.life -= p.decay * dt;
            if (p.life <= 0) { parts.splice(i, 1); continue; }
            const pr = cam.project(p.p);
            if (pr) draws.push({ d: pr.d, kind: 'spark', o: p, pr });
          }

          draws.sort((a, b) => b.d - a.d);

          g.globalCompositeOperation = 'lighter';
          g.lineCap = 'round';
          g.lineJoin = 'round';
          draws.forEach((it) => {
            if (it.kind === 'circle') drawCircle(it.o);
            else if (it.kind === 'ring') drawRing(it.o);
            else if (it.kind === 'beam') drawBeam(it);
            else if (it.kind === 'sword') drawSword(it);
            else if (it.kind === 'spark') drawSpark(it);
          });

          /* 闪电 */
          for (let i = bolts.length - 1; i >= 0; i--) {
            const b = bolts[i];
            b.life -= b.decay * dt;
            if (b.life <= 0) { bolts.splice(i, 1); continue; }
            const a = clamp(b.life, 0, 1);
            g.shadowColor = b.color;
            g.shadowBlur = 20;
            g.globalAlpha = a * 0.3;
            g.strokeStyle = b.color;
            g.lineWidth = b.width * 2.4 * a;
            g.beginPath();
            b.segs.forEach((p, k) => (k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
            g.stroke();
            g.globalAlpha = a;
            g.strokeStyle = '#ffffff';
            g.lineWidth = b.width * a;
            g.beginPath();
            b.segs.forEach((p, k) => (k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
            g.stroke();
            g.shadowBlur = 0;
          }
          g.globalAlpha = 1;
          g.globalCompositeOperation = 'source-over';

          /* 飘字 */
          for (let i = texts.length - 1; i >= 0; i--) {
            const t = texts[i];
            t.y -= 0.4 * dt;
            t.life -= t.decay * dt;
            if (t.life <= 0) { texts.splice(i, 1); continue; }
            g.save();
            g.globalAlpha = clamp(t.life, 0, 1) * 0.95;
            g.font = '700 ' + t.size + 'px "Microsoft YaHei", "Segoe UI", sans-serif';
            g.textAlign = 'center';
            g.shadowColor = t.color;
            g.shadowBlur = 26;
            g.fillStyle = t.color;
            g.fillText(t.text, t.x, t.y);
            g.restore();
          }

          g.restore();

          if (parts.length || swords.length || formation.length || bolts.length ||
              rings.length || texts.length || beams.length || circle || circle2 ||
              flash > 0.01 || tint) {
            api.loop();
          } else {
            last = 0;
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, W, H);
          }
        },

        loop() { if (raf == null) raf = requestAnimationFrame(api.frame); },

        /** 供调试/自检：当前各类特效对象数量与相机参数 */
        debug() {
          return {
            parts: parts.length, swords: swords.length, formation: formation.length,
            bolts: bolts.length, rings: rings.length, beams: beams.length,
            texts: texts.length, circle: !!circle, circle2: !!circle2,
            flash: +flash.toFixed(3), cam: { W: W, H: H, focal: Math.round(cam.focal), dist: cam.dist },
            formationSample: formation.slice(0, 3).map((s) => ({
              ring: s.ring.r, delay: +s.delay.toFixed(3), flyIn: +s.flyIn.toFixed(3), life: +s.life.toFixed(3),
            })),
          };
        },

        clear() {
          parts.length = 0; swords.length = 0; formation.length = 0;
          bolts.length = 0; rings.length = 0; texts.length = 0; beams.length = 0;
          circle = null; circle2 = null;
          flash = 0; shake = 0; tint = null; last = 0;
          g.setTransform(dpr, 0, 0, dpr, 0, 0);
          g.clearRect(0, 0, W, H);
        },
      };

      /* ---------- 图元 ---------- */
      function drawCircle(c) {
        const a = clamp(c.life, 0, 1);
        const segs = c.segs;
        g.save();
        g.globalAlpha = a * 0.85;
        g.strokeStyle = c.color;
        g.shadowColor = c.color;
        g.shadowBlur = 16;
        g.lineWidth = 2.6;
        ellipsePath(c.r, 0, segs);
        g.stroke();
        g.globalAlpha = a * 0.55;
        g.lineWidth = 1.4;
        ellipsePath(c.r * 0.74, 0.5, segs);
        g.stroke();
        // 辐条
        g.globalAlpha = a * 0.4;
        g.lineWidth = 1.1;
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + c.spin;
          const p1 = cam.project({ x: Math.cos(ang) * c.r * 0.76, y: 0, z: Math.sin(ang) * c.r * 0.76 });
          const p2 = cam.project({ x: Math.cos(ang) * c.r, y: 0, z: Math.sin(ang) * c.r });
          if (!p1 || !p2) continue;
          g.beginPath(); g.moveTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.stroke();
        }
        // 符文弧
        g.globalAlpha = a * 0.7;
        g.lineWidth = 2.2;
        for (let i = 0; i < 6; i++) {
          const a0 = (i / 6) * Math.PI * 2 - c.spin * 1.3;
          arcPath(c.r * 0.88, 0, a0, a0 + 0.5, 10);
          g.stroke();
        }
        g.shadowBlur = 0;
        g.restore();
      }

      function ellipsePath(r, y, segs) {
        g.beginPath();
        let started = false;
        for (let i = 0; i <= segs; i++) {
          const ang = (i / segs) * Math.PI * 2;
          const p = cam.project({ x: Math.cos(ang) * r, y: y, z: Math.sin(ang) * r });
          if (!p) { started = false; continue; }
          if (!started) { g.moveTo(p.x, p.y); started = true; }
          else g.lineTo(p.x, p.y);
        }
      }

      function arcPath(r, y, a0, a1, steps) {
        g.beginPath();
        let started = false;
        for (let i = 0; i <= steps; i++) {
          const ang = a0 + (a1 - a0) * (i / steps);
          const p = cam.project({ x: Math.cos(ang) * r, y: y, z: Math.sin(ang) * r });
          if (!p) { started = false; continue; }
          if (!started) { g.moveTo(p.x, p.y); started = true; }
          else g.lineTo(p.x, p.y);
        }
      }

      function drawRing(r) {
        const a = clamp(r.life, 0, 1);
        g.save();
        g.globalAlpha = a * 0.88;
        g.strokeStyle = r.color;
        g.shadowColor = r.color;
        g.shadowBlur = 18;
        g.lineWidth = Math.max(1, r.width * cam.focal * 0.26);
        g.beginPath();
        let started = false;
        for (let i = 0; i <= r.segs; i++) {
          const ang = (i / r.segs) * Math.PI * 2;
          let p = { x: Math.cos(ang) * r.r, y: 0, z: Math.sin(ang) * r.r };
          if (r.tilt) p = rotX(p, r.tilt);
          const pr = cam.project({ x: p.x, y: p.y + r.y, z: p.z });
          if (!pr) { started = false; continue; }
          if (!started) { g.moveTo(pr.x, pr.y); started = true; }
          else g.lineTo(pr.x, pr.y);
        }
        g.stroke();
        g.shadowBlur = 0;
        g.restore();
      }

      function drawBeam(it) {
        const b = it.o;
        const a = clamp(b.life, 0, 1);
        const halfW = b.r * it.bot.s;
        const grd = g.createLinearGradient(it.bot.x, it.bot.y, it.top.x, it.top.y);
        grd.addColorStop(0, b.color);
        grd.addColorStop(0.55, b.color);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.save();
        g.globalAlpha = a * 0.4;
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(it.bot.x - halfW, it.bot.y);
        g.lineTo(it.top.x - halfW * 0.32, it.top.y);
        g.lineTo(it.top.x + halfW * 0.32, it.top.y);
        g.lineTo(it.bot.x + halfW, it.bot.y);
        g.closePath();
        g.fill();
        g.globalAlpha = a * 0.78;
        g.strokeStyle = '#ffffff';
        g.lineWidth = 2;
        g.shadowColor = b.color;
        g.shadowBlur = 18;
        g.beginPath();
        g.moveTo(it.bot.x, it.bot.y);
        g.lineTo(it.top.x, it.top.y);
        g.stroke();
        g.restore();
      }

      function drawSword(it) {
        const s = it.o;
        const a = clamp(s.life, 0, 1);
        const bx = it.base.x, by = it.base.y;
        const tx = it.tip.x, ty = it.tip.y;
        const dx = tx - bx, dy = ty - by;
        const len = Math.hypot(dx, dy);
        if (len < 1.5) return;

        const nx = -dy / len, ny = dx / len;
        const hw = Math.max(1.1, s.w * it.base.s * (s.blade || 1));
        const hwTip = hw * 0.1;
        const hx = bx - dx / len * hw * 2.4;
        const hy = by - dy / len * hw * 2.4;

        g.save();
        g.globalAlpha = a;
        g.shadowColor = s.color;
        g.shadowBlur = 15;

        const grd = g.createLinearGradient(bx, by, tx, ty);
        grd.addColorStop(0, s.color);
        grd.addColorStop(0.5, s.edge || '#ffffff');
        grd.addColorStop(1, '#ffffff');
        g.fillStyle = grd;
        g.beginPath();
        g.moveTo(bx + nx * hw, by + ny * hw);
        g.lineTo(tx + nx * hwTip, ty + ny * hwTip);
        g.lineTo(tx - nx * hwTip, ty - ny * hwTip);
        g.lineTo(bx - nx * hw, by - ny * hw);
        g.closePath();
        g.fill();

        // 剑脊
        g.globalAlpha = a * 0.7;
        g.strokeStyle = '#ffffff';
        g.lineWidth = Math.max(0.7, hw * 0.45);
        g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke();

        // 护手
        g.globalAlpha = a * 0.9;
        g.fillStyle = '#ffd98a';
        g.beginPath();
        g.moveTo(bx + nx * hw * 1.8, by + ny * hw * 1.8);
        g.lineTo(bx - nx * hw * 1.8, by - ny * hw * 1.8);
        g.lineTo(hx - nx * hw * 1.1, hy - ny * hw * 1.1);
        g.lineTo(hx + nx * hw * 1.1, hy + ny * hw * 1.1);
        g.closePath();
        g.fill();

        // 剑柄
        g.globalAlpha = a * 0.65;
        g.strokeStyle = '#8a6a2e';
        g.lineWidth = Math.max(0.9, hw * 0.85);
        g.beginPath(); g.moveTo(bx, by); g.lineTo(hx, hy); g.stroke();

        g.restore();
      }

      function drawSpark(it) {
        const p = it.o;
        const pr = it.pr;
        const a = clamp(p.life, 0, 1);
        const r = Math.max(0.55, p.size * pr.s);
        g.save();
        if (p.trail) {
          const sp = Math.sqrt(p.v.x * p.v.x + p.v.y * p.v.y + p.v.z * p.v.z);
          const tl = Math.min(sp * 0.09, 0.45);
          const back = cam.project({ x: p.p.x - p.v.x * tl, y: p.p.y - p.v.y * tl, z: p.p.z - p.v.z * tl });
          if (back) {
            g.globalAlpha = a * 0.4;
            g.strokeStyle = p.color;
            g.lineWidth = r * 0.8;
            g.beginPath(); g.moveTo(back.x, back.y); g.lineTo(pr.x, pr.y); g.stroke();
          }
        }
        g.globalAlpha = a;
        g.fillStyle = p.color;
        g.beginPath(); g.arc(pr.x, pr.y, r, 0, Math.PI * 2); g.fill();
        g.restore();
      }

      resize();
      window.addEventListener('resize', resize);
      return api;
    }
    return { create };
  })();

  /* ==================================================================
   * 7. 桌宠实例
   * ================================================================== */
  function createPet(opts) {
    const canvas = document.getElementById(opts.canvasId);
    const bubble = document.getElementById(opts.bubbleId);
    const label = document.getElementById(opts.labelId);
    if (!canvas) return null;

    const g = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 160, H = 260;

    function fit() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(80, Math.round(r.width || 160));
      H = Math.round(W * 1.62);        // 高挑比例的画布
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.height = H + 'px';
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const st = {
      bob: 0, breathe: 1, eyeOpen: 1, headTilt: 0, hairSway: 0,
      armL: 0.16, armR: 0.16, gazeX: 0, gazeY: 0, mouth: 'flat',
      blush: 0, castGlow: 0, bodyLean: 0, motes: 0.4, t: 0,
    };

    const self = {
      side: opts.side,
      canvas, bubble, label,
      key: opts.charKey,
      ch: CHARS[opts.charKey],

      t: Math.random() * 100,
      blink: 0,
      nextBlink: 1.2 + Math.random() * 3,
      gazeTimer: 1 + Math.random() * 2,
      action: 'idle',
      actionT: 0,
      nextAction: 2.4 + Math.random() * 3.5,
      lean: 0, leanTarget: 0, bobY: 0, hop: 0, armLift: 0,
      casting: false, _gx: 0, _gy: 0,

      fit,
      get el() { return canvas.parentElement; },

      setChar(key) {
        if (!CHARS[key]) return;
        self.key = key;
        self.ch = CHARS[key];
        if (label) label.textContent = CHARS[key].name;
        st.blush = 0.2;
        probeSprite(CHARS[key]);
      },

      say(text, isSkill, ms) {
        if (!bubble) return;
        bubble.textContent = text;
        bubble.classList.toggle('is-skill', !!isSkill);
        bubble.classList.add('is-on');
        clearTimeout(self.bubbleTimer);
        self.bubbleTimer = setTimeout(() => bubble.classList.remove('is-on'), ms || 2200);
      },

      startAction(name) { self.action = name; self.actionT = 0; },

      frame(dt, now) {
        self.t += dt;
        st.t = self.t;
        const t = self.t;

        st.breathe = 1 + Math.sin(t * 1.5) * 0.018;
        st.bob = Math.sin(t * 1.5 + 0.4) * 1.9 + self.bobY;
        // 头发：三个频率叠加，避免机械感
        st.hairSway = Math.sin(t * 1.07) * 0.55 + Math.sin(t * 2.31) * 0.22 + Math.sin(t * 0.41) * 0.16;

        self.nextBlink -= dt;
        if (self.nextBlink <= 0) {
          self.blink = 0.18;
          self.nextBlink = 2.2 + Math.random() * 4.4;
        }
        if (self.blink > 0) {
          self.blink -= dt;
          const p = 1 - Math.abs(self.blink / 0.18 - 0.5) * 2;
          st.eyeOpen = clamp(1 - p, 0, 1);
        } else st.eyeOpen = 1;

        self.gazeTimer -= dt;
        if (self.gazeTimer <= 0) {
          self.gazeTimer = 1.5 + Math.random() * 3.2;
          self._gx = (Math.random() - 0.5) * 2;
          self._gy = (Math.random() - 0.5) * 1.2;
        }
        st.gazeX += (self._gx - st.gazeX) * 0.06;
        st.gazeY += (self._gy - st.gazeY) * 0.06;
        st.headTilt += (st.gazeX * 0.9 - st.headTilt) * 0.045;

        self.actionT += dt;
        switch (self.action) {
          case 'idle':
            self.leanTarget = 0;
            self.armLift += (0 - self.armLift) * 0.07;
            st.mouth = 'flat';
            self.nextAction -= dt;
            if (self.nextAction <= 0) {
              const pool = ['look', 'stretch', 'hop', 'mutter', 'sway', 'fixHair', 'adjustSleeve', 'lookAround'];
              if (opts.side === 'right' && SF.settings.petLean !== false) pool.push('lean', 'lean');
              self.startAction(pool[Math.floor(Math.random() * pool.length)]);
              self.nextAction = 4.5 + Math.random() * 7;
            }
            break;

          case 'look':
            st.gazeX += (0.6 - st.gazeX) * 0.05;
            if (self.actionT > 1.6) { self.action = 'idle'; self.actionT = 0; }
            break;

          case 'lookAround':
            st.gazeX = Math.sin(self.actionT * 1.9) * 0.9;
            st.headTilt = st.gazeX * 1.2;
            if (self.actionT > 2.2) { self.action = 'idle'; self.actionT = 0; }
            break;

          case 'stretch':
            self.armLift += (1 - self.armLift) * 0.12;
            if (self.actionT > 1.35) { self.action = 'idle'; self.actionT = 0; }
            break;

          case 'fixHair':
            self.armLift += (0.85 - self.armLift) * 0.1;
            st.headTilt = -0.45;
            if (self.actionT > 0.5 && !self._s4) { self._s4 = true; self.maybeSay(self.ch.idle, 0.5); }
            if (self.actionT > 1.9) { self.action = 'idle'; self.actionT = 0; self._s4 = false; st.headTilt = 0; }
            break;

          case 'adjustSleeve':
            self.armLift += (0.55 - self.armLift) * 0.1;
            st.bodyLean = Math.sin(self.actionT * 3.1) * 0.13;
            if (self.actionT > 1.7) { self.action = 'idle'; self.actionT = 0; st.bodyLean = 0; }
            break;

          case 'hop':
            if (self.actionT < 0.6) self.hop = Math.sin((self.actionT / 0.6) * Math.PI) * 9;
            else { self.hop = 0; self.action = 'idle'; self.actionT = 0; }
            break;

          case 'mutter':
            if (self.actionT > 0.25 && st.mouth !== 'open') {
              st.mouth = 'open';
              self.maybeSay(self.ch.idle, 0.5);
            }
            if (self.actionT > 2.2) { self.action = 'idle'; self.actionT = 0; st.mouth = 'flat'; }
            break;

          case 'sway':
            st.bodyLean = Math.sin(self.actionT * 2.1) * 0.3;
            if (self.actionT > 1.8) { self.action = 'idle'; self.actionT = 0; st.bodyLean = 0; }
            break;

          case 'lean':
            self.leanTarget = opts.side === 'right' ? -1 : 1;
            if (self.actionT > 1.1 && !self._leaned) {
              self._leaned = true;
              self.maybeSay(self.ch.idle, 0.75);
            }
            if (self.actionT > 4.3) {
              self._leaned = false; self.leanTarget = 0;
              self.action = 'idle'; self.actionT = 0;
            }
            break;

          default:
            self.action = 'idle';
        }

        if (self.casting) st.armLift = 1;

        const leanPx = (opts.side === 'right' ? -1 : 1) * 26;
        self.lean += (self.leanTarget * leanPx - self.lean) * 0.075;
        self.bobY += (self.hop - self.bobY) * 0.22;

        const base = self.ch.armRest === undefined ? 0.16 : self.ch.armRest;
        st.armL = base + self.armLift * 0.8 + Math.sin(t * 1.3) * 0.05;
        st.armR = base + self.armLift * 0.8 + Math.sin(t * 1.3 + 0.7) * 0.05;

        st.castGlow *= Math.pow(0.94, dt * 1.6);
        st.motes = 0.3 + Math.sin(t * 0.8) * 0.16 + st.castGlow * 0.8;
        st.blush *= Math.pow(0.99, dt);

        const scale = self.casting ? 1.035 : 1;
        canvas.style.transform = 'translateX(' + self.lean.toFixed(2) + 'px) scale(' + scale + ')';

        const dir = opts.side === 'right' ? -1 : 1;
        if (!drawSprite(g, self.ch, st, W, H, dir)) {
          drawFigure(g, self.ch, st, W, H, dir);
        }
      },

      maybeSay(pool, chance) {
        if (!pool || !pool.length) return;
        if (Math.random() > chance) return;
        self.say(pool[Math.floor(Math.random() * pool.length)]);
      },

      cast(skillName, line) {
        self.casting = true;
        self.startAction('cast');
        st.castGlow = 1;
        st.blush = 0.65;
        self.say(line || skillName, true, 1900);
        clearTimeout(self._castT);
        self._castT = setTimeout(() => { self.casting = false; }, 950);
      },
    };

    const origFrame = self.frame;
    self.frame = function (dt, now) {
      if (self.action === 'cast') {
        if (self.actionT > 0.95) { self.action = 'idle'; self.actionT = 0; }
        self.armLift += (1 - self.armLift) * 0.14;
        self.leanTarget = opts.side === 'right' ? -0.5 : 0.5;
        const saved = self.action;
        self.action = '__hold';
        origFrame(dt, now);
        self.action = saved;
        return;
      }
      origFrame(dt, now);
    };

    self.setChar(opts.charKey);
    fit();
    window.addEventListener('resize', fit);
    return self;
  }

  /* ------------------------------------------------------------------
   * 换图接口
   * ------------------------------------------------------------------ */
  function probeSprite(ch) {
    if (!ch.sprite || ch.sprite._probed) return;
    ch.sprite._probed = true;
    if (ch.sprite.src) {
      const img = new Image();
      img.onload = () => { ch.sprite._img = img; };
      img.onerror = () => { ch.sprite._img = null; };
      img.src = ch.sprite.src;
    }
    if (ch.sprite.cast) {
      const img2 = new Image();
      img2.onload = () => { ch.sprite._castImg = img2; };
      img2.onerror = () => { ch.sprite._castImg = null; };
      img2.src = ch.sprite.cast;
    }
  }

  /* ==================================================================
   * 初始化
   * ================================================================== */
  function init() {
    const zone = $('#petZone');
    const dock = $('#petDock');
    const reopen = $('#petReopen');
    if (!zone) return;

    const fx = FX.create();

    const petLeft = createPet({
      canvasId: 'petLeftCanvas', bubbleId: 'petLeftBubble', labelId: 'petLeftLabel',
      charKey: 'hanli', side: 'left',
    });
    const petRight = createPet({
      canvasId: 'petRightCanvas', bubbleId: 'petRightBubble', labelId: 'petRightLabel',
      charKey: 'nangongwan', side: 'right',
    });
    if (!petLeft || !petRight) return;

    const switchBox = $('#petSwitch');
    const cooldowns = {};

    function renderSwitch() {
      if (!switchBox) return;
      switchBox.innerHTML = RIGHT_ORDER.map((k) => {
        const c = CHARS[k];
        return '<button type="button" data-char="' + k + '" title="切换为' + SF.esc(c.name) + '"' +
          (k === petRight.key ? ' class="is-active"' : '') + '>' + SF.esc(c.name.slice(0, 1)) + '</button>';
      }).join('');
      $$('button', switchBox).forEach((b) => {
        b.addEventListener('click', (e) => { e.stopPropagation(); switchRight(b.dataset.char); });
      });
    }

    function switchRight(key) {
      if (!CHARS[key]) return;
      petRight.setChar(key);
      petRight.startAction('hop');
      petRight.say(CHARS[key].greet[Math.floor(Math.random() * CHARS[key].greet.length)], false, 1600);
      renderSwitch();
      SF.sfx.ping();
      if (fx) { fx.ping(); fx.loop(); }
    }
    renderSwitch();

    const skillBar = $('#skillBar');
    function renderSkills() {
      if (!skillBar) return;
      skillBar.innerHTML = SKILLS.map((s) =>
        '<button class="skill-btn" type="button" data-skill="' + s.id + '" title="' + SF.esc(s.name) + '（快捷键 ' + s.key + '）">' +
        '<span class="sk-no">' + s.key + '</span><span class="sk-name">' + SF.esc(s.name) + '</span></button>'
      ).join('');
      $$('button', skillBar).forEach((b) => {
        b.addEventListener('click', (e) => { e.stopPropagation(); castSkill(b.dataset.skill); });
      });
    }

    function castSkill(id) {
      const sk = SKILLS.find((s) => s.id === id);
      if (!sk) return;

      if (cooldowns[id] > 0) {
        SF.sfx.deny();
        petLeft.say('灵力未复。', false, 1100);
        return;
      }

      const line = sk.lines[Math.floor(Math.random() * sk.lines.length)];
      petLeft.cast(sk.name, line);
      if (SF.sfx[sk.sfx]) SF.sfx[sk.sfx]();

      if (fx) {
        switch (sk.fx) {
          case 'slash': fx.slash(); break;
          case 'array': fx.swordArray(); break;
          case 'thunder': fx.thunder(); break;
          case 'barrier': fx.barrier(); break;
          case 'ultimate': fx.ultimate(); break;
        }
        fx.loop();
      }

      cooldowns[id] = sk.cd;
      const btn = skillBar ? skillBar.querySelector('[data-skill="' + id + '"]') : null;
      if (btn) btn.classList.add('is-cooling');
      if (petLeft.el) petLeft.el.classList.add('is-casting');
      setTimeout(() => { if (petLeft.el) petLeft.el.classList.remove('is-casting'); }, 950);
    }
    renderSkills();

    petLeft.canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      const ready = SKILLS.filter((s) => !cooldowns[s.id]);
      const pick = ready.length ? ready[Math.floor(Math.random() * ready.length)] : SKILLS[0];
      castSkill(pick.id);
    });

    petRight.canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = RIGHT_ORDER.indexOf(petRight.key);
      switchRight(RIGHT_ORDER[(i + 1) % RIGHT_ORDER.length]);
    });

    if (!isTouch()) {
      [petLeft, petRight].forEach((p) => {
        p.canvas.addEventListener('mouseenter', () => {
          if (p.action !== 'idle') return;
          p.startAction(['look', 'stretch', 'fixHair', 'adjustSleeve'][Math.floor(Math.random() * 4)]);
        });
      });
    }

    function setPetVisible(onOff) {
      zone.classList.toggle('is-off', !onOff);
      if (dock) dock.classList.toggle('is-off', !onOff);
      if (reopen) reopen.hidden = onOff;
      if (!onOff && fx) fx.clear();
    }

    const toggleBtn = $('#dockToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        setPetVisible(false);
        SF.sfx.ui();
        SF.toast('桌宠已关闭，按 ' + ((window.SITE && SITE.petHotkey) || 'H') + ' 可重新打开');
      });
    }

    if (reopen) {
      reopen.addEventListener('click', () => {
        setPetVisible(true);
        SF.sfx.ping();
        petLeft.say('又见面了。', false, 1500);
      });
    }

    const hintBtn = $('#dockHint');
    const hintText = $('#dockHintText');
    if (hintBtn && hintText) {
      hintBtn.addEventListener('click', () => {
        hintText.hidden = !hintText.hidden;
        SF.sfx.click();
      });
    }

    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const hotkey = (window.SITE && SITE.petHotkey) || 'H';

      if (e.key.toUpperCase() === hotkey.toUpperCase() && !e.repeat) {
        const visible = !zone.classList.contains('is-off');
        setPetVisible(!visible);
        SF.sfx.ui();
        if (!visible) petLeft.say('剑在人在。', false, 1500);
        return;
      }

      if (zone.classList.contains('is-off')) return;

      const sk = SKILLS.find((s) => s.key === e.key);
      if (sk) { e.preventDefault(); castSkill(sk.id); return; }

      if (e.key.toUpperCase() === 'Q') {
        const i = RIGHT_ORDER.indexOf(petRight.key);
        switchRight(RIGHT_ORDER[(i + 1) % RIGHT_ORDER.length]);
      }
    });

    SF.on('settings', (s) => {
      setPetVisible(s.pet !== false);
      if (!s.fx && fx) fx.clear();
    });
    setPetVisible(SF.settings.pet !== false);

    setInterval(() => {
      let changed = false;
      for (const id of Object.keys(cooldowns)) {
        if (cooldowns[id] > 0) {
          cooldowns[id] -= 100;
          if (cooldowns[id] <= 0) { cooldowns[id] = 0; changed = true; }
        }
      }
      if (changed && skillBar) {
        $$('button', skillBar).forEach((b) => {
          if (!cooldowns[b.dataset.skill]) b.classList.remove('is-cooling');
        });
      }
    }, 100);

    let lastT = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      if (!document.hidden) {
        petLeft.frame(dt, now);
        petRight.frame(dt, now);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    setTimeout(() => {
      if (SF.settings.pet === false) return;
      petLeft.say('道友，别来无恙。', false, 2600);
    }, 1400);

    window.SFPet = { petLeft, petRight, castSkill, switchRight, fx, setPetVisible, SKILLS, CHARS };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

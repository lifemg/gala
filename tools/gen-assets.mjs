/**
 * SILENTFORGE DEV STATION — 资源生成器
 * ---------------------------------------------------------------
 * 用纯 Node（无第三方依赖）生成站点需要的静态素材：
 *   - assets/img/cursor.png          MC 风格像素箭头光标
 *   - assets/img/cursor-pointer.png  MC 风格像素手型光标
 *   - assets/img/icon.png            站点图标（像素剑）
 *   - assets/img/gallery/*.svg       推图栏目的程序化占位插画
 *   - assets/img/cover-*.svg         游戏卡片封面
 *   - assets/img/avatar-*.svg        头像占位
 *
 * 运行： node tools/gen-assets.mjs
 * 说明：生成的都是「占位素材」，替换成自己的图请看 README 的说明。
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const IMG = path.join(ROOT, 'assets', 'img');
const GAL = path.join(IMG, 'gallery');
fs.mkdirSync(GAL, { recursive: true });

/* ------------------------------------------------------------------ */
/* 1. 极简 PNG 编码器                                                  */
/* ------------------------------------------------------------------ */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolor + alpha
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* 2. 像素图：位图 -> 放大 + 自动描边                                   */
/* ------------------------------------------------------------------ */
const hex2rgb = (hex) => {
  const s = hex.replace('#', '');
  const v = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

/** 点在多边形内（射线法） */
function inPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 多边形 -> 位图（像素中心点采样） */
function bitmapFromPoly(poly, size) {
  const bm = Array.from({ length: size }, () => new Array(size).fill(false));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) bm[y][x] = inPoly(x + 0.5, y + 0.5, poly);
  return bm;
}

/** [y][x] 布尔位图 -> 行区间（用于手绘的形状） */
function bitmapFromSpans(spans, size) {
  const bm = Array.from({ length: size }, () => new Array(size).fill(false));
  spans.forEach((span, y) => {
    if (!span) return;
    for (let x = span[0]; x <= span[1]; x++) if (bm[y] && x >= 0 && x < size) bm[y][x] = true;
  });
  return bm;
}

/**
 * 位图 -> 放大 + 描边的 RGBA
 * 描边画在实体像素外侧（透明且八邻域有实体 -> 描边色）
 */
function renderBitmap(bm, scale, colors) {
  const size = bm.length;
  const W = size * scale;
  const out = Buffer.alloc(W * W * 4);
  const FILL = hex2rgb(colors.fill);
  const LINE = hex2rgb(colors.outline);
  const inside = (x, y) => x >= 0 && y >= 0 && x < size && y < size && bm[y][x];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rgb = null;
      if (bm[y][x]) rgb = FILL;
      else {
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (inside(x + dx, y + dy)) { near = true; break; }
        if (near) rgb = LINE;
      }
      if (!rgb) continue;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const i = ((y * scale + sy) * W + (x * scale + sx)) * 4;
          out[i] = rgb[0];
          out[i + 1] = rgb[1];
          out[i + 2] = rgb[2];
          out[i + 3] = 255;
        }
      }
    }
  }
  return { buf: out, w: W, h: W };
}

/* MC 风格箭头：尖角朝左上，尾巴向下。坐标含 1px 内边距，描边才不会贴边被裁 */
const ARROW_POLY = [
  [1, 1], [1, 12], [4, 9], [6, 14], [8, 13], [6, 8], [11, 8],
];

/* MC 风格手型：竖直食指 + 手掌 */
const HAND_SPANS = [];
for (let y = 2; y <= 6; y++) HAND_SPANS[y] = [7, 8];
HAND_SPANS[7] = [6, 8];
HAND_SPANS[8] = [5, 8];
HAND_SPANS[9] = [4, 9];
HAND_SPANS[10] = [4, 11];
HAND_SPANS[11] = [4, 12];
HAND_SPANS[12] = [4, 12];
HAND_SPANS[13] = [5, 11];
HAND_SPANS[14] = [7, 10];

/* 站点图标：像素剑（斜刃 + 护手 + 柄） */
const SWORD_SPANS = [];
for (let y = 1; y <= 10; y++) SWORD_SPANS[y] = [7, 8];
SWORD_SPANS[12] = [3, 12];
SWORD_SPANS[13] = [3, 12];
for (let y = 14; y <= 15; y++) SWORD_SPANS[y] = [7, 8];

const CURSOR_COLORS = { fill: '#ffffff', outline: '#141414' };
const HAND_COLORS = { fill: '#ffffff', outline: '#141414' };
const ICON_COLORS = { fill: '#e0a03a', outline: '#1a1008' };

function writePNG(name, sprite) {
  fs.writeFileSync(path.join(IMG, name), encodePNG(sprite.w, sprite.h, sprite.buf));
  return `${name} (${sprite.w}x${sprite.h})`;
}

const SIZE = 16;
const written = [
  writePNG('cursor.png', renderBitmap(bitmapFromPoly(ARROW_POLY, SIZE), 2, CURSOR_COLORS)),
  writePNG('cursor-pointer.png', renderBitmap(bitmapFromSpans(HAND_SPANS, SIZE), 2, HAND_COLORS)),
  writePNG('icon.png', renderBitmap(bitmapFromSpans(SWORD_SPANS, SIZE), 2, ICON_COLORS)),
];

// 放大预览图，仅供人工检查（脚本会自己删掉）
writePNG('_preview-cursor.png', renderBitmap(bitmapFromPoly(ARROW_POLY, SIZE), 12, CURSOR_COLORS));
writePNG('_preview-hand.png', renderBitmap(bitmapFromSpans(HAND_SPANS, SIZE), 12, HAND_COLORS));

/* ------------------------------------------------------------------ */
/* 3. 程序化插画（推图占位图，SVG）                                     */
/* ------------------------------------------------------------------ */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES = [
  { sky: ['#1b1030', '#6d3b7a', '#ef7d6f'], orb: '#ffd9a0', far: '#3a2450', mid: '#26163a', near: '#120a1e', water: '#2a1740', accent: '#ff9ec4', night: false },
  { sky: ['#050a20', '#102048', '#2a4a80'], orb: '#eaf2ff', far: '#16224a', mid: '#0d1636', near: '#050a1c', water: '#0a1330', accent: '#8fd3ff', night: true },
  { sky: ['#2a1430', '#8d4a6b', '#f7b7c8'], orb: '#fff0f5', far: '#54304a', mid: '#3a1f34', near: '#180c18', water: '#33192c', accent: '#ffc2d8', night: false },
  { sky: ['#062028', '#0e4a58', '#57c8c0'], orb: '#e8fffb', far: '#0d3b46', mid: '#082a34', near: '#04141b', water: '#062a33', accent: '#7ff0e0', night: false },
  { sky: ['#150a2e', '#3c1f66', '#9a6ad6'], orb: '#f0dcff', far: '#2c1750', mid: '#1d0f36', near: '#0b0518', water: '#1a0d33', accent: '#c79bff', night: true },
  { sky: ['#2b1710', '#8a4426', '#f3b45f'], orb: '#fff2c4', far: '#4a2a18', mid: '#311a0f', near: '#150b06', water: '#33200f', accent: '#ffcf7a', night: false },
  { sky: ['#0d1a2c', '#33506e', '#a8c8e0'], orb: '#ffffff', far: '#3c5468', mid: '#26384a', near: '#101c28', water: '#1d2c3d', accent: '#cfe6ff', night: false },
  { sky: ['#1e0f14', '#6b2a26', '#d9773f'], orb: '#ffe0a8', far: '#4a2320', mid: '#331715', near: '#170a09', water: '#2e1613', accent: '#ff9d5c', night: false },
];

function ridge(rnd, baseY, amp, w, steps) {
  let d = `M0,${baseY + 240} L0,${baseY}`;
  for (let i = 0; i <= steps; i++) {
    const x = (w / steps) * i;
    const y = baseY - amp * (0.35 + 0.65 * rnd()) * Math.sin((i / steps) * Math.PI);
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  d += ` L${w},${baseY} L${w},${baseY + 240} Z`;
  return d;
}

function pines(rnd, y, w, color, count, scale) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const s = scale * (0.6 + rnd() * 0.8);
    const h = 90 * s;
    out += `<g transform="translate(${x.toFixed(1)},${(y + rnd() * 26).toFixed(1)})" fill="${color}">`;
    for (let l = 0; l < 3; l++) {
      const ly = -l * (h * 0.3);
      const lw = (44 - l * 10) * s;
      out += `<path d="M0,${ly.toFixed(1)} L${lw.toFixed(1)},${ly.toFixed(1)} L0,${(ly - h * 0.45).toFixed(1)} L${(-lw).toFixed(1)},${ly.toFixed(1)} Z"/>`;
    }
    out += `<rect x="${(-4 * s).toFixed(1)}" y="0" width="${(8 * s).toFixed(1)}" height="${(16 * s).toFixed(1)}"/></g>`;
  }
  return out;
}

function makeArt(i) {
  const p = PALETTES[i % PALETTES.length];
  const W = 880;
  const H = 620;
  const rnd = mulberry32(1000 + i * 77);
  const horizon = 400 + Math.round(rnd() * 40);

  let stars = '';
  if (p.night) {
    for (let s = 0; s < 90; s++) {
      const x = rnd() * W;
      const y = rnd() * (horizon - 40);
      stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + rnd() * 1.5).toFixed(2)}" fill="#fff" opacity="${(0.25 + rnd() * 0.7).toFixed(2)}"/>`;
    }
  }

  let clouds = '';
  for (let c = 0; c < 7; c++) {
    clouds += `<ellipse cx="${(rnd() * W).toFixed(1)}" cy="${(60 + rnd() * (horizon - 150)).toFixed(1)}" rx="${(70 + rnd() * 150).toFixed(1)}" ry="${(10 + rnd() * 18).toFixed(1)}" fill="${p.orb}" opacity="${(0.05 + rnd() * 0.09).toFixed(2)}"/>`;
  }

  let petals = '';
  for (let f = 0; f < 34; f++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const s = 2 + rnd() * 4;
    petals += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${s.toFixed(1)}" ry="${(s * 0.55).toFixed(1)}" fill="${p.accent}" opacity="${(0.18 + rnd() * 0.4).toFixed(2)}" transform="rotate(${(rnd() * 90).toFixed(0)},${x.toFixed(1)},${y.toFixed(1)})"/>`;
  }

  const orbX = 180 + rnd() * (W - 360);
  const orbY = 110 + rnd() * 120;
  const orbR = 46 + rnd() * 26;

  let ripples = '';
  for (let k = 0; k < 16; k++) {
    const y = horizon + 8 + k * ((H - horizon) / 16);
    const wd = 40 + rnd() * 260;
    ripples += `<rect x="${(rnd() * (W - wd)).toFixed(1)}" y="${y.toFixed(1)}" width="${wd.toFixed(1)}" height="${(1 + rnd() * 2).toFixed(1)}" fill="${p.orb}" opacity="${(0.06 + rnd() * 0.16).toFixed(2)}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>
  <linearGradient id="sky${i}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${p.sky[0]}"/><stop offset="55%" stop-color="${p.sky[1]}"/><stop offset="100%" stop-color="${p.sky[2]}"/>
  </linearGradient>
  <radialGradient id="glow${i}" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${p.orb}" stop-opacity="0.95"/><stop offset="45%" stop-color="${p.orb}" stop-opacity="0.28"/><stop offset="100%" stop-color="${p.orb}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="water${i}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${p.sky[2]}" stop-opacity="0.55"/><stop offset="100%" stop-color="${p.water}" stop-opacity="0.98"/>
  </linearGradient>
  <radialGradient id="vig${i}" cx="50%" cy="48%" r="72%">
    <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
  <filter id="grain${i}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#sky${i})"/>
${stars}${clouds}
<circle cx="${orbX.toFixed(1)}" cy="${orbY.toFixed(1)}" r="${(orbR * 4.2).toFixed(1)}" fill="url(#glow${i})"/>
<circle cx="${orbX.toFixed(1)}" cy="${orbY.toFixed(1)}" r="${orbR.toFixed(1)}" fill="${p.orb}" opacity="0.92"/>
<path d="${ridge(rnd, horizon - 90, 150, W, 8)}" fill="${p.far}"/>
<path d="${ridge(rnd, horizon - 40, 110, W, 7)}" fill="${p.mid}"/>
<g opacity="0.9">${pines(rnd, horizon - 26, W, p.mid, 7, 1.05)}</g>
<rect x="0" y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#water${i})"/>
<rect x="${(orbX - 30).toFixed(1)}" y="${horizon}" width="60" height="${H - horizon}" fill="${p.orb}" opacity="0.22"/>
<g opacity="0.55">${ripples}</g>
<path d="${ridge(rnd, H - 40, 120, W, 6)}" fill="${p.near}"/>
<g>${pines(rnd, H - 34, W, p.near, 5, 1.5)}</g>
${petals}
<rect width="${W}" height="${H}" fill="url(#vig${i})"/>
<rect width="${W}" height="${H}" filter="url(#grain${i})" opacity="0.05"/>
</svg>`;
}

for (let i = 1; i <= 8; i++) fs.writeFileSync(path.join(GAL, `art${i}.svg`), makeArt(i - 1));
written.push('gallery/art1..8.svg');

/* ------------------------------------------------------------------ */
/* 4. 游戏封面占位图                                                    */
/* ------------------------------------------------------------------ */
function cover(title, sub, a, b, accent, motif) {
  const W = 800;
  const H = 450;
  const rnd = mulberry32(motif === 'lily' ? 7 : 21);
  let deco = '';
  if (motif === 'lily') {
    for (let i = 0; i < 14; i++) {
      const s = 26 + rnd() * 46;
      deco += `<g transform="translate(${(rnd() * W).toFixed(1)},${(rnd() * H).toFixed(1)}) rotate(${(rnd() * 360).toFixed(0)})" opacity="${(0.08 + rnd() * 0.14).toFixed(2)}" fill="${accent}">
        <ellipse rx="${(s * 0.22).toFixed(1)}" ry="${s.toFixed(1)}"/>
        <ellipse rx="${(s * 0.22).toFixed(1)}" ry="${s.toFixed(1)}" transform="rotate(60)"/>
        <ellipse rx="${(s * 0.22).toFixed(1)}" ry="${s.toFixed(1)}" transform="rotate(120)"/>
      </g>`;
    }
  } else {
    for (let i = 0; i < 26; i++) {
      const s = 3 + rnd() * 5;
      deco += `<g transform="translate(${(rnd() * W).toFixed(1)},${(rnd() * H).toFixed(1)}) rotate(${(rnd() * 90).toFixed(0)})" opacity="${(0.1 + rnd() * 0.2).toFixed(2)}" fill="none" stroke="${accent}" stroke-width="2">
        <path d="M0,-${s.toFixed(1)} L${(s * 0.87).toFixed(1)},${(s * 0.5).toFixed(1)} L${(-s * 0.87).toFixed(1)},${(s * 0.5).toFixed(1)} Z"/>
      </g>`;
    }
  }
  let grid = '';
  for (let x = 0; x <= W; x += 40) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${accent}" stroke-width="1" opacity="0.06"/>`;
  for (let y = 0; y <= H; y += 40) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${accent}" stroke-width="1" opacity="0.06"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient>
  <radialGradient id="cg2" cx="30%" cy="20%" r="80%"><stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/><stop offset="100%" stop-color="${accent}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#cg)"/>
<rect width="${W}" height="${H}" fill="url(#cg2)"/>
${grid}${deco}
<rect x="0" y="${H - 96}" width="${W}" height="96" fill="#000" opacity="0.42"/>
<text x="40" y="${H - 46}" font-family="Segoe UI, Microsoft YaHei, sans-serif" font-size="42" font-weight="700" fill="#fff" letter-spacing="2">${title}</text>
<text x="42" y="${H - 20}" font-family="Consolas, monospace" font-size="17" fill="${accent}" letter-spacing="4">${sub}</text>
</svg>`;
}

fs.writeFileSync(path.join(IMG, 'cover-lily.svg'), cover('百合花', 'LILY  /  GALGAME', '#241436', '#5a2350', '#ff9ec4', 'lily'));
fs.writeFileSync(path.join(IMG, 'cover-project2.svg'), cover('PROJECT-02', 'RPG  /  IN DEV', '#0b1226', '#123a52', '#6fd6ff', 'hex'));
written.push('cover-lily.svg, cover-project2.svg');

/* ------------------------------------------------------------------ */
/* 5. 头像占位                                                          */
/* ------------------------------------------------------------------ */
function avatarMonogram(text, ring, bg1, bg2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
<defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#ag)"/>
<circle cx="120" cy="120" r="104" fill="none" stroke="${ring}" stroke-width="4" opacity="0.75" stroke-dasharray="18 10"/>
<circle cx="120" cy="120" r="88" fill="#000" opacity="0.22"/>
<text x="120" y="150" text-anchor="middle" font-family="Consolas, monospace" font-size="74" font-weight="700" fill="${ring}" letter-spacing="2">${text}</text>
<text x="120" y="196" text-anchor="middle" font-family="Consolas, monospace" font-size="15" fill="${ring}" opacity="0.65" letter-spacing="3">REPLACE ME</text>
</svg>`;
}

function avatarDefault() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
<defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1b2330"/><stop offset="100%" stop-color="#0d131c"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#dg)"/>
<circle cx="120" cy="96" r="40" fill="#48566b"/>
<path d="M40,214 C40,160 78,138 120,138 C162,138 200,160 200,214 Z" fill="#48566b"/>
<circle cx="120" cy="120" r="104" fill="none" stroke="#6b7d95" stroke-width="3" opacity="0.5"/>
<text x="120" y="228" text-anchor="middle" font-family="Consolas, monospace" font-size="13" fill="#6b7d95" letter-spacing="2">DEFAULT</text>
</svg>`;
}

fs.writeFileSync(path.join(IMG, 'avatar-cxl.svg'), avatarMonogram('CxL', '#ffcf7a', '#2a1a10', '#12100f'));
fs.writeFileSync(path.join(IMG, 'avatar-2.svg'), avatarDefault());
written.push('avatar-cxl.svg, avatar-2.svg');

console.log('生成完成：\n  - ' + written.join('\n  - '));

# SILENTFORGE DEV STATION

一个部署在 Cloudflare Pages 上的纯静态站点。零依赖、零构建，拖上去就能用。

- **四个栏目**：游戏下载 / 音乐（敬请期待）/ 推图（敬请期待）/ 关于
- **深浅色主题**：可切换，自动记忆
- **MC 风格像素鼠标**：箭头 + 手型，程序生成
- **桌宠系统**：左侧韩立（点击发动技能），右侧南宫婉 / 元瑶 / 紫灵（点击切换、会凑过来）
- **真 3D 技能特效**：透视相机 + 景深 + 深度排序，大庚剑阵是三层环绕飞剑
- **响应式**：手机端与桌面端都完整可用

---

## 一、目录结构

```
silentforge-site/
├── index.html              首页（唯一页面）
├── 404.html                404 页
├── _headers                Cloudflare 安全头与缓存策略
├── robots.txt
├── css/
│   ├── style.css           主样式（主题变量 / 布局 / 响应式）
│   └── pet.css             桌宠与技能栏样式
├── js/
│   ├── data.js             ★ 所有内容都在这里，改这个文件就够了
│   ├── core.js             设置存储 / 主题 / 音效 / Toast
│   ├── audio.js            音乐播放器（含无文件时的合成器兜底）
│   ├── pet.js              角色绘制 + 3D 技能特效（Canvas，无需图片）
│   └── app.js              内容渲染 / 导航 / 设置面板 / 灯箱
├── assets/
│   ├── img/                背景、头像、光标、图标、封面
│   │   └── gallery/        推图插画（目前未使用）
│   └── music/              放你的 mp3
└── tools/
    └── gen-assets.mjs      光标/图标等占位素材生成脚本（可选）
```

---

## 二、部署到 Cloudflare Pages

### 方式 A：直接上传（最快）

1. 打开 Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. 项目名随便填，例如 `silentforge`
3. 把 `silentforge-site` 文件夹里的**所有内容**（不是文件夹本身）打包成 zip 拖进去
   - 注意：`index.html` 必须在压缩包的根目录，不能多套一层文件夹
4. 点 **Deploy**，几十秒后就能通过 `https://<项目名>.pages.dev` 访问

### 方式 B：接 GitHub 自动部署（推荐长期用）

1. 把这个文件夹推到你的 GitHub 仓库
2. Cloudflare Pages → **Connect to Git** → 选仓库
3. 构建设置全部留空：
   - **Framework preset**: `None`
   - **Build command**: 留空
   - **Build output directory**: `/`（如果你把文件放在仓库根目录）
4. **Save and Deploy**

以后每次 `git push` 都会自动重新部署。

### 绑定自己的域名

Pages 项目 → **Custom domains** → **Set up a domain**，按提示在 DNS 里加记录即可，HTTPS 自动签发。

---

## 三、你已经放进去的素材

| 文件 | 用途 |
|---|---|
| `assets/img/bg.jpg` | 全站背景壁纸 |
| `assets/img/ref-hanli.jpg` | 韩立参考图（仅作参考，页面不直接使用） |
| `assets/img/avatar-cxl.png` | CxL 头像（从你给的 SVG 容器里提取出的真 PNG） |

背景图路径写在 `js/data.js` 的 `SITE.background`。
**图不存在会自动退回纯色 + 网格背景**，不会破图。

> ⚠️ 你原来的 `avatar-cxl.svg` 其实是一个「把 PNG 用 base64 塞进 SVG」的容器，
> 而且里面的 MIME 写成了 `data:img/png`（正确应为 `image/png`），部分浏览器不认。
> 我已经把真正的位图提取成 `avatar-cxl.png`，`data.js` 指向 PNG，
> 并保留 SVG 作为加载失败时的兜底。

---

## 四、想换内容改哪里

打开 [`js/data.js`](js/data.js)，从上往下改。

### 1. 站点信息 `SITE`

```js
const SITE = {
  name: 'SILENTFORGE',
  tagline: 'DEV STATION',
  intro: '制作 Galgame、RPG 等游戏并提供相关服务。',
  background: 'assets/img/bg.jpg',   // 换壁纸就改这里
  defaultTheme: 'dark',
  petDefaultOn: true,
  petHotkey: 'H',                    // 重新打开桌宠的快捷键
};
```

### 2. 游戏下载 `GAMES`

「百合花」已按**人教版必修一 茹志鹃《百合花》**改写简介（不再是原来编的游戏设定），
两个链接都已填好：

- 蓝奏云：`https://wwawf.lanzouu.com/i50zM4b412ng`，提取码 `6ytz`（页面上可一键复制）
- GitHub：`https://github.com/CxL-xyz/Lily`

项目二目前是「敬请期待」占位块（不是 RPG，没有任何编造信息）。
想做它的时候，把 `comingSoon: true` 删掉，补上 `version / genre / engine / desc / links` 即可。

### 3. 音乐 `TRACKS` 和推图 `GALLERY`

**目前都是空数组 `[]`，页面上显示「敬请期待」。**

想开这两栏，把 `data.js` 里的模板解开：

```js
const TRACKS = [
  { title: '花谱', artist: 'SilentForge Sound', album: '百合花 OST',
    duration: '—', file: 'assets/music/huapu.mp3',
    cover: 'assets/img/icon.png', tags: ['主题曲'] },
];
```

- 音乐：mp3 放进 `assets/music/`，文件名和 `file` 对上即可。
  万一文件缺失，播放器会自动切到内置合成器演示，不会报错。
- 推图：图片放进 `assets/img/gallery/`，再加进 `GALLERY` 数组。
  `ratio` 填 `'wide'` 或 `'tall'`，只影响加载前的占位高度，加载后按真实比例自动重排。

### 4. 关于 `DEVS`

按你的要求，**简介、职位、技能标签全部删掉了**，只保留：

- 名字 / GitHub handle
- 头像（CxL 显示，lifemg 显示为 `NO AVATAR` 占位块）
- 联系方式：QQ（点击可复制）+ GitHub（可点击跳转）

想重新加回职位之类的字段，在 `data.js` 的 `DEVS` 里加，并在 `app.js` 的
`renderAbout()` 里补上对应模板。

---

## 五、桌宠与技能

### 快捷键

| 键 | 作用 |
|---|---|
| `1` | 青元剑诀（剑气横扫） |
| `2` | **大庚剑阵**（三层环绕飞剑 + 法阵 + 光柱） |
| `3` | 辟邪神雷（天雷落地） |
| `4` | 元磁神光（立体护盾） |
| `5` | 化神一击（剑雨 + 冲击波） |
| `Q` | 切换右侧角色 |
| `H` | 开关桌宠 |

也可以直接点韩立本体随机发动，或点底部技能栏。技能有冷却，冷却中按钮变灰。

### 技能特效是真 3D

`js/pet.js` 里实现了一个透视相机（`makeCamera`）：
世界坐标 → 相机坐标 → 屏幕坐标，带**近大远小**和**按深度排序**（远的先画）。

大庚剑阵的 31 把剑各自有真实 XYZ 坐标，分三层环绕（外/中/内层交替反向旋转），
每把剑有飞入轨迹、悬浮起伏与朝向倾角。所以从任何角度看都有立体感，不是平面贴图。

### 角色是 Canvas 手绘的

四个角色都是代码逐笔画的（约 6 头身修长比例），带连续待机动作：
呼吸、眨眼、头发飘动、视线游移，以及随机触发的张望 / 伸展 / 理鬓发 / 整袖 / 跳一下 / 自言自语。

**想要图 1 那种 3D 渲染质感，只能换成图片。** 代码画得再好也是插画风。

### 换成自己的角色立绘（已预留接口）

把图片放进 `assets/img/`，命名成下面这些就**自动生效，不用改代码**：

```
assets/img/pet-hanli.png         韩立
assets/img/pet-nangongwan.png    南宫婉
assets/img/pet-yuanyao.png       元瑶
assets/img/pet-ziling.png        紫灵
assets/img/pet-<角色>-cast.png   施法用的另一套（可选）
```

- 格式：**横向排列的帧序列**（默认 4 帧）透明 PNG，例如 4 帧就画成 4×1 的长条图。
- 想改帧数或播放速度，改 `js/pet.js` 里 `CHARS[x].sprite.frames / fps`。
- 有图就用图，没图就用手绘版本，两者自动切换。

---

## 六、设置面板

点顶栏齿轮图标打开：

| 分组 | 项目 |
|---|---|
| 外观 | 暗黑 / 浅色 / 跟随系统、主题强调色、自定义鼠标 |
| 桌宠 | 显示桌宠、技能特效、技能音效 |
| 无障碍 | 减弱动画 |

> 背景图片地址、背景亮度/模糊、视差这几个**已经移除**——
> 背景是你自己配置的，不需要访客去改。

设置存在 `localStorage`（`sf.settings.v1`），每台设备独立。

---

## 七、响应式

| 断点 | 变化 |
|---|---|
| `> 1080px` | 完整桌面布局 |
| `≤ 900px` | 导航收进汉堡菜单；游戏卡片改为上图下文 |
| `≤ 720px` | 缩小字号间距；桌宠变小；播放器控件重排；推图改两列 |
| `≤ 420px` | 进一步压缩顶栏与桌宠 |

另外：触屏上信息条常显；图片全部懒加载；页面不可见时动画自动暂停省电；
支持 `prefers-reduced-motion`。

---

## 八、常见问题

**Q：上传后打开是空白 / 404？**
A：`index.html` 必须在压缩包根目录。

**Q：背景图不显示？**
A：确认 `assets/img/bg.jpg` 存在，且 `data.js` 里 `SITE.background` 路径正确。
路径为空或文件缺失时会自动退回纯色 + 网格背景。

**Q：韩立看起来不像动画里那样？**
A：现在的手绘版是「二次元插画」风格。要 3D 渲染质感必须换成图片，
见上面「换成自己的角色立绘」。

**Q：技能特效会不会卡？**
A：触屏设备会自动降低粒子/飞剑数量。觉得卡可以在设置里关掉技能特效，
或者打开「减弱动画」。页面不可见时动画会暂停。

**Q：想加第三个游戏？**
A：在 `GAMES` 数组里照抄一段，改 `id`（要唯一）和其它字段。

---

## 九、本地预览

直接双击 `index.html` 就能看，但更推荐起本地服务：

```bash
npx serve silentforge-site
python -m http.server 8080 --directory silentforge-site
```

重新生成光标/图标等占位素材（可选）：

```bash
node tools/gen-assets.mjs
```

---

## 十、技术说明

- **零依赖**：没有 npm 包、没有框架、没有 CDN 请求
- **零构建**：改完直接刷新
- **安全性**：所有数据经过 HTML 转义；链接经过协议白名单校验（拒绝 `javascript:`）；
  `_headers` 配了 `nosniff`、`X-Frame-Options`、`Referrer-Policy`
- **无障碍**：语义化标签、ARIA、键盘导航、焦点可见；双主题下文字对比度均达 WCAG AA
- **性能**：`requestAnimationFrame` 节流滚动、离屏暂停、图片懒加载、3D 粒子按设备降级

祝你上线顺利。剑意长存。

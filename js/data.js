/* ==================================================================
 * SILENTFORGE DEV STATION — 站点内容数据
 * ==================================================================
 * 这个文件是整站唯一需要你手动改的地方。
 * 改完保存刷新即可，不需要重新构建。
 * ================================================================== */

/* ------------------------------------------------------------------
 * 站点基本信息
 * ------------------------------------------------------------------ */
const SITE = {
  name: 'SILENTFORGE',
  nameCn: '开发站',
  tagline: 'DEV STATION',
  // 主标题下的一句话简介
  intro: '制作 Galgame、RPG 等游戏并提供相关服务。',
  introEn: 'We build Galgames, RPGs, and everything around them.',

  // 背景图：把壁纸存成 assets/img/bg.jpg 即可自动生效。
  // 图不存在时会自动退回「纯色 + 网格」背景，不会破图。
  background: 'assets/img/bg.jpg',

  // 打开页面默认主题：'dark' | 'light'
  defaultTheme: 'dark',
  // 桌宠默认是否显示
  petDefaultOn: true,
  // 重新打开桌宠的快捷键
  petHotkey: 'H',
};

/* ------------------------------------------------------------------
 * 栏目二/三：音乐、推图
 * ------------------------------------------------------------------
 * 你现在让这两栏先不放内容，页面会自动显示「敬请期待」。
 * 以后想开：
 *   音乐 —— 往 TRACKS 里加曲目（并把 mp3 放进 assets/music/）
 *   推图 —— 往 GALLERY 里加图（并把图放进 assets/img/gallery/）
 * 格式参考 README，取消注释即可。
 * ------------------------------------------------------------------ */
const TRACKS = [];
const GALLERY = [];

/* 以后开音乐栏时，把下面注释解开当模板用：
const TRACKS = [
  {
    title: '花谱',
    artist: 'SilentForge Sound',
    album: '百合花 Original Soundtrack',
    duration: '—',
    file: 'assets/music/huapu.mp3',
    cover: 'assets/img/icon.png',
    tags: ['主题曲', '钢琴'],
  },
];
*/

/* ------------------------------------------------------------------
 * 栏目一：游戏下载
 * ------------------------------------------------------------------
 * links 里的 url 写 '#' 会显示成「待补充」，点击弹提示，不会跳空页。
 * ------------------------------------------------------------------ */
const GAMES = [
  {
    id: 'lily',
    title: '百合花',
    titleEn: 'THE LILY',
    status: '开发中',
    version: 'v0.1.0-alpha',
    genre: 'Galgame / 视觉小说',
    engine: 'Ren\'Py',
    cover: 'assets/img/cover-lily.svg',
    // 改编自人教版必修一 茹志鹃《百合花》
    desc:
      '改编自茹志鹃同名短篇小说（人教版必修一）。1946 年中秋，淮海战役前夕，' +
      '“我”随文工团来到前沿包扎所，认识了那位十九岁的小通讯员——他借被子时红了脸，' +
      '枪筒里插着几枝野菊花。新媳妇那条撒满白色百合花的被面，' +
      '成了这个故事里最柔软、也最沉重的东西。',
    features: [
      '忠于原文的叙事主线',
      '小通讯员 / 新媳妇 双视角',
      '原文名场面全程 Live2D 演出',
      '原创 BGM 与结尾曲',
    ],
    links: [
      {
        label: '蓝奏云下载',
        type: 'lanzou',
        url: 'https://wwawf.lanzouu.com/i50zM4b412ng',
        password: '6ytz',
        hint: '',
      },
      {
        label: 'GitHub 源码',
        type: 'github',
        url: 'https://github.com/CxL-xyz/Lily',
        hint: '',
      },
    ],
  },

  /* 项目二：还没开始，直接占位 */
  {
    id: 'project-02',
    title: '项目二',
    titleEn: 'PROJECT-02',
    status: '敬请期待',
    version: '',
    genre: '',
    engine: '',
    cover: 'assets/img/cover-project2.svg',
    comingSoon: true,
    desc: '下一个项目还在酝酿中，等筹备好了会第一时间放在这里。',
    features: [],
    links: [],
  },
];

/* ------------------------------------------------------------------
 * 栏目四：关于（开发者信息）
 * ------------------------------------------------------------------
 * showAvatar: false 就不显示头像（第二位按你的要求不展示）
 * 头像文件放进 assets/img/ 同名覆盖即可
 * ------------------------------------------------------------------ */
const DEVS = [
  {
    name: 'CxL',
    handle: '@CxL-xyz',
    showAvatar: true,
    // 头像：assets/img/avatar-cxl.png
    avatar: 'assets/img/avatar-cxl.png',
    avatarFallback: 'assets/img/avatar-cxl.svg',
    contacts: [
      { label: 'QQ', value: '3629712164', type: 'qq' },
      { label: 'GitHub', value: 'CxL-xyz', url: 'https://github.com/CxL-xyz', type: 'github' },
    ],
  },
  {
    name: 'lifemg',
    handle: '@lifemg',
    showAvatar: false,
    avatar: 'assets/img/avatar-2.svg',
    contacts: [
      { label: 'QQ', value: '1066159411', type: 'qq' },
      { label: 'GitHub', value: 'lifemg', url: 'https://github.com/lifemg', type: 'github' },
    ],
  },
];

/* ------------------------------------------------------------------
 * 关于页的「我们能做什么」
 * ------------------------------------------------------------------ */
const SERVICES = [
  { title: 'Galgame 制作', desc: '从企划、剧本到程序打包，全流程或按模块承接。' },
  { title: 'RPG 系统开发', desc: '战斗系统、背包、存档、任务链等模块化实现。' },
  { title: '美术与音乐', desc: '立绘、背景、UI 设计，以及原创 BGM 与音效。' },
  { title: '本地化与移植', desc: '中 / 日文本地化，PC 与移动端适配打包。' },
];

/* ------------------------------------------------------------------
 * 关于页底部的说明
 * ------------------------------------------------------------------ */
const CONTACT = {
  email: '',
  note: '合作、约稿、技术交流都欢迎，通过上面的 QQ 或 GitHub 找我们。',
};

/* ------------------------------------------------------------------
 * 导出到全局
 * ------------------------------------------------------------------
 * 重要：本文件是普通 <script>，顶层 const 不会自动挂到 window 上。
 * 下面这行把数据显式挂到 window，其它脚本（core/app/audio）才能读到。
 * 如果你新增了数据数组，记得也加进来。
 * ------------------------------------------------------------------ */
Object.assign(window, { SITE, GAMES, TRACKS, GALLERY, DEVS, SERVICES, CONTACT });

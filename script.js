/* =============================================
   格致中学游戏开发 - 交互逻辑
   ============================================= */

(function () {
    'use strict';

    /* ==========================================
       1. 游戏数据（20个预留位）
       直接修改数组内容即可替换游戏信息
       ========================================== */
    const games = [
        {
            title: '游戏名称 1',
            desc: '这是游戏的项目简介，简要描述游戏的玩法、特色和开发背景。',
            tags: ['类型', '引擎'],
            lanzouUrl: 'https://你的蓝奏云链接1',        // ← 替换为实际链接
            githubUrl: 'https://github.com/你的用户名/仓库1' // ← 替换为实际链接
        },
        {
            title: '游戏名称 2',
            desc: '这是游戏的项目简介，简要描述游戏的玩法、特色和开发背景。',
            tags: ['类型', '引擎'],
            lanzouUrl: 'https://你的蓝奏云链接2',
            githubUrl: 'https://github.com/你的用户名/仓库2'
        },
        // ... 继续添加，最多20个
        // 以下为自动生成的空白占位
    ];

    // 自动补全到 20 个
    for (let i = games.length; i < 20; i++) {
        games.push({
            title: `游戏名称 ${i + 1}`,
            desc: '项目简介待填写。请编辑 script.js 中的 games 数组替换此内容。',
            tags: ['待填写'],
            lanzouUrl: '#',
            githubUrl: '#'
        });
    }

    /* ==========================================
       2. 渲染游戏卡片
       ========================================== */
    const gameGrid = document.getElementById('gameGrid');
    const downloadIconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    const githubIconSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`;

    function renderGames() {
        if (!gameGrid) return;

        gameGrid.innerHTML = games.map((game, index) => `
            <div class="game-card">
                <span class="game-card-number">#${String(index + 1).padStart(2, '0')}</span>
                <h3 class="game-card-title">${game.title}</h3>
                <p class="game-card-desc">${game.desc}</p>
                <div class="game-card-tags">
                    ${game.tags.map(t => `<span class="game-tag">${t}</span>`).join('')}
                </div>
                <div class="game-card-links">
                    <a href="${game.lanzouUrl}" target="_blank" rel="noopener" class="game-link download-link">
                        ${downloadIconSvg} 蓝奏云下载
                    </a>
                    <a href="${game.githubUrl}" target="_blank" rel="noopener" class="game-link">
                        ${githubIconSvg} 源码
                    </a>
                </div>
            </div>
        `).join('');
    }

    /* ==========================================
       3. 点击梅花特效
       ========================================== */
    const effectContainer = document.getElementById('clickEffectContainer');
    const petalColors = ['#ff6b8a', '#ff9eb5', '#ff4d6d', '#e84393', '#fd79a8', '#ff85a1'];

    function createClickPetals(x, y) {
        const count = 8 + Math.floor(Math.random() * 6); // 8-13个花瓣

        for (let i = 0; i < count; i++) {
            const petal = document.createElement('div');
            petal.className = 'click-petal';

            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance + 40; // 略微向下
            const rot = (Math.random() - 0.5) * 720;
            const duration = 0.7 + Math.random() * 0.5;
            const color = petalColors[Math.floor(Math.random() * petalColors.length)];
            const size = 8 + Math.random() * 8;

            petal.style.left = x + 'px';
            petal.style.top = y + 'px';
            petal.style.width = size + 'px';
            petal.style.height = size + 'px';
            petal.style.setProperty('--tx', tx + 'px');
            petal.style.setProperty('--ty', ty + 'px');
            petal.style.setProperty('--rot', rot + 'deg');
            petal.style.setProperty('--duration', duration + 's');
            petal.style.setProperty('--petal-color', color);

            effectContainer.appendChild(petal);

            petal.addEventListener('animationend', () => {
                petal.remove();
            });
        }
    }

    document.addEventListener('click', (e) => {
        createClickPetals(e.clientX, e.clientY);
    }, { passive: true });

    /* ==========================================
       4. 花瓣飘落背景（Canvas）
       ========================================== */
    const canvas = document.getElementById('petalCanvas');
    const ctx = canvas.getContext('2d');
    let petals = [];
    let animationId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Petal {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * canvas.width;
            this.y = initial ? Math.random() * canvas.height - canvas.height : -20;
            this.size = 6 + Math.random() * 10;
            this.speedY = 0.5 + Math.random() * 1.2;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.03;
            this.opacity = 0.15 + Math.random() * 0.35;
            this.sway = Math.random() * Math.PI * 2;
            this.swaySpeed = 0.01 + Math.random() * 0.02;
            this.swayAmount = 0.5 + Math.random() * 1.5;
            this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
        }

        update() {
            this.sway += this.swaySpeed;
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.sway) * this.swayAmount;
            this.rotation += this.rotationSpeed;

            if (this.y > canvas.height + 30) {
                this.reset();
            }
            if (this.x < -30) this.x = canvas.width + 20;
            if (this.x > canvas.width + 30) this.x = -20;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;

            // 绘制花瓣形状（用贝塞尔曲线模拟）
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
                this.size * 0.5, -this.size * 0.6,
                this.size * 1.1, -this.size * 0.1,
                this.size, this.size * 0.3
            );
            ctx.bezierCurveTo(
                this.size * 0.9, this.size * 0.7,
                this.size * 0.3, this.size * 0.6,
                0, 0
            );
            ctx.fill();

            ctx.restore();
        }
    }

    function initPetals() {
        resizeCanvas();
        petals = [];
        const count = Math.min(35, Math.floor(window.innerWidth / 30));
        for (let i = 0; i < count; i++) {
            petals.push(new Petal());
        }
    }

    function animatePetals() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        petals.forEach(petal => {
            petal.update();
            petal.draw();
        });
        animationId = requestAnimationFrame(animatePetals);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        initPetals();
    });

    /* ==========================================
       5. 导航与滚动
       ========================================== */
    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const sections = document.querySelectorAll('.section');

    // 侧边导航点击
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(item.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 移动端导航点击
    mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(item.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
            closeMobileMenu();
        });
    });

    // 滚动监听，高亮当前栏目
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            requestAnimationFrame(() => {
                updateActiveNav();
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });

    function updateActiveNav() {
        let current = '';
        const scrollPos = window.scrollY + 120;

        sections.forEach(section => {
            if (section.offsetTop <= scrollPos) {
                current = section.id;
            }
        });

        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === current);
        });

        mobileNavItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === current);
        });
    }

    /* ==========================================
       6. 移动端菜单
       ========================================== */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');

    function openMobileMenu() {
        mobileMenu.classList.add('open');
        mobileMenuOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        mobileMenu.classList.remove('open');
        mobileMenuOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (hamburger) hamburger.addEventListener('click', openMobileMenu);
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
    if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', closeMobileMenu);

    /* ==========================================
       7. 初始化
       ========================================== */
    renderGames();
    initPetals();
    animatePetals();

    // 页面隐藏时暂停动画，节省性能
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animatePetals();
        }
    });

})();
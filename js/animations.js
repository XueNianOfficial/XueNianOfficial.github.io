/**
 * animations.js — 页面动画系统
 * 负责：滚动揭示动画 · Canvas 粒子飘落效果
 */

;(function () {
    'use strict';

    /* ============================================================
     * 一、Intersection Observer 滚动揭示动画
     * — 监听带有 .reveal 类的元素
     * — 当元素进入视口时添加 .visible 类触发 CSS 过渡
     * — 使用 once: true 确保动画只触发一次
     * ============================================================ */
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal');
        if (!revealElements.length) return;

        // 如果浏览器不支持 IntersectionObserver，直接显示所有元素
        if (!('IntersectionObserver' in window)) {
            revealElements.forEach(function (el) {
                el.classList.add('visible');
            });
            return;
        }

        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // 元素已显示，停止观察
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                root: null,                    // 相对于视口
                rootMargin: '0px 0px -60px 0px', // 元素进入视口 60px 后触发
                threshold: 0.1                 // 10% 可见时触发
            }
        );

        revealElements.forEach(function (el) {
            observer.observe(el);
        });
    }

    /* ============================================================
     * 二、Canvas 粒子飘落系统
     * — 在 #particles-canvas 上绘制飘落的爪印形状粒子
     * — 使用 requestAnimationFrame 循环
     * — 窗口 resize 时自适应画布大小
     * ============================================================ */

    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return; // 页面上没有粒子画布则跳过

    const ctx = canvas.getContext('2d');

    // 粒子数组
    let particles = [];

    // 粒子配置
    const CONFIG = {
        maxParticles: 20,              // 同时最大粒子数
        minSize: 6,                    // 最小粒子尺寸
        maxSize: 16,                   // 最大粒子尺寸
        minSpeed: 0.3,                 // 最小下落速度
        maxSpeed: 1.2,                 // 最大下落速度
        minOpacity: 0.08,              // 最小透明度
        maxOpacity: 0.25,              // 最大透明度
        // 粒子颜色（浅色主题使用蓝色系，暗色主题偏亮）
        colorsLight: [
            'rgba(74,144,217,{opacity})',   // 主题蓝
            'rgba(122,184,245,{opacity})',  // 浅蓝
            'rgba(90,160,230,{opacity})',   // 中蓝
        ],
        colorsDark: [
            'rgba(140,190,245,{opacity})',
            'rgba(160,210,250,{opacity})',
            'rgba(120,175,235,{opacity})',
        ],
    };

    /**
     * 获取当前主题的粒子颜色数组
     * @returns {string[]}
     */
    function getParticleColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        return theme === 'dark' ? CONFIG.colorsDark : CONFIG.colorsLight;
    }

    /**
     * 绘制一个爪印形状到 canvas
     * 爪印 = 1个大圆（肉球）+ 4个小圆（趾头）
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x - 中心 x 坐标
     * @param {number} y - 中心 y 坐标
     * @param {number} size - 爪印尺寸
     * @param {number} rotation - 旋转角度（弧度）
     * @param {string} color - 填充色
     */
    function drawPawPrint(ctx, x, y, size, rotation, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.fillStyle = color;

        const s = size;
        // 主肉球（大椭圆）
        ctx.beginPath();
        ctx.ellipse(0, s * 0.2, s * 0.35, s * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 四个趾头（上方小圆）
        const toes = [
            { dx: -s * 0.32, dy: -s * 0.45 },  // 左一
            { dx: -s * 0.11, dy: -s * 0.58 },  // 左二
            { dx:  s * 0.11, dy: -s * 0.58 },  // 右二
            { dx:  s * 0.32, dy: -s * 0.45 },  // 右一
        ];
        toes.forEach(function (t) {
            ctx.beginPath();
            ctx.arc(t.dx, t.dy, s * 0.18, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    /**
     * 粒子类：表示一个飘落的爪印
     */
    class Particle {
        constructor() {
            this.reset(true);
        }

        /**
         * 重置粒子到初始状态
         * @param {boolean} initAbove - 是否从画布上方随机位置开始
         */
        reset(initAbove) {
            this.x = Math.random() * canvas.width;
            this.y = initAbove ? -Math.random() * 100 : Math.random() * canvas.height;
            this.size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
            this.speedY = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
            this.speedX = (Math.random() - 0.5) * 0.4; // 随机左右漂移
            this.opacity = CONFIG.minOpacity + Math.random() * (CONFIG.maxOpacity - CONFIG.minOpacity);
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02; // 随机旋转速度
            this.wobbleAmp = Math.random() * 0.3;             // 左右摆动幅度
            this.wobbleSpeed = 0.005 + Math.random() * 0.015;
            this.wobbleOffset = Math.random() * Math.PI * 2;
            this.time = Math.random() * 100;
        }

        /**
         * 更新粒子位置
         */
        update() {
            this.y += this.speedY;
            // 左右摆动，模拟飘落效果
            this.x += Math.sin(this.time * this.wobbleSpeed * 60 + this.wobbleOffset) * this.wobbleAmp + this.speedX;
            this.rotation += this.rotationSpeed;
            this.time += 1 / 60;

            // 飘出画布底部后重置到顶部
            if (this.y > canvas.height + this.size * 2) {
                this.reset(true);
            }
            // 飘出左右边界时反弹
            if (this.x < -this.size) this.x = canvas.width + this.size;
            if (this.x > canvas.width + this.size) this.x = -this.size;
        }

        /**
         * 绘制粒子
         * @param {CanvasRenderingContext2D} ctx
         * @param {string[]} colors - 可用颜色数组
         */
        draw(ctx, colors) {
            const colorTemplate = colors[Math.floor(Math.random() * colors.length)];
            const color = colorTemplate.replace('{opacity}', String(this.opacity));
            drawPawPrint(ctx, this.x, this.y, this.size, this.rotation, color);
        }
    }

    /**
     * 调整画布尺寸以适配窗口
     */
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(dpr, dpr); // 适配高 DPI 屏幕

        // 重建粒子（因为画布宽高变了）
        initParticles();
    }

    /**
     * 初始化粒子数组
     */
    function initParticles() {
        particles = [];
        for (let i = 0; i < CONFIG.maxParticles; i++) {
            particles.push(new Particle());
        }
    }

    /**
     * 动画循环
     */
    function animate() {
        // 用实际像素绘制（不去理会 devicePixelRatio，直接用宽高）
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const colors = getParticleColors();

        particles.forEach(function (p) {
            p.update();
            p.draw(ctx, colors);
        });

        requestAnimationFrame(animate);
    }

    // 启动粒子系统
    resizeCanvas();
    initParticles();
    animate();

    // 窗口大小变化时重新调整画布
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 200);
    });

    // 主题切换时粒子颜色自动更新（在 animate 循环中动态读取）

    /* ============================================================
     * 三、启动所有动画系统
     * ============================================================ */
    // DOM 加载完成后初始化滚动揭示
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollReveal);
    } else {
        initScrollReveal();
    }

    // 监听 blog.js 渲染完成事件：博客条目动态插入后重新观察
    window.addEventListener('blog-rendered', function () {
        // 延迟一小段时间确保 DOM 已更新
        setTimeout(initScrollReveal, 50);
    });

})();

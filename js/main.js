/**
 * main.js — 核心交互逻辑
 * 负责：暗色主题切换 · 移动端菜单 · 平滑滚动 · 导航栏阴影 · 回到顶部 · 加载屏幕
 */

;(function () {
    'use strict';

    /* ============================================================
     * 一、DOM 元素引用
     * ============================================================ */
    const html = document.documentElement;
    const body = document.body;
    const navbar = document.getElementById('navbar');
    const themeToggle = document.getElementById('theme-toggle');
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    const backToTopBtn = document.getElementById('back-to-top');
    const loadingScreen = document.getElementById('loading-screen');
    const allNavLinks = document.querySelectorAll('.nav-menu a');

    /* ============================================================
     * 二、暗色主题切换
     * — 使用 localStorage 持久化用户选择
     * — 切换 <html data-theme="dark|light">
     * — CSS 变量自动响应
     * ============================================================ */

    /**
     * 获取当前主题：优先读取 localStorage，无记录则跟随系统偏好
     * @returns {'dark' | 'light'}
     */
    function getPreferredTheme() {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'light') {
            return stored;
        }
        // 检测系统是否开启了暗色模式
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * 应用主题到 DOM
     * @param {'dark' | 'light'} theme
     */
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        // 更新 meta theme-color（影响浏览器地址栏颜色）
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', theme === 'dark' ? '#1A1A2E' : '#4A90D9');
        }
    }

    /**
     * 保存主题偏好
     * @param {'dark' | 'light'} theme
     */
    function saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    /**
     * 切换主题
     */
    function toggleTheme() {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        saveTheme(next);
    }

    // 初始化主题
    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);

    // 绑定主题切换按钮
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 监听系统主题变化（当用户未手动设置主题时自动跟随）
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            // 仅当用户未手动设置主题时才跟随系统
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /* ============================================================
     * 三、移动端汉堡菜单
     * — 点击汉堡按钮展开/收起菜单
     * — 点击菜单项后自动收起
     * — 点击页面其他区域关闭菜单
     * ============================================================ */
    if (menuToggle && navMenu) {
        // 切换菜单开关
        menuToggle.addEventListener('change', function () {
            if (menuToggle.checked) {
                navMenu.classList.add('open');
            } else {
                navMenu.classList.remove('open');
            }
        });

        // 点击任意导航链接后关闭菜单
        allNavLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                menuToggle.checked = false;
                navMenu.classList.remove('open');
            });
        });

        // 点击页面内容区关闭菜单（避免菜单遮挡内容）
        document.addEventListener('click', function (e) {
            const isMenuOpen = navMenu.classList.contains('open');
            if (!isMenuOpen) return;

            // 判断点击是否在菜单或汉堡按钮之外
            const clickedInsideMenu = navMenu.contains(e.target);
            const clickedOnToggle = menuToggle === e.target || (menuToggle.nextElementSibling && menuToggle.nextElementSibling.contains(e.target));
            if (!clickedInsideMenu && !clickedOnToggle) {
                menuToggle.checked = false;
                navMenu.classList.remove('open');
            }
        });
    }

    /* ============================================================
     * 四、平滑滚动导航
     * — 拦截导航链接点击，平滑滚动到目标 section
     * — 考虑导航栏高度的偏移
     * ============================================================ */
    allNavLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            const href = link.getAttribute('href');
            // 仅处理页面内锚点链接（以 # 开头且非纯 #）
            if (!href || href === '#' || !href.startsWith('#')) return;

            const targetEl = document.querySelector(href);
            if (!targetEl) return;

            e.preventDefault();

            // 计算滚动目标位置（减去导航栏高度 + 一些内边距）
            const navHeight = navbar ? navbar.offsetHeight : 64;
            const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });

    /* ============================================================
     * 五、导航栏滚动阴影
     * — 页面滚动超过 10px 时导航栏添加阴影
     * — 使用 requestAnimationFrame 节流优化性能
     * ============================================================ */
    let ticking = false;
    function updateNavbarShadow() {
        if (!navbar) return;
        const scrollY = window.pageYOffset;
        if (scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(updateNavbarShadow);
            ticking = true;
        }
    });

    /* ============================================================
     * 六、回到顶部按钮
     * — 滚动超过 400px 显示
     * — 点击平滑滚动到顶部
     * ============================================================ */
    if (backToTopBtn) {
        // 滚动监听：控制显示/隐藏
        window.addEventListener('scroll', function () {
            if (window.pageYOffset > 400) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        // 点击回到顶部
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /* ============================================================
     * 七、加载屏幕
     * — 页面完全加载后淡出消失
     * — 设置最大等待时间 3 秒（避免资源加载卡住时一直显示）
     * ============================================================ */
    function hideLoadingScreen() {
        if (!loadingScreen) return;
        if (loadingScreen.classList.contains('hidden')) return; // 已隐藏

        loadingScreen.classList.add('hidden');
        // 动画完成后从 DOM 彻底移除
        loadingScreen.addEventListener('transitionend', function handler() {
            loadingScreen.removeEventListener('transitionend', handler);
            if (loadingScreen.parentNode) {
                loadingScreen.parentNode.removeChild(loadingScreen);
            }
        });
    }

    // 页面加载完成时隐藏
    window.addEventListener('load', hideLoadingScreen);

    // 安全兜底：最多等待 3 秒
    setTimeout(hideLoadingScreen, 3000);

    /* ============================================================
     * 八、初始状态设置
     * — 确保导航栏阴影在页面刷新时也正确
     * ============================================================ */
    updateNavbarShadow();

})();

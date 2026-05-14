/**
 * gallery.js — 图片灯箱画廊
 * 负责：打开/关闭灯箱 · 前后切换图片 · 键盘导航 · 移动端触摸滑动
 */

;(function () {
    'use strict';

    /* ============================================================
     * 一、DOM 元素引用
     * ============================================================ */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const backdrop = document.querySelector('.lightbox-backdrop');
    const galleryItems = document.querySelectorAll('.gallery-item:not(.gallery-placeholder)');

    if (!lightbox || !galleryItems.length) return; // 无灯箱或画廊则退出

    /* ============================================================
     * 二、画廊数据收集
     * — 从 .gallery-item 的 data 属性和 img 标签中提取图片信息
     * ============================================================ */

    /** @type {{ src: string, alt: string, caption: string }[]} */
    const galleryData = [];

    galleryItems.forEach(function (item, index) {
        const img = item.querySelector('.gallery-img');
        const captionEl = item.querySelector('.gallery-caption');
        if (!img) return;

        galleryData.push({
            src: img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || '作品 ' + (index + 1),
            caption: captionEl ? captionEl.textContent.trim() : ''
        });
    });

    if (!galleryData.length) return;

    /** 当前显示的图片索引 */
    let currentIndex = 0;

    /* ============================================================
     * 三、灯箱开关逻辑
     * ============================================================ */

    /**
     * 打开灯箱到指定索引
     * @param {number} index
     */
    function openLightbox(index) {
        if (index < 0 || index >= galleryData.length) return;
        currentIndex = index;
        updateLightboxContent();
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        // 锁定页面滚动
        document.body.style.overflow = 'hidden';
    }

    /**
     * 关闭灯箱
     */
    function closeLightbox() {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // 延时清除图片 src 以释放内存（等过渡动画结束）
        setTimeout(function () {
            lightboxImg.src = '';
            lightboxImg.alt = '';
            lightboxCaption.textContent = '';
        }, 400);
    }

    /**
     * 更新灯箱中显示的图片内容
     */
    function updateLightboxContent() {
        const item = galleryData[currentIndex];
        if (!item) return;

        // 添加淡入效果
        lightboxImg.style.opacity = '0';
        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt;
        lightboxCaption.textContent = item.caption;

        // 图片加载完成后淡入
        lightboxImg.onload = function () {
            lightboxImg.style.opacity = '1';
        };
        // 兜底：如果图片已缓存，onload 可能不触发，延迟设置
        if (lightboxImg.complete) {
            lightboxImg.style.opacity = '1';
        }
    }

    /* ============================================================
     * 四、切换上一张 / 下一张
     * ============================================================ */

    /**
     * 切换到上一张（循环到末尾）
     */
    function showPrev() {
        currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
        updateLightboxContent();
    }

    /**
     * 切换到下一张（循环到开头）
     */
    function showNext() {
        currentIndex = (currentIndex + 1) % galleryData.length;
        updateLightboxContent();
    }

    /* ============================================================
     * 五、事件绑定
     * ============================================================ */

    // 点击画廊卡片打开灯箱
    galleryItems.forEach(function (item, index) {
        const card = item.querySelector('.gallery-card');
        if (!card) return;

        card.addEventListener('click', function () {
            openLightbox(index);
        });
    });

    // 关闭按钮
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }

    // 点击半透明背景关闭
    if (backdrop) {
        backdrop.addEventListener('click', closeLightbox);
    }

    // 上一张 / 下一张按钮
    if (prevBtn) {
        prevBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            showPrev();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            showNext();
        });
    }

    /* ============================================================
     * 六、键盘导航
     * — ← 上一张  ·  → 下一张  ·  Escape 关闭
     * ============================================================ */
    document.addEventListener('keydown', function (e) {
        // 仅在灯箱打开时处理键盘事件
        if (!lightbox.classList.contains('open')) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                closeLightbox();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                showPrev();
                break;
            case 'ArrowRight':
                e.preventDefault();
                showNext();
                break;
        }
    });

    /* ============================================================
     * 七、移动端触摸滑动支持
     * — 左滑下一张，右滑上一张
     * ============================================================ */
    let touchStartX = 0;
    let touchStartY = 0;

    lightbox.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    lightbox.addEventListener('touchend', function (e) {
        if (!e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;

        // 水平滑动距离大于 50px 且大于垂直滑动距离时触发切换
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                showPrev(); // 右滑 = 上一张
            } else {
                showNext(); // 左滑 = 下一张
            }
        }
    });

    /* ============================================================
     * 八、预加载相邻图片
     * — 打开灯箱后预先加载前后图片以加速切换
     * ============================================================ */
    const preloadCache = new Set();

    function preloadImage(index) {
        if (index < 0 || index >= galleryData.length) return;
        const src = galleryData[index].src;
        if (preloadCache.has(src)) return;

        const img = new Image();
        img.src = src;
        preloadCache.add(src);
    }

    // 每次切换后预加载相邻图片
    const originalUpdate = updateLightboxContent;
    updateLightboxContent = function () {
        originalUpdate();
        preloadImage(currentIndex - 1);
        preloadImage(currentIndex + 1);
    };

})();

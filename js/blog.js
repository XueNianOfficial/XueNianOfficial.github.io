/**
 * blog.js — 博客动态加载
 * 负责：从 data/blog.json 异步加载数据 · 渲染时间线列表 · 按年份分组
 */

;(function () {
    'use strict';

    /* ============================================================
     * 一、DOM 元素引用
     * ============================================================ */
    const blogContainer = document.getElementById('blog-container');
    if (!blogContainer) return; // 页面上无博客容器则退出

    /* ============================================================
     * 二、加载博客数据
     * — 从 data/blog.json 异步获取
     * — 加载失败时显示占位提示
     * ============================================================ */

    /**
     * 获取博客数据
     * @returns {Promise<Array>}
     */
    async function fetchBlogData() {
        try {
            const response = await fetch('data/blog.json');
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            const data = await response.json();
            return data;
        } catch (err) {
            console.warn('博客数据加载失败:', err.message);
            return null;
        }
    }

    /* ============================================================
     * 三、渲染博客列表
     * ============================================================ */

    /**
     * 将博客数据渲染为 HTML 并插入容器
     * @param {Array} blogData - 博客条目数组
     */
    function renderBlog(blogData) {
        if (!blogData || !blogData.length) {
            showPlaceholder('暂无动态，敬请期待～ ✨');
            return;
        }

        // 按年份分组
        const grouped = groupByYear(blogData);

        let html = '';

        // 遍历每个年份组
        Object.keys(grouped)
            .sort((a, b) => b - a) // 年份从新到旧排序
            .forEach(function (year) {
                html += '<div class="blog-year-group">';
                html += '<h3 class="blog-year-title">' + escapeHtml(String(year)) + ' 年</h3>';

                grouped[year].forEach(function (item) {
                    html += renderBlogItem(item);
                });

                html += '</div>';
            });

        blogContainer.innerHTML = html;
    }

    /**
     * 按年份分组
     * @param {Array} data
     * @returns {Object} - { '2026': [...], '2025': [...] }
     */
    function groupByYear(data) {
        var groups = {};
        data.forEach(function (item) {
            var year = item.date ? item.date.substring(0, 4) : '未知';
            if (!groups[year]) {
                groups[year] = [];
            }
            groups[year].push(item);
        });
        return groups;
    }

    /**
     * 渲染单条博客条目为 HTML 字符串
     * @param {{ date: string, title: string, summary: string, tags: string[] }} item
     * @returns {string}
     */
    function renderBlogItem(item) {
        var dateFormatted = formatDate(item.date);
        var tagsHtml = '';
        if (item.tags && item.tags.length) {
            tagsHtml = '<div class="blog-item-tags">' +
                item.tags.map(function (t) {
                    return '<span class="tag">' + escapeHtml(t) + '</span>';
                }).join('') +
                '</div>';
        }

        return '' +
            '<article class="blog-item reveal">' +
                '<time class="blog-item-date" datetime="' + escapeHtml(item.date || '') + '">' +
                    '📅 ' + escapeHtml(dateFormatted) +
                '</time>' +
                '<h4 class="blog-item-title">' + escapeHtml(item.title || '') + '</h4>' +
                '<p class="blog-item-summary">' + escapeHtml(item.summary || '') + '</p>' +
                tagsHtml +
            '</article>';
    }

    /**
     * 格式化日期：YYYY-MM-DD → 更适合阅读的格式
     * @param {string} dateStr
     * @returns {string}
     */
    function formatDate(dateStr) {
        if (!dateStr) return '未知日期';
        // 简单处理：2026-05-10 → 2026年5月10日
        var parts = dateStr.split('-');
        if (parts.length === 3) {
            return parts[0] + '年' + parseInt(parts[1], 10) + '月' + parseInt(parts[2], 10) + '日';
        }
        return dateStr;
    }

    /**
     * 显示占位文本
     * @param {string} message
     */
    function showPlaceholder(message) {
        blogContainer.innerHTML =
            '<div class="blog-placeholder">' +
                '<p>' + escapeHtml(message) + '</p>' +
            '</div>';
    }

    /**
     * HTML 转义，防止 XSS
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        if (!str) return '';
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(str).replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    /* ============================================================
     * 四、启动加载
     * ============================================================ */

    // 页面加载完成后异步加载并渲染博客
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAndRender);
    } else {
        loadAndRender();
    }

    async function loadAndRender() {
        // 显示加载中状态
        blogContainer.innerHTML =
            '<div class="blog-placeholder">' +
                '<p>正在加载动态...</p>' +
            '</div>';

        const data = await fetchBlogData();
        renderBlog(data);

        // 重新触发滚动动画观察（因为新插入了带 .reveal 的元素）
        // animations.js 中的 Observer 会在元素插入后自动检测，
        // 但如果 Observer 已经初始化过了，新元素需要重新观察。
        // 这里我们手动为新元素添加 .visible 或者依赖 animations.js 的重新初始化。
        // 由于 blog.js 在 animations.js 之后加载，我们需要通知 animations 重新扫描。
        if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('blog-rendered'));
        }
    }

})();

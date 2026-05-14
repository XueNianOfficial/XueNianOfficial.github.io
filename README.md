# 🐾 雪年的小窝

## 📁 项目结构

```
XueNianOfficial.github.io/
├── index.html              # 主页面（导航/Hero/关于我/画廊/博客/友链/页脚）
├── 404.html                # 自定义 404 页面
├── README.md               # 项目文档
├── css/
│   └── style.css           # 主样式表（~700行，含浅色&暗色主题、响应式）
├── js/
│   ├── main.js             # 核心逻辑（主题切换/菜单/导航/回到顶部/加载屏）
│   ├── animations.js       # 动画系统（滚动揭示 + Canvas 爪印粒子）
│   ├── gallery.js          # 图片灯箱（打开/切换/键盘/触摸滑动）
│   └── blog.js             # 博客动态加载（异步请求 + 模板渲染）
├── data/
│   └── blog.json           # 博客动态示例数据
└── res/
    └── images/
        ├── logo.png        # 网站 Logo
        ├── 头像.png        # 个人头像
        ├── 立绘.png        # 角色立绘（Hero 主视觉）
        └── 稿件1.png        # 作品稿件
```

## 🚀 本地预览

项目为纯静态页面，无需安装依赖或构建工具：

```bash
# 方法一：直接用浏览器打开
# 双击 index.html 即可在浏览器中查看

# 方法二：使用任意静态文件服务器
# Python 3
python -m http.server 8000

# Node.js (需要先安装 http-server)
npx http-server -p 8000

# 然后访问 http://localhost:8000
```

## 🌐 部署到 GitHub Pages

1. 将代码推送到 `<你的用户名>.github.io` 仓库的 `main` 分支
2. 进入仓库 **Settings → Pages**
3. **Source** 选择 `Deploy from a branch`
4. **Branch** 选择 `main`，目录选择 `/ (root)`
5. 点击 **Save**，等待几分钟后访问 `https://<你的用户名>.github.io`

> GitHub Pages 会自动识别 `404.html` 作为自定义 404 页面。

## 🎨 自定义指南

### 修改个人信息
编辑 `index.html`，替换：
- Hero 区：昵称、简介、立绘图片路径
- 关于我：头像、自我介绍文本、社交链接
- 友链：替换 `#` 为真实链接

### 添加作品图片
1. 将图片放入 `res/images/`
2. 在 `index.html` 的 `#gallery-grid` 中复制 `.gallery-item` 结构
3. `js/gallery.js` 会自动收集所有 `.gallery-item:not(.gallery-placeholder)` 作为灯箱数据源

### 修改博客内容
编辑 `data/blog.json`，按照已有格式添加/修改条目即可。

### 调整配色
编辑 `css/style.css` 开头的 CSS 变量（`:root` 和 `[data-theme="dark"]`）：
- `--color-primary`: 主题蓝色
- `--bg-primary`: 主背景色
- `--text-primary`: 主文字色

## 🛠️ 技术栈

- **HTML5** — 语义化标签，无障碍访问（ARIA）
- **CSS3** — 自定义属性（变量）、Grid/Flexbox、动画、响应式
- **Vanilla JavaScript (ES6+)** — 无任何第三方库
- **Canvas API** — 粒子系统渲染
- **Intersection Observer API** — 滚动动画
- **GitHub Pages** — 静态托管

## 📝 License

Commons Clause

---


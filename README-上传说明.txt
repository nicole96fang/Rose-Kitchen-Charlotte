芳芳的小厨房日记 — PWA 升级补丁

本 ZIP 是“覆盖/新增文件补丁”，不是完整源码包。
它保留原本的 app.js、store.js、styles.css、食谱数据结构与设计。

请在 GitHub 仓库根目录上传并覆盖/新增以下文件：

新增：
- manifest.webmanifest
- sw.js

覆盖：
- index.html
- src/main.js

不要删除或覆盖：
- src/app.js
- src/store.js
- src/styles.css
- assets/ 里的任何图片或字体

安装前重要提醒：
1. 先在现有 Safari 版「我的」页面导出一份食谱备份（最好选含照片的完整版）。
2. 不要清除 Safari 网站数据，也不要删除旧版网页。
3. 上传完成并等待 GitHub Pages 部署后，先用 Safari 打开网站测试。
4. iPhone Safari：点分享按钮 → 加入主屏幕 → 开启“作为网页 App 打开”（若有显示）。
5. 第一次在主屏幕打开后，检查食谱是否齐全；若没有，使用「我的」里的恢复/导入功能恢复备份。

PWA 说明：
- 保留原有页面设计和功能。
- 提供可安装的 Web App manifest。
- Service Worker 会缓存应用外壳及已访问的同源静态资源，支持离线打开已缓存内容。
- 更新缓存版本时会清除本应用旧缓存，不会清除 IndexedDB / localStorage 食谱资料。
- 离线模式不代表首次从未访问过的图片也能显示；图片会在联网访问后逐步进入缓存。

保存问题检查：
现有 src/store.js 已包含 IndexedDB、localStorage 备用储存，以及照片过大时保留食谱文字的降级策略；src/app.js 保存后也会提示实际储存状态。本补丁不更改这些现有保存逻辑，避免误伤现有食谱资料。

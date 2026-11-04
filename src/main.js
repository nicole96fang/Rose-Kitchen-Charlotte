import "./app.js?v=9";

// PWA：只在 HTTPS / localhost 环境注册 Service Worker。
// 使用 import.meta.url 计算 GitHub Pages 子目录，避免误注册到网站根目录。
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const appBase = new URL("../", import.meta.url);
    const workerUrl = new URL("sw.js", appBase);

    navigator.serviceWorker
      .register(workerUrl.href, {
        scope: appBase.pathname,
        updateViaCache: "none"
      })
      .then(registration => {
        // 页面再次打开时检查更新，不打断正在编辑的食谱。
        registration.update().catch(() => {});
      })
      .catch(error => {
        console.warn("PWA 离线功能暂时无法启用：", error);
      });
  });
}

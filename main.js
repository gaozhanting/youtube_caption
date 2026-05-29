(function () {
    createDom();

    createCaptionUpdateObserver();

    // 💡 核心自動化：監聽 YouTube 的影片切換事件，每次換片都重新檢查並注入
    document.addEventListener('yt-navigate-finish', injectGhostButton);

    // 備用初始化檢查
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        injectGhostButton();
    } else {
        document.addEventListener('DOMContentLoaded', injectGhostButton);
    }

    // 防止 YouTube 延遲加載控制列的定時定錨
    const ghostInterval = setInterval(() => {
        if (document.querySelector('.ytp-right-controls')) {
            injectGhostButton();
            clearInterval(ghostInterval);
        }
    }, 1000);
})();
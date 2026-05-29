(function () {
    // 1. 清理舊的實例 (方便在 Console 重複執行測試)
    const existingContainer = document.getElementById('ghost-floating-caption');
    const existingStyle = document.getElementById('ghost-floating-style');
    if (existingContainer) existingContainer.remove();
    if (existingStyle) existingStyle.remove();

    if (window.ghostObserverV35) {
        window.ghostObserverV35.disconnect();
    }

    // 3. 建立 DOM 結構
    const container = document.createElement('div');
    container.id = 'ghost-floating-caption';

    const dragHandle = document.createElement('div');
    dragHandle.id = 'ghost-drag-handle';

    const inner = document.createElement('div');
    inner.id = 'ghost-inner-content';

    container.appendChild(dragHandle);
    container.appendChild(inner);
    document.body.appendChild(container);

    // 4. 滑鼠拖曳邏輯 (Dragging)
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = container.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        e.preventDefault(); // 防止拖動時意外反白文字
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        // 切換為絕對座標定位，覆寫預設的 bottom/right
        container.style.left = `${initialLeft + dx}px`;
        container.style.top = `${initialTop + dy}px`;
        container.style.bottom = 'auto';
        container.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // 5. 字幕抓取與更新邏輯 (完全保留你的 V35 邏輯)
    let fullText = "";
    let lastProcessedText = "";

    const updateText = (newInput) => {
        if (!newInput || newInput === lastProcessedText) return;
        if (newInput.startsWith(lastProcessedText)) {
            let added = newInput.substring(lastProcessedText.length);
            if (added) {
                if (fullText.length > 0 && !fullText.endsWith(' ') && !added.startsWith(' ')) {
                    fullText += " ";
                }
                fullText += added;
            }
        } else {
            const recentTail = fullText.slice(-150);
            if (!recentTail.includes(newInput)) {
                fullText += (fullText.length > 0 ? "  " : "") + newInput;
            }
        }
        lastProcessedText = newInput;
        inner.textContent = fullText;
        // 改為讓懸浮窗內部的 div 滾動到底部
        inner.scrollTop = inner.scrollHeight;
    };

    const grabAction = () => {
        const segments = document.querySelectorAll('.ytp-caption-segment');
        if (segments.length === 0) return;
        const currentRaw = Array.from(segments).map(s => s.innerText).join(' ').replace(/\s+/g, ' ').trim();
        updateText(currentRaw);
    };

    const target = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    if (target) {
        window.ghostObserverV35 = new MutationObserver(grabAction);
        window.ghostObserverV35.observe(target, { childList: true, subtree: true });
        console.log("🎯 [Floating V1] 懸浮字幕框已就緒！(可拖曳頂部深色區域)");
    } else {
        console.log("⚠️ 找不到 YouTube 播放器元素，請確認是否在影片頁面。");
    }

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
(function () {
    // 1. 清理舊的實例 (方便在 Console 重複執行測試)
    const existingContainer = document.getElementById('ghost-floating-caption');
    const existingStyle = document.getElementById('ghost-floating-style');
    if (existingContainer) existingContainer.remove();
    if (existingStyle) existingStyle.remove();

    if (window.ghostObserverV35) {
        window.ghostObserverV35.disconnect();
    }

    // 2. 注入 CSS
    const style = document.createElement('style');
    style.id = 'ghost-floating-style';
    style.textContent = `
        /* 讓 YouTube 原生的字幕容器完全透明，解決雙字幕重複的干擾 */
        .ytp-caption-window-container {
            opacity: 0 !important;
            pointer-events: none !important;
        }
        #ghost-floating-caption {
            position: fixed;
            bottom: 80px;
            right: 40px;
            width: 550px;
            height: 270px;
            background: rgba(0, 0, 0, 1);
            border-radius: 8px; /* 賦予獨立視窗的圓角質感 */
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            z-index: 999999; /* 確保浮在 YouTube 介面最上層 */
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.08);
        }
        #ghost-drag-handle {
            height: 24px;
            background: #111111;
            width: 100%;
            flex-shrink: 0;
            cursor: grab;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #ghost-drag-handle:active {
            cursor: grabbing;
        }
        /* 視覺清晰的拖曳提示小橫條 */
        #ghost-drag-handle::before {
            content: "";
            width: 32px;
            height: 4px;
            background: rgba(255,255,255,0.2);
            border-radius: 2px;
        }
        #ghost-inner-content {
            padding: 25px 28px 30px 28px; /* 嚴格遵循你的底部 30px 與側邊 28px 設定 */
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;

            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 18px;
            font-weight: 300;
            letter-spacing: -0.2px;
            line-height: 1.5;

            /* 保持柔和亮度的黑魔法 */
            color: rgba(255, 255, 255, 1);

            white-space: pre-wrap;
            word-break: break-word;
            text-align: left;
            overflow-y: auto;
            -webkit-user-select: text; /* 允許滑鼠選取與複製 */
            user-select: text;
        }
        /* 隱藏原生滾動條，保持幽靈般的視覺純淨 */
        #ghost-inner-content::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }
    `;
    document.head.appendChild(style);

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

    // ==================== 右下角精準定位補丁 ====================
    container.style.position = 'absolute';
    container.style.bottom = '10px';  /* 💡 數值越小越靠到底部（原本如果是 10% 或 80px，改小它） */
    container.style.right = '10px';   /* 💡 數值越小越靠到最右邊 */

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


    // 6. 核心：將自訂開關按鈕注入到右側控制列（設定按鈕的左邊）
    // ==================== 終極純 JS 鎖定補丁（直接替換第 6 步） ====================
    // ==================== 100% 免疫不消失！純文字完美居中補丁 ====================

    // =====================================================================
    // 🎯 部分 B：自動注入 UI 控制按鈕（已完美鎖定文字 G 居中、無背景、無藍框）
    // =====================================================================
    function injectGhostButton() {
        // 防止重複注入
        if (document.getElementById('ghost-toggle-btn')) return;

        const rightControls = document.querySelector('.ytp-right-controls');
        if (!rightControls) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'ghost-toggle-btn';
        toggleBtn.className = 'ytp-button';

        // 直接把內容填入純文字 "G"
        toggleBtn.textContent = 'G';

        // 💡 用純 CSS 鎖定字體外觀與強力 Flex 居中
        toggleBtn.style.cssText = `
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        vertical-align: top !important;
        background: transparent !important; /* 拔除背景 */
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 6px !important;
        width: 36px !important;
        height: 36px !important;
        cursor: pointer !important;
        
        /* 🎨 字體高級感核心：使用原生的 YouTube 粗體字型 */
        font-family: "YouTube Sans", "Roboto", "Arial", sans-serif !important;
        font-size: 19px !important;
        font-weight: 700 !important; /* 粗體 */
        line-height: 1 !important;
        
        /* 🎯【垂直微調核心】：如果因為瀏覽器字體渲染導致上下不對稱，
           可以自由微調下面這行 padding（例如 1px 或 0px）來完美對齊左邊 */
        padding-bottom: 1px !important; 
        
        transition: opacity 0.15s ease, color 0.15s ease !important;
    `;

        // 初始化狀態（預設開啟：紅燈）
        let isCaptionVisible = true;
        toggleBtn.style.color = '#ff0000';
        toggleBtn.style.opacity = '1';

        // 用 JS 接管 Hover 狀態
        toggleBtn.addEventListener('mouseenter', () => {
            if (!isCaptionVisible) toggleBtn.style.opacity = '1';
        });
        toggleBtn.addEventListener('mouseleave', () => {
            if (!isCaptionVisible) toggleBtn.style.opacity = '0.6';
        });

        // 點擊切換：開啟紅燈，關閉變原生控制欄的白字
        toggleBtn.addEventListener('click', () => {
            isCaptionVisible = !isCaptionVisible;
            if (typeof container !== 'undefined') {
                container.style.display = isCaptionVisible ? 'flex' : 'none';
            }

            toggleBtn.style.color = isCaptionVisible ? '#ff0000' : '#ffffff';
            toggleBtn.style.opacity = isCaptionVisible ? '1' : '0.6';
        });

        // 插入 YouTube 控制列
        const settingsBtn = rightControls.querySelector('.ytp-settings-button');
        if (settingsBtn) {
            settingsBtn.parentNode.insertBefore(toggleBtn, settingsBtn);
        } else {
            rightControls.prepend(toggleBtn);
        }
        console.log("🔘 [G-CC] 免疫版純文字按鈕已完美嵌入。");
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


// =====================================================================
// ⌨️ 全域快捷鍵：按下「G」鍵秒切換自訂字幕（仿 YouTube 內建 C 鍵）
// =====================================================================
document.addEventListener('keydown', (e) => {
    // 🛑 安全閥：如果使用者當前游標在輸入框（搜尋欄、留言區、聊天室），直接跳過不執行
    const activeEl = document.activeElement;
    if (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
    ) {
        return; 
    }

    // 🎯 檢查按下的按鍵是否為 'g' 或 'G'
    if (e.key === 'g' || e.key === 'G') {
        const toggleBtn = document.getElementById('ghost-toggle-btn');
        if (toggleBtn) {
            e.preventDefault(); // 阻止瀏覽器可能產生的預設行為
            toggleBtn.click();  // 🎯 核心：直接模擬點擊右下角的 G 按鈕
        }
    }
});
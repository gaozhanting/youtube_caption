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
            background: rgba(0, 0, 0, 0.90);
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
    const rightControls = document.querySelector('.ytp-right-controls');
    if (rightControls) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'ghost-toggle-btn';
        toggleBtn.setAttribute('title', '開關幽靈懸浮字幕');

        const btnBox = document.createElement('span');
        btnBox.className = 'ghost-btn-box';
        btnBox.textContent = 'G-CC';
        toggleBtn.appendChild(btnBox);

        let isCaptionVisible = true;
        toggleBtn.addEventListener('click', () => {
            isCaptionVisible = !isCaptionVisible;
            container.style.display = isCaptionVisible ? 'flex' : 'none';
            toggleBtn.classList.toggle('is-active', isCaptionVisible);
        });

        // 尋找設定按鈕作為錨點，如果找不到就直接 prepend 塞到最前面
        const settingsBtn = rightControls.querySelector('.ytp-settings-button');
        if (settingsBtn) {
            settingsBtn.parentNode.insertBefore(toggleBtn, settingsBtn);
        } else {
            rightControls.prepend(toggleBtn);
        }
        console.log("🔘 [G-CC] 開關按鈕已成功嵌入右側控制列。");
    } else {
        console.log("⚠️ 找不到右側控制列容器。");
    }
})();
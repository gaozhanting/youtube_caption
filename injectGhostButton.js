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
        // 1. ⚡ 隨按隨抓：點擊的瞬間，才去網頁上找這個大盒子
        const container = document.getElementById('ghost-floating-caption');

        if (!container) {
            console.error("❌ 找不到字幕盒子，無法切換顯示狀態！");
            return;
        }

        // 🎯 核心優化：直接用按鈕的狀態變數來當裁判，最誠實，絕對不會因為空字串出錯
        container.style.display = isCaptionVisible ? 'flex' : 'none';

        // 按鈕視覺反饋
        toggleBtn.style.color = isCaptionVisible ? '#ff0000' : '#ffffff';
        toggleBtn.style.opacity = isCaptionVisible ? '1' : '0.6';

        console.log(`👻 按鈕切換成功：字幕當前已 ${isCaptionVisible ? '開啟' : '關閉'}`);
    });

    // 插入 YouTube 控制列
    const settingsBtn = rightControls.querySelector('.ytp-settings-button');
    if (settingsBtn) {
        settingsBtn.parentNode.insertBefore(toggleBtn, settingsBtn);
    } else {
        rightControls.prepend(toggleBtn);
    }
    console.log("🔘 [G-CC] 免疫版純文字按鈕已完美嵌入。");

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
}
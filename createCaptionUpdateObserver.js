function createCaptionUpdateObserver() {
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

        const inner = document.getElementById('ghost-inner-content');
        if (!inner) {
            console.error("❌ 找不到字幕內容區域，無法更新文字！");
            return;
        }
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
        if (window.ghostObserverV35) {
            window.ghostObserverV35.disconnect();
        }
        window.ghostObserverV35 = new MutationObserver(grabAction);
        window.ghostObserverV35.observe(target, { childList: true, subtree: true });
        console.log("🎯 [Floating V1] 懸浮字幕框已就緒！(可拖曳頂部深色區域)");
    } else {
        console.log("⚠️ 找不到 YouTube 播放器元素，請確認是否在影片頁面。");
    }
}
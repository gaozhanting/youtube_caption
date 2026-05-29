function createDom() {
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

        // 🎯 核心修復：拖曳時必須拔除 CSS 的居中 transform，否則滑鼠座標會對不准
        container.style.transform = 'none';

        // 切換為絕對座標定位，覆寫預設的 bottom/right
        container.style.left = `${initialLeft + dx}px`;
        container.style.top = `${initialTop + dy}px`;
        container.style.bottom = 'auto';
        container.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}
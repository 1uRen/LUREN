// chat-plus module
function handleChatToolClick(toolName) {
    if (toolName === '图片') {
        openMockImageModal();
        return;
    }
    if (toolName === '表情') {
        toggleStickerPanel();
        return;
    }
    if (toolName === '相机') {
        openCameraImagePicker();
        return;
    }
    if (toolName === '加号') {
        togglePlusPanel();
        return;
    }
    alert(`${toolName}功能开发中`);
}

function togglePlusPanel(forceOpen) {
    state.stickerPanelOpen = false;
    const wasClosed = !state.plusPanelOpen;
    if (typeof forceOpen === 'boolean') {
        state.plusPanelOpen = forceOpen;
    } else {
        state.plusPanelOpen = !state.plusPanelOpen;
    }
    if (state.plusPanelOpen && wasClosed) {
        state.autoScrollNext = true;
    }
    initChatApp();
}

function closePlusPanel() {
    state.plusPanelOpen = false;
    initChatApp();
}

function handleVoiceCall() {
    closePlusPanel();
    alert('语音通话功能开发中');
}

function handleVideoCall() {
    closePlusPanel();
    alert('视频通话功能开发中');
}

function handleRedPacket() {
    closePlusPanel();
    alert('红包功能开发中');
}

function handleTransfer() {
    closePlusPanel();
    alert('转账功能开发中');
}

function handleFavorite() {
    closePlusPanel();
    alert('收藏功能开发中');
}

function handleLocation() {
    closePlusPanel();
    alert('位置共享功能开发中');
}

function handleFileSend() {
    closePlusPanel();
    alert('文件发送功能开发中');
}

function handleChatGlobalClick(event) {
    const target = event?.target;
    if (!target) return;
    if (target.closest('.chat-modal')) return;
    if (target.closest('.chat-input')) return;

    let shouldRender = false;

    if (state.stickerPanelOpen) {
        if (target.closest('.sticker-sheet')) return;
        if (target.closest('.chat-tool-btn')) return;
        state.stickerPanelOpen = false;
        shouldRender = true;
    }

    if (state.plusPanelOpen) {
        if (target.closest('.plus-sheet')) return;
        if (target.closest('.chat-tool-btn')) return;
        state.plusPanelOpen = false;
        shouldRender = true;
    }

    if (shouldRender) {
        initChatApp();
    }
}

window.handleChatToolClick = handleChatToolClick;
window.handleChatGlobalClick = handleChatGlobalClick;

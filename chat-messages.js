// chat-messages module
function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = (input?.value || '').trim();
    if (!text) return;
    
    const chat = state.chats.find(c => c.contact.qqId === state.currentChatContact.qqId);
    if (chat) {
        const quote = state.replyingQuote ? { ...state.replyingQuote } : null;
        chat.messages.push({
            text: text,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            isMine: true,
            quotedMessage: quote
        });
        markChatActivity(chat);
    }
    
    saveStateToStorage();
    input.value = '';
    state.chatInputStickerSuggestKeyword = '';
    state.replyingQuote = null;
    state.keepChatInputFocusNextRender = true;
    state.autoScrollNext = true;
    initChatApp();
}

function setChatInputComposing(isComposing) {
    state.chatInputComposing = !!isComposing;
}

function updateChatInputStickerSuggest(value, selectionStart = null, selectionEnd = null, shouldRender = true) {
    state.chatInputStickerSuggestKeyword = value || '';
    state.chatInputSelectionStart = Number.isInteger(selectionStart) ? selectionStart : null;
    state.chatInputSelectionEnd = Number.isInteger(selectionEnd) ? selectionEnd : null;
    
    // 移动端优化：只有当贴纸建议变化时才重新渲染，避免频繁触发
    const hasStickerKeyword = (value || '').trim().length > 0;
    if (!shouldRender || state.chatInputComposing) return;
    
    // 使用防抖避免频繁渲染
    if (window.stickerSuggestDebounceTimer) {
        clearTimeout(window.stickerSuggestDebounceTimer);
    }
    window.stickerSuggestDebounceTimer = setTimeout(() => {
        if (!state.chatInputComposing) {
            state.keepChatInputFocusNextRender = true;
            initChatApp();
        }
    }, 200);
}

function handleChatInputChange(value, selectionStart = null, selectionEnd = null, eventIsComposing = false) {
    // 只要不是正在输入，就更新，但渲染使用防抖
    updateChatInputStickerSuggest(value, selectionStart, selectionEnd, false);
}

function handleChatInputKeyup(value, selectionStart = null, selectionEnd = null, keyCode = 0, eventIsComposing = false) {
    if (eventIsComposing || Number(keyCode) === 229 || state.chatInputComposing) return;
    updateChatInputStickerSuggest(value, selectionStart, selectionEnd, true);
}

function handleChatInputKeydown(event) {
    if (!event) return;
    if (event.keyCode === 13) {
        event.preventDefault();
        sendMessage();
    }
}

function sendStickerFromSuggestion(stickerId) {
    state.chatInputStickerSuggestKeyword = '';
    state.keepChatInputFocusNextRender = true;
    sendStickerMessage(stickerId);
}

function openMockVoiceModal() {
    state.showMockVoiceModal = true;
    initChatApp();
    setTimeout(() => {
        document.getElementById('mockVoiceInput')?.focus();
    }, 0);
}

function closeMockVoiceModal() {
    state.showMockVoiceModal = false;
    state.mockVoiceText = '';
    initChatApp();
}

function updateMockVoiceText(text) {
    state.mockVoiceText = text || '';
}

function sendMockVoiceMessage() {
    const text = (state.mockVoiceText || document.getElementById('mockVoiceInput')?.value || '').trim();
    if (!text) {
        alert('请输入模拟语音内容');
        return;
    }

    const chat = getChatByContactId(state.currentChatContact?.qqId);
    if (!chat) return;

    chat.messages.push({
        text,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        isMockVoice: true,
        showVoiceText: false
    });
    markChatActivity(chat);

    saveStateToStorage();
    state.showMockVoiceModal = false;
    state.mockVoiceText = '';
    initChatApp();
}

function toggleMockVoiceText(index) {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    if (!chat || !chat.messages[index] || !chat.messages[index].isMockVoice) return;
    chat.messages[index].showVoiceText = !chat.messages[index].showVoiceText;
    if (state.messageSelectMode && typeof markChatScrollPreserve === 'function') {
        markChatScrollPreserve();
    }
    saveStateToStorage();
    initChatApp();
}

function openMockImageModal() {
    state.showMockImageModal = true;
    initChatApp();
    setTimeout(() => {
        document.getElementById('mockImageInput')?.focus();
    }, 0);
}

function closeMockImageModal() {
    state.showMockImageModal = false;
    state.mockImageText = '';
    initChatApp();
}

function updateMockImageText(text) {
    state.mockImageText = text || '';
}

function sendMockImageMessage() {
    const text = (state.mockImageText || document.getElementById('mockImageInput')?.value || '').trim();
    if (!text) {
        alert('请输入模拟图片描述');
        return;
    }

    const chat = getChatByContactId(state.currentChatContact?.qqId);
    if (!chat) return;

    chat.messages.push({
        text,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        isMockImage: true
    });
    markChatActivity(chat);

    saveStateToStorage();
    state.showMockImageModal = false;
    state.mockImageText = '';
    state.autoScrollNext = true;
    initChatApp();
}

function openCameraImagePicker() {
    document.getElementById('cameraImageInput')?.click();
}

function onCameraImageSelected(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    if (!chat) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        chat.messages.push({
            text: file.name || '相机图片',
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            isMine: true,
            isCameraImage: true,
            imageData: e?.target?.result || ''
        });
        markChatActivity(chat);
        saveStateToStorage();
        state.autoScrollNext = true;
        initChatApp();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

let messageLongPressTimer = null;

function startMessageLongPress(event, messageIndex) {
    messageLongPressTimer = setTimeout(() => {
        const x = event.clientX || (event.touches && event.touches[0].clientX);
        const y = event.clientY || (event.touches && event.touches[0].clientY);
        showMessageContextMenuAt(x, y, messageIndex);
    }, 500);
}

function cancelMessageLongPress() {
    if (messageLongPressTimer) {
        clearTimeout(messageLongPressTimer);
        messageLongPressTimer = null;
    }
}

function getPhoneScreenBounds() {
    const margin = 8;
    const phone = document.querySelector('.iphone-container');
    if (!phone) {
        return {
            left: margin,
            right: window.innerWidth - margin,
            top: margin,
            bottom: window.innerHeight - margin
        };
    }
    const rect = phone.getBoundingClientRect();
    return {
        left: rect.left + margin,
        right: rect.right - margin,
        top: rect.top + margin,
        bottom: rect.bottom - margin
    };
}

function getMessageBubbleAnchor(messageIndex) {
    const item = document.querySelector(`.chat-fullscreen .message-item[data-message-index="${messageIndex}"]`);
    if (!item) return null;
    const bubble = item.querySelector('.message-bubble') || item;
    const rect = bubble.getBoundingClientRect();
    return {
        centerX: rect.left + rect.width / 2,
        topY: rect.top
    };
}

function showMessageContextMenuForMessage(messageIndex) {
    if (state.messageSelectMode) return;
    const menuWidth = 320;
    const bounds = getPhoneScreenBounds();
    const anchor = getMessageBubbleAnchor(messageIndex);
    const bubbleCenterX = anchor?.centerX ?? (bounds.left + bounds.right) / 2;
    let menuLeft = bubbleCenterX - menuWidth / 2;
    menuLeft = Math.max(bounds.left, Math.min(menuLeft, bounds.right - menuWidth));
    const anchorY = anchor?.topY ?? bounds.top + 120;

    state.messageContextMenu.show = true;
    state.messageContextMenu.messageIndex = messageIndex;
    state.messageContextMenu.anchorX = menuLeft;
    state.messageContextMenu.anchorY = anchorY;
    state.messageContextMenu.x = menuLeft;
    state.messageContextMenu.y = anchorY;
    initChatApp();
    requestAnimationFrame(() => adjustMessageContextMenuPosition(messageIndex));
}

function adjustMessageContextMenuPosition(messageIndex) {
    const menu = document.querySelector('.message-context-menu');
    const anchor = getMessageBubbleAnchor(messageIndex);
    if (!menu || !anchor) return;

    const bounds = getPhoneScreenBounds();
    const bubbleCenterX = anchor.centerX;
    let anchorY = anchor.topY;

    menu.style.top = `${anchorY}px`;

    let menuRect = menu.getBoundingClientRect();
    const menuWidth = menuRect.width;
    let menuLeft = bubbleCenterX - menuWidth / 2;
    menuLeft = Math.max(bounds.left, Math.min(menuLeft, bounds.right - menuWidth));
    menu.style.left = `${menuLeft}px`;

    menuRect = menu.getBoundingClientRect();
    let shiftY = 0;

    if (menuRect.top < bounds.top) shiftY = bounds.top - menuRect.top;
    if (shiftY) {
        menu.style.top = `${anchorY + shiftY}px`;
        menuRect = menu.getBoundingClientRect();
    }
    if (menuRect.bottom > bounds.bottom) {
        shiftY += bounds.bottom - menuRect.bottom;
        menu.style.top = `${anchorY + shiftY}px`;
        menuRect = menu.getBoundingClientRect();
    }

    menuLeft = bubbleCenterX - menuWidth / 2;
    menuLeft = Math.max(bounds.left, Math.min(menuLeft, bounds.right - menuWidth));
    menu.style.left = `${menuLeft}px`;
    menuRect = menu.getBoundingClientRect();

    const arrowPadding = 10;
    let arrowX = bubbleCenterX - menuRect.left;
    arrowX = Math.max(arrowPadding, Math.min(arrowX, menuRect.width - arrowPadding));
    menu.style.setProperty('--arrow-x', `${arrowX}px`);

    state.messageContextMenu.anchorX = menuLeft;
    state.messageContextMenu.anchorY = anchorY + shiftY;
}

function showMessageContextMenu(event, messageIndex) {
    event.preventDefault();
    showMessageContextMenuForMessage(messageIndex);
}

function showMessageContextMenuAt(x, y, messageIndex) {
    if (Number.isInteger(messageIndex)) {
        showMessageContextMenuForMessage(messageIndex);
        return;
    }
    if (state.messageSelectMode) return;
    state.messageContextMenu.show = true;
    state.messageContextMenu.messageIndex = null;
    state.messageContextMenu.anchorX = x;
    state.messageContextMenu.anchorY = y;
    state.messageContextMenu.x = x;
    state.messageContextMenu.y = y;
    initChatApp();
}

function hideMessageContextMenu(event) {
    let panelClosed = false;
    if (state.stickerPanelOpen) {
        const target = event?.target;
        if (target && !target.closest('.sticker-sheet') && !target.closest('.chat-tool-btn') && !target.closest('.chat-modal')) {
            state.stickerPanelOpen = false;
            panelClosed = true;
        }
    }
    if (state.plusPanelOpen) {
        const target = event?.target;
        if (target && !target.closest('.plus-sheet') && !target.closest('.chat-tool-btn') && !target.closest('.chat-modal')) {
            state.plusPanelOpen = false;
            panelClosed = true;
        }
    }
    if (event && event.target.closest('.message-context-menu')) return;
    if (!state.messageContextMenu.show && state.messageContextMenu.messageIndex === null) {
        cancelMessageLongPress();
        if (panelClosed) {
            initChatApp();
        }
        return;
    }
    state.messageContextMenu.show = false;
    state.messageContextMenu.messageIndex = null;
    cancelMessageLongPress();
    initChatApp();
}

function closeEditMessageModal() {
    state.editingMessageIndex = null;
    state.editingMessageText = '';
    state.editingMessageType = 'text';
}

function openEditMessage() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    const idx = state.messageContextMenu.messageIndex;
    const msg = chat?.messages?.[idx];
    if (!msg || msg.withdrawn) {
        hideMessageContextMenu();
        return;
    }

    state.editingMessageIndex = idx;
    state.editingMessageText = msg.isSticker ? (msg.stickerDesc || msg.text || '') : (msg.text || '');
    state.editingMessageType = msg.isSticker
        ? 'sticker'
        : (msg.isMockImage ? 'image' : (msg.isMockVoice ? 'voice' : 'text'));
    state.messageContextMenu.show = false;
    initChatApp();
}

function quoteMessage() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    const idx = state.messageContextMenu.messageIndex;
    const msg = chat?.messages?.[idx];
    if (!msg || msg.withdrawn) {
        hideMessageContextMenu();
        return;
    }

    const authorName = msg.isMine
        ? (state.currentUser?.nickname || '我')
        : (state.currentChatContact?.remark || state.currentChatContact?.name || '角色');
    state.replyingQuote = {
        text: String(msg.text || '').trim() || '(无内容)',
        author: authorName,
        messageIndex: idx,
        isSticker: !!msg.isSticker,
        isMockImage: !!msg.isMockImage,
        isCameraImage: !!msg.isCameraImage
    };
    state.messageContextMenu.show = false;
    state.messageContextMenu.messageIndex = null;
    initChatApp();
}

function copyMessage() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    const idx = state.messageContextMenu.messageIndex;
    const msg = chat?.messages?.[idx];
    if (!msg || msg.withdrawn) {
        hideMessageContextMenu();
        return;
    }

    const text = String(msg.text || '').trim();
    if (!text) {
        hideMessageContextMenu();
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        hideMessageContextMenu();
    }).catch(() => {
        hideMessageContextMenu();
    });
}

function clearReplyingQuote() {
    if (!state.replyingQuote) return;
    state.replyingQuote = null;
    initChatApp();
}

function saveEditedMessage() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    const idx = state.editingMessageIndex;
    const msg = chat?.messages?.[idx];
    if (!msg) return;

    const typeSelect = document.getElementById('editMessageType');
    if (typeSelect) {
        state.editingMessageType = typeSelect.value;
    }
    const textarea = document.getElementById('editMessageText');
    const text = (textarea?.value || state.editingMessageText || '').trim();
    if (!text) {
        alert('消息内容不能为空');
        return;
    }

    msg.isMockVoice = false;
    msg.isMockImage = false;
    msg.isSticker = false;
    msg.stickerUrl = '';
    msg.stickerDesc = '';
    msg.isCameraImage = false;
    msg.showVoiceText = false;

    if (state.editingMessageType === 'sticker') {
        const sticker = resolveStickerForRole(text);
        if (!sticker) {
            alert('表情库里找不到该描述，请检查或先在表情包中添加');
            return;
        }
        msg.text = sticker.desc || text;
        msg.stickerDesc = sticker.desc || text;
        msg.stickerUrl = sticker.url;
        msg.isSticker = true;
    } else if (state.editingMessageType === 'voice') {
        msg.text = text;
        msg.isMockVoice = true;
    } else if (state.editingMessageType === 'image') {
        msg.text = text;
        msg.isMockImage = true;
    } else {
        msg.text = text;
    }

    closeEditMessageModal();
    saveStateToStorage();
    initChatApp();
}

function withdrawMessage() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    const idx = state.messageContextMenu.messageIndex;
    const msg = chat?.messages?.[idx];
    if (!msg || msg.withdrawn || !msg.isMine) {
        hideMessageContextMenu();
        return;
    }

    msg.withdrawn = true;
    msg.withdrawnOriginal = msg.text || '';
    msg.showVoiceText = false;
    state.messageContextMenu.show = false;
    saveStateToStorage();
    initChatApp();
}

function openWithdrawContent(index) {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    const msg = chat?.messages?.[index];
    if (!msg || !msg.withdrawn || msg.isMine) return;
    state.viewingWithdrawMessage = msg.withdrawnOriginal || '(无内容)';
    initChatApp();
}

function closeWithdrawContent() {
    state.viewingWithdrawMessage = null;
    initChatApp();
}

function deleteMessage() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    const idx = state.messageContextMenu.messageIndex;
    if (!chat || idx === null || idx < 0 || idx >= chat.messages.length) {
        hideMessageContextMenu();
        return;
    }
    if (confirm('删除后无法恢复，且角色将无法读取该消息。确定删除吗？')) {
        chat.messages.splice(idx, 1);
        state.messageContextMenu.show = false;
        saveStateToStorage();
        initChatApp();
        return;
    }
    hideMessageContextMenu();
}

function getCurrentAssistantRoundRange(chat) {
    if (!chat || !Array.isArray(chat.messages) || !chat.messages.length) return null;

    let end = -1;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
        const msg = chat.messages[i];
        if (!msg || msg.withdrawn) continue;
        end = i;
        break;
    }
    if (end < 0) return null;

    const endMsg = chat.messages[end];
    if (!endMsg || endMsg.isMine) return null;

    let start = end;
    for (let i = end - 1; i >= 0; i--) {
        const msg = chat.messages[i];
        if (!msg || msg.withdrawn || msg.isMine) break;
        start = i;
    }
    return { start, end };
}

function reopenAssistantRound() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    const idx = state.messageContextMenu.messageIndex;
    if (!chat || idx === null || idx < 0 || idx >= chat.messages.length) {
        hideMessageContextMenu();
        return;
    }

    const selected = chat.messages[idx];
    const currentAssistantRound = getCurrentAssistantRoundRange(chat);
    const canReplayCurrentRound = !!selected && !selected.isMine && !selected.withdrawn
        && !!currentAssistantRound
        && idx >= currentAssistantRound.start
        && idx <= currentAssistantRound.end;
    if (!canReplayCurrentRound) {
        hideMessageContextMenu();
        return;
    }

    // 找到被选中角色消息所在“本轮”的起点（同一发送方连续消息）
    let roundStart = idx;
    while (roundStart - 1 >= 0) {
        const prev = chat.messages[roundStart - 1];
        if (!prev || prev.isMine !== selected.isMine) break;
        roundStart -= 1;
    }

    // 删除本轮及其后续全部消息（包含被选中的那条）
    chat.messages.splice(roundStart);
    chat.isTyping = false;
    state.messageContextMenu.show = false;
    state.messageContextMenu.messageIndex = null;
    saveStateToStorage();
    initChatApp();

    // 直接进入重新回复流程：显示加载动画并调用 API 生成
    receiveMessage();
}

window.sendMessage = sendMessage;
window.setChatInputComposing = setChatInputComposing;
window.handleChatInputChange = handleChatInputChange;
window.handleChatInputKeyup = handleChatInputKeyup;
window.handleChatInputKeydown = handleChatInputKeydown;
window.sendStickerFromSuggestion = sendStickerFromSuggestion;
window.openMockVoiceModal = openMockVoiceModal;
window.closeMockVoiceModal = closeMockVoiceModal;
window.updateMockVoiceText = updateMockVoiceText;
window.sendMockVoiceMessage = sendMockVoiceMessage;
window.toggleMockVoiceText = toggleMockVoiceText;
window.openMockImageModal = openMockImageModal;
window.closeMockImageModal = closeMockImageModal;
window.updateMockImageText = updateMockImageText;
window.sendMockImageMessage = sendMockImageMessage;
window.openCameraImagePicker = openCameraImagePicker;
window.onCameraImageSelected = onCameraImageSelected;
window.startMessageLongPress = startMessageLongPress;
window.cancelMessageLongPress = cancelMessageLongPress;
window.showMessageContextMenu = showMessageContextMenu;
window.hideMessageContextMenu = hideMessageContextMenu;
window.closeEditMessageModal = closeEditMessageModal;
window.openEditMessage = openEditMessage;
window.quoteMessage = quoteMessage;
window.clearReplyingQuote = clearReplyingQuote;
window.saveEditedMessage = saveEditedMessage;
window.withdrawMessage = withdrawMessage;
window.openWithdrawContent = openWithdrawContent;
window.closeWithdrawContent = closeWithdrawContent;
window.deleteMessage = deleteMessage;
window.reopenAssistantRound = reopenAssistantRound;

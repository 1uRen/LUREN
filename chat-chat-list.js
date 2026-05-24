// chat-chat-list module
let longPressTimer = null;

function startLongPress(event, chatIndex) {
    longPressTimer = setTimeout(() => {
        const x = event.clientX || (event.touches && event.touches[0].clientX);
        const y = event.clientY || (event.touches && event.touches[0].clientY);
        showContextMenuAt(x, y, chatIndex);
    }, 500);
}

function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function showContextMenu(event, chatIndex) {
    event.preventDefault();
    showContextMenuAt(event.clientX, event.clientY, chatIndex);
}

function showContextMenuAt(x, y, chatIndex) {
    state.contextMenu.show = true;
    state.contextMenu.chatIndex = chatIndex;
    
    // 调整位置避免超出屏幕
    const menuWidth = 140;
    const menuHeight = 100;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);
    
    state.contextMenu.x = Math.max(adjustedX, 10);
    state.contextMenu.y = Math.max(adjustedY, 10);
    
    initChatApp();
}

function hideContextMenu(event) {
    if (event && event.target.closest('.context-menu')) {
        return;
    }
    if (!state.contextMenu.show && state.contextMenu.chatIndex === null && !longPressTimer) {
        return;
    }
    state.contextMenu.show = false;
    state.contextMenu.chatIndex = null;
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    initChatApp();
}

function togglePinChat(chatIndex) {
    const chat = state.chats[chatIndex];
    if (chat) {
        chat.pinned = !chat.pinned;
        saveStateToStorage();
    }
    hideContextMenu();
}

function deleteChat(chatIndex) {
    const chat = state.chats[chatIndex];
    if (!chat) {
        hideContextMenu();
        return;
    }
    
    if (confirm(`是否确定删除与 ${chat.contact.name} 的聊天记录？`)) {
        const qqId = chat.contact.qqId;
        // 删除聊天记录不应影响好友关系
        const contact = state.contacts.find(c => c?.qqId === qqId);
        if (contact) {
            contact.isFriend = true;
        }
        state.chats.splice(chatIndex, 1);
        delete state.unreadMessages[qqId];
        
        if (state.currentChatContact && state.currentChatContact.qqId === qqId) {
            state.currentChatContact = null;
        }
        
        saveStateToStorage();
    }
    hideContextMenu();
}

function openChat(index) {
    // 如果是长按状态，不打开聊天
    if (state.contextMenu.show) {
        return;
    }
    const chat = state.chats[index];
    state.currentChatContact = chat.contact;
    state.autoScrollNext = !Number.isInteger(state.scrollToMessageIndex);
    delete state.unreadMessages[chat.contact.qqId];
    saveStateToStorage();
    initChatApp();
}

function closeChat() {
    state.currentChatContact = null;
    state.chatSettingsOpen = false;
    state.stickerPanelOpen = false;
    state.showStickerManagerModal = false;
    state.stickerSearchKeyword = '';
    state.showMockVoiceModal = false;
    state.mockVoiceText = '';
    state.showMockImageModal = false;
    state.mockImageText = '';
    state.viewingWithdrawMessage = null;
    state.messageSelectMode = false;
    state.selectedMessages = [];
    state.messageSelectAnchor = null;
    state.showForwardModal = false;
    state.forwardTargetContactId = null;
    state.viewingForwardRecord = null;
    state.replyingQuote = null;
    state.chatInputStickerSuggestKeyword = '';
    state.chatInputSelectionStart = null;
    state.chatInputSelectionEnd = null;
    state.chatInputComposing = false;
    closeEditMessageModal();
    state.messageContextMenu.show = false;
    initChatApp();
}

window.startLongPress = startLongPress;
window.cancelLongPress = cancelLongPress;
window.showContextMenu = showContextMenu;
window.hideContextMenu = hideContextMenu;
window.togglePinChat = togglePinChat;
window.deleteChat = deleteChat;

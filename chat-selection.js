function markChatScrollPreserve() {
    state.preserveChatScrollNextRender = true;
}

function enterMessageSelectMode() {
    const idx = state.messageContextMenu.messageIndex;
    state.messageSelectMode = true;
    state.selectedMessages = idx !== null ? [idx] : [];
    state.messageSelectAnchor = idx;
    state.messageContextMenu.show = false;
    state.messageContextMenu.messageIndex = null;
    markChatScrollPreserve();
    initChatApp();
}

function exitMessageSelectMode() {
    markChatScrollPreserve();
    state.messageSelectMode = false;
    state.selectedMessages = [];
    state.messageSelectAnchor = null;
    state.showForwardModal = false;
    state.forwardTargetContactId = null;
    initChatApp();
}

function onMessageItemClick(index) {
    if (!state.messageSelectMode) return;
    const exists = state.selectedMessages.includes(index);
    if (exists) {
        state.selectedMessages = state.selectedMessages.filter(i => i !== index);
        if (state.messageSelectAnchor === index) {
            state.messageSelectAnchor = state.selectedMessages.length ? state.selectedMessages[0] : null;
        }
    } else {
        state.selectedMessages = [...state.selectedMessages, index].sort((a, b) => a - b);
        if (state.messageSelectAnchor === null) {
            state.messageSelectAnchor = index;
        }
    }
    markChatScrollPreserve();
    initChatApp();
}

function getDividerTargetMessageIndex() {
    const divider = document.querySelector('.message-select-divider-wrap');
    const items = Array.from(document.querySelectorAll('.chat-fullscreen .chat-messages .message-item[data-message-index]'));
    if (!divider || !items.length) return -1;

    const markerY = divider.getBoundingClientRect().top;
    let firstBelowIdx = -1;
    for (const item of items) {
        const rect = item.getBoundingClientRect();
        const idx = parseInt(item.getAttribute('data-message-index'), 10);
        if (Number.isNaN(idx)) continue;
        if (rect.top >= markerY) {
            firstBelowIdx = idx;
            break;
        }
    }

    if (firstBelowIdx === -1) {
        const lastIdx = parseInt(items[items.length - 1].getAttribute('data-message-index'), 10);
        return Number.isNaN(lastIdx) ? -1 : lastIdx;
    }
    if (firstBelowIdx <= 0) return 0;
    return firstBelowIdx - 1;
}

function selectMessagesToHereFromDivider() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    if (!chat) return;

    const target = getDividerTargetMessageIndex();
    if (target < 0 || target >= chat.messages.length) return;

    const selectedSet = new Set(state.selectedMessages);
    const candidateAnchors = [];
    if (state.messageSelectAnchor !== null) {
        candidateAnchors.push(state.messageSelectAnchor);
    }
    state.selectedMessages.forEach(i => {
        if (!candidateAnchors.includes(i)) candidateAnchors.push(i);
    });
    if (!candidateAnchors.length) {
        candidateAnchors.push(0);
    }

    const buildRange = (anchor, endIndex) => {
        const start = Math.max(0, Math.min(anchor, endIndex));
        const end = Math.min(chat.messages.length - 1, Math.max(anchor, endIndex));
        const range = [];
        for (let i = start; i <= end; i++) range.push(i);
        return range;
    };

    let bestAnchor = candidateAnchors[0];
    let bestAddedCount = -1;
    candidateAnchors.forEach(anchor => {
        const range = buildRange(anchor, target);
        const addedCount = range.reduce((count, idx) => count + (selectedSet.has(idx) ? 0 : 1), 0);
        if (addedCount > bestAddedCount) {
            bestAddedCount = addedCount;
            bestAnchor = anchor;
        }
    });

    const finalRange = buildRange(bestAnchor, target);
    const rangeSet = new Set(state.selectedMessages);
    finalRange.forEach(i => rangeSet.add(i));
    state.selectedMessages = Array.from(rangeSet).sort((a, b) => a - b);
    state.messageSelectAnchor = bestAnchor;
    markChatScrollPreserve();
    initChatApp();
}

function clearSelectedMessages() {
    if (!state.messageSelectMode) return;
    state.selectedMessages = [];
    state.messageSelectAnchor = null;
    markChatScrollPreserve();
    initChatApp();
}

function selectAllMessages() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    if (!chat || !state.messageSelectMode) return;
    state.selectedMessages = chat.messages.map((_, index) => index);
    state.messageSelectAnchor = 0;
    markChatScrollPreserve();
    initChatApp();
}

function deleteSelectedMessages() {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    if (!chat || !state.selectedMessages.length) {
        exitMessageSelectMode();
        return;
    }

    const sorted = [...state.selectedMessages].sort((a, b) => b - a);
    sorted.forEach(index => {
        if (index >= 0 && index < chat.messages.length) {
            chat.messages.splice(index, 1);
        }
    });

    markChatScrollPreserve();
    state.messageSelectMode = false;
    state.selectedMessages = [];
    state.messageSelectAnchor = null;
    saveStateToStorage();
    initChatApp();
}

window.enterMessageSelectMode = enterMessageSelectMode;
window.exitMessageSelectMode = exitMessageSelectMode;
window.onMessageItemClick = onMessageItemClick;
window.selectMessagesToHereFromDivider = selectMessagesToHereFromDivider;
window.clearSelectedMessages = clearSelectedMessages;
window.selectAllMessages = selectAllMessages;
window.deleteSelectedMessages = deleteSelectedMessages;

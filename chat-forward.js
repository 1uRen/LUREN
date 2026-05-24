// chat-forward module
function normalizeQQId(qqId) {
    return String(qqId ?? '').trim();
}

function getForwardableContacts() {
    const currentId = normalizeQQId(state.currentChatContact?.qqId);
    const seen = new Set();
    const result = [];
    const addContact = (contact) => {
        const id = normalizeQQId(contact?.qqId);
        if (!id || id === currentId || seen.has(id)) return;
        seen.add(id);
        result.push(contact);
    };
    (state.contacts || []).forEach(addContact);
    (state.chats || []).forEach(chat => addContact(chat?.contact));
    return result;
}

function openForwardModal() {
    if (!state.messageSelectMode || !state.selectedMessages.length) return;
    if (typeof markChatScrollPreserve === 'function') {
        markChatScrollPreserve();
    }
    state.showForwardModal = true;
    state.forwardMode = state.forwardMode || 'merge';
    state.forwardTargetContactId = null;
    initChatApp();
}

function closeForwardModal() {
    state.showForwardModal = false;
    state.forwardTargetContactId = null;
    state.forwardComment = '';
    if (typeof markChatScrollPreserve === 'function') {
        markChatScrollPreserve();
    }
    initChatApp();
}

function updateForwardComment(value) {
    state.forwardComment = value || '';
}

function setForwardMode(mode) {
    if (mode !== 'single' && mode !== 'merge') return;
    state.forwardMode = mode;
    initChatApp();
}

function selectForwardTarget(qqId) {
    state.forwardTargetContactId = normalizeQQId(qqId) || null;
    initChatApp();
}

function ensureChatForContact(contact) {
    if (!contact?.qqId) return null;
    const contactId = normalizeQQId(contact.qqId);
    let chat = state.chats.find(c => normalizeQQId(c?.contact?.qqId) === contactId);
    if (!chat) {
        chat = {
            contact,
            messages: []
        };
        state.chats.push(chat);
    }
    return chat;
}

function getForwardAuthorName(msg, sourceContact) {
    if (msg?.isMine) return state.currentUser?.nickname || '你';
    return sourceContact?.name || '对方';
}

function cloneMessageSnapshot(msg, sourceContact, depth = 0) {
    if (!msg || msg.withdrawn) return null;
    
    // 最多支持两层嵌套的聊天记录
    if (depth > 1 && msg.isForwardMerged) {
        return null;
    }
    
    // 如果是嵌套的聊天记录中的消息，保留原始的 author 和 isMine
    // 避免再次转发时消息归属错误
    let author = msg.author;
    let isMine = !!msg.isMine;
    
    // 只有在顶层（depth=0）且消息有原始来源时，才重新计算作者
    if (depth === 0 && !msg.isForwardMerged && sourceContact) {
        author = getForwardAuthorName(msg, sourceContact);
        isMine = !!msg.isMine;
    }
    
    return {
        author,
        isMine,
        time: msg.time || '',
        text: msg.text || '',
        isMockVoice: !!msg.isMockVoice,
        isMockImage: !!msg.isMockImage,
        isSticker: !!msg.isSticker,
        isCameraImage: !!msg.isCameraImage,
        stickerUrl: msg.stickerUrl || '',
        stickerDesc: msg.stickerDesc || '',
        imageData: msg.imageData || '',
        imageName: msg.imageName || '',
        quotedMessage: msg.quotedMessage ? { ...msg.quotedMessage } : null,
        // 递归处理嵌套的聊天记录
        isForwardMerged: !!msg.isForwardMerged,
        forwardRecord: msg.forwardRecord && depth <= 1 ? {
            ...msg.forwardRecord,
            items: (msg.forwardRecord.items || []).map(item => cloneMessageSnapshot(item, sourceContact, depth + 1)).filter(Boolean)
        } : null
    };
}

function buildSingleForwardMessage(snapshot, sourceContact) {
    // 逐条转发直接保留消息格式，不添加"来自XXX"
    return {
        text: snapshot.text || '',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        isMockVoice: snapshot.isMockVoice,
        isMockImage: snapshot.isMockImage,
        isSticker: snapshot.isSticker,
        isCameraImage: snapshot.isCameraImage,
        stickerUrl: snapshot.stickerUrl,
        stickerDesc: snapshot.stickerDesc,
        imageData: snapshot.imageData,
        imageName: snapshot.imageName,
        showVoiceText: false,
        quotedMessage: snapshot.quotedMessage,
        isForwardMerged: snapshot.isForwardMerged,
        forwardRecord: snapshot.forwardRecord
    };
}

function buildMergedForwardMessage(snapshots, sourceContact) {
    const userName = state.currentUser?.nickname || '你';
    const sourceName = sourceContact?.name || '对方';
    const sourceAvatar = sourceContact?.avatar || '';
    const userAvatar = state.currentUser?.avatar || '';
    
    // 判断是否只有一个人的消息
    const uniqueAuthors = new Set(snapshots.map(s => s.author));
    let title = '';
    if (uniqueAuthors.size === 1) {
        title = `${[...uniqueAuthors][0]}的聊天记录`;
    } else {
        title = `${userName}和${sourceName}的聊天记录`;
    }
    
    return {
        text: '[聊天记录]',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        isForwardMerged: true,
        forwardRecord: {
            title,
            sourceName,
            sourceAvatar,
            userName,
            userAvatar,
            items: snapshots
        }
    };
}

function confirmForwardMessages() {
    const sourceContact = state.currentChatContact;
    const sourceChat = getChatByContactId(sourceContact?.qqId);
    const targetId = normalizeQQId(state.forwardTargetContactId);
    const targetContact = state.contacts.find(c => normalizeQQId(c.qqId) === targetId)
        || state.chats.map(c => c.contact).find(c => normalizeQQId(c?.qqId) === targetId);
    if (!sourceChat || !targetContact || !state.selectedMessages.length || !targetId) return;

    const targetChat = ensureChatForContact(targetContact);
    if (!targetChat) return;

    const sortedIndices = [...state.selectedMessages].sort((a, b) => a - b);
    
    // 限制最多转发100条消息
    if (sortedIndices.length > 100) {
        alert('最多只能转发100条消息');
        return;
    }
    
    const snapshots = sortedIndices
        .map(index => cloneMessageSnapshot(sourceChat.messages[index], sourceContact))
        .filter(Boolean);
    if (!snapshots.length) {
        alert('没有可转发的消息');
        return;
    }

    if (state.forwardMode === 'merge') {
        targetChat.messages.push(buildMergedForwardMessage(snapshots, sourceContact));
    } else {
        snapshots.forEach(snapshot => {
            targetChat.messages.push(buildSingleForwardMessage(snapshot, sourceContact));
        });
    }

    // 如果有留言，发送留言消息
    const comment = state.forwardComment?.trim();
    if (comment) {
        targetChat.messages.push({
            text: comment,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            isMine: true,
            isForwardComment: true
        });
    }

    markChatActivity(targetChat);
    markChatScrollPreserve();
    state.showForwardModal = false;
    state.forwardTargetContactId = null;
    state.forwardComment = '';
    state.messageSelectMode = false;
    state.selectedMessages = [];
    state.messageSelectAnchor = null;
    saveStateToStorage();
    
    // 打开目标角色的聊天页面
    const targetChatIndex = state.chats.findIndex(c => normalizeQQId(c?.contact?.qqId) === targetId);
    if (targetChatIndex >= 0) {
        openChat(targetChatIndex);
    } else {
        initChatApp();
    }
}

function openForwardRecord(record) {
    if (!record) return;
    state.viewingForwardRecord = record;
    initChatApp();
}

function closeForwardRecord() {
    if (state._forwardRecordStack && state._forwardRecordStack.length > 0) {
        state.viewingForwardRecord = state._forwardRecordStack.pop();
        initChatApp();
    } else {
        state._forwardRecordStack = null;
        state.viewingForwardRecord = null;
        initChatApp();
    }
}

function bindForwardModalListeners() {
    const overlay = document.querySelector('.forward-modal-overlay');
    if (!overlay) return;

    overlay.querySelector('.forward-modal')?.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeForwardModal();
        }
    });

    overlay.querySelectorAll('[data-forward-mode]').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            setForwardMode(btn.getAttribute('data-forward-mode'));
        });
    });

    overlay.querySelectorAll('[data-forward-contact-id]').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            selectForwardTarget(btn.getAttribute('data-forward-contact-id'));
        });
    });

    overlay.querySelector('[data-forward-confirm]')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        confirmForwardMessages();
    });

    overlay.querySelector('[data-forward-cancel]')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeForwardModal();
    });
}

function openForwardRecordByMessageIndex(messageIndex) {
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    const record = chat?.messages?.[messageIndex]?.forwardRecord;
    if (record) openForwardRecord(record);
}

// 查看嵌套的聊天记录
function openNestedForwardRecord(itemIndex) {
    if (!state.viewingForwardRecord) return;
    const item = state.viewingForwardRecord.items?.[itemIndex];
    if (item?.forwardRecord) {
        // 保存当前的记录以便返回
        if (!state._forwardRecordStack) {
            state._forwardRecordStack = [];
        }
        state._forwardRecordStack.push(state.viewingForwardRecord);
        openForwardRecord(item.forwardRecord);
    }
}

function toggleMockVoiceTextForward(itemIndex) {
    if (!state.viewingForwardRecord?.items) return;
    const item = state.viewingForwardRecord.items[itemIndex];
    if (item) {
        item.showVoiceText = !item.showVoiceText;
        initChatApp();
    }
}

window.openForwardModal = openForwardModal;
window.closeForwardModal = closeForwardModal;
window.setForwardMode = setForwardMode;
window.updateForwardComment = updateForwardComment;
window.toggleMockVoiceTextForward = toggleMockVoiceTextForward;
window.selectForwardTarget = selectForwardTarget;
window.confirmForwardMessages = confirmForwardMessages;
window.bindForwardModalListeners = bindForwardModalListeners;
window.openForwardRecordByMessageIndex = openForwardRecordByMessageIndex;
window.closeForwardRecord = closeForwardRecord;
window.openNestedForwardRecord = openNestedForwardRecord;

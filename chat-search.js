const MESSAGE_SEARCH_DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E';

function escapeSearchHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeSearchAttr(text) {
    return escapeSearchHtml(text).replace(/'/g, '&#39;');
}

function normalizeSearchKeyword(keyword) {
    return String(keyword || '').trim().toLowerCase();
}

function getSearchContactTitle(contact) {
    if (!contact) return '未知';
    const name = String(contact.name || '').trim() || '未知';
    const remark = String(contact.remark || '').trim();
    if (remark && remark !== name) {
        return `${remark}（${name}）`;
    }
    return remark || name;
}

function getSearchContactMeta(contact) {
    if (!contact) return '';
    const parts = [];
    if (contact.qqId) parts.push(String(contact.qqId));
    if (contact.group) parts.push(String(contact.group));
    const isFriend = !!contact.isFriend || state.chats.some(c => String(c?.contact?.qqId) === String(contact.qqId));
    parts.push(isFriend ? '好友' : '非好友角色');
    return parts.join(' · ');
}

function getMessagePlainText(msg) {
    if (!msg || msg.withdrawn) return '';
    if (msg.isSticker) {
        const desc = typeof extractStickerDescFromText === 'function'
            ? extractStickerDescFromText(msg.text)
            : '';
        return desc ? `[表情] ${desc}` : '[表情]';
    }
    if (msg.isMockVoice) return String(msg.text || '').trim();
    if (msg.isMockImage || msg.isCameraImage) return String(msg.text || '').trim() || '[图片]';
    if (msg.quotedMessage && typeof getQuotedMessageDisplayText === 'function') {
        const quote = getQuotedMessageDisplayText(msg.quotedMessage);
        const body = String(msg.text || '').trim();
        return [quote, body].filter(Boolean).join(' ');
    }
    return String(msg.text || '').trim();
}

function buildSearchSnippet(text, keyword, radius = 24) {
    const raw = String(text || '');
    const q = normalizeSearchKeyword(keyword);
    if (!raw) return '';
    if (!q) return raw.slice(0, 60);
    const lower = raw.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx < 0) return raw.slice(0, 60);
    const start = Math.max(0, idx - radius);
    const end = Math.min(raw.length, idx + q.length + radius);
    let snippet = raw.slice(start, end);
    if (start > 0) snippet = `…${snippet}`;
    if (end < raw.length) snippet = `${snippet}…`;
    return snippet;
}

function highlightSearchText(text, keyword) {
    const raw = String(text || '');
    const q = normalizeSearchKeyword(keyword);
    if (!raw || !q) return escapeSearchHtml(raw);
    const lower = raw.toLowerCase();
    let cursor = 0;
    let html = '';
    while (cursor < raw.length) {
        const idx = lower.indexOf(q, cursor);
        if (idx < 0) {
            html += escapeSearchHtml(raw.slice(cursor));
            break;
        }
        if (idx > cursor) {
            html += escapeSearchHtml(raw.slice(cursor, idx));
        }
        html += `<mark class="search-hl">${escapeSearchHtml(raw.slice(idx, idx + q.length))}</mark>`;
        cursor = idx + q.length;
    }
    return html || escapeSearchHtml(raw);
}

function contactMatchesKeyword(contact, keyword) {
    const q = normalizeSearchKeyword(keyword);
    if (!q || !contact) return false;
    const haystack = [
        contact.name,
        contact.remark,
        contact.qqId
    ].map(item => String(item || '').toLowerCase()).join(' ');
    return haystack.includes(q);
}

function searchContactsByKeyword(keyword) {
    const q = normalizeSearchKeyword(keyword);
    if (!q) return [];
    const seen = new Set();
    const list = [];
    (state.contacts || []).forEach((contact, index) => {
        const id = String(contact?.qqId || index);
        if (seen.has(id)) return;
        if (!contactMatchesKeyword(contact, keyword)) return;
        seen.add(id);
        list.push({ contact, contactIndex: index });
    });
    return list;
}

function searchChatRecordsByKeyword(keyword) {
    const q = normalizeSearchKeyword(keyword);
    if (!q) return [];
    const results = [];
    (state.chats || []).forEach((chat, chatIndex) => {
        const contact = chat?.contact;
        if (!contact) return;
        const hits = [];
        (chat.messages || []).forEach((msg, msgIndex) => {
            const text = getMessagePlainText(msg);
            if (!text) return;
            if (!text.toLowerCase().includes(q)) return;
            hits.push({
                msgIndex,
                text,
                time: msg.time || '',
                snippet: buildSearchSnippet(text, keyword),
                isMine: !!msg.isMine
            });
        });
        if (hits.length) {
            results.push({
                chatIndex,
                contact,
                hits,
                total: hits.length
            });
        }
    });
    return results.sort((a, b) => b.total - a.total);
}

function searchGroupsByKeyword(keyword) {
    const q = normalizeSearchKeyword(keyword);
    if (!q) return [];
    return (state.groupChats || []).filter(group => {
        const haystack = [
            group.name,
            group.remark,
            group.desc
        ].map(item => String(item || '').toLowerCase()).join(' ');
        return haystack.includes(q);
    });
}

function getMessageSearchResults(keyword) {
    const q = String(keyword || '').trim();
    if (!q) {
        return { contacts: [], chats: [], groups: [] };
    }
    return {
        contacts: searchContactsByKeyword(q),
        chats: searchChatRecordsByKeyword(q),
        groups: searchGroupsByKeyword(q)
    };
}

function addMessageSearchRecent(keyword) {
    const q = String(keyword || '').trim();
    if (!q) return;
    if (!Array.isArray(state.messageSearchRecent)) {
        state.messageSearchRecent = [];
    }
    state.messageSearchRecent = state.messageSearchRecent.filter(item => item !== q);
    state.messageSearchRecent.unshift(q);
    state.messageSearchRecent = state.messageSearchRecent.slice(0, 12);
    saveStateToStorage();
}

function clearMessageSearchRecent() {
    state.messageSearchRecent = [];
    saveStateToStorage();
    initChatApp();
}

function resetMessageSearchDraft() {
    state.messageSearchKeyword = '';
    state.messageSearchComposing = false;
    state.messageSearchKeepFocus = false;
    state.messageSearchSelectionStart = null;
    state.messageSearchSelectionEnd = null;
}

function openMessageSearchPage() {
    state.messageSearchOpen = true;
    state.messageSearchSubView = null;
    state.messageSearchSubChatIndex = null;
    state.messageSearchKeepFocus = true;
    initChatApp();
}

function closeMessageSearchPage() {
    state.messageSearchOpen = false;
    state.messageSearchSubView = null;
    state.messageSearchSubChatIndex = null;
    resetMessageSearchDraft();
    initChatApp();
}

function backMessageSearchSubView() {
    if (state.messageSearchSubView === 'chatDetail') {
        state.messageSearchSubView = 'chats';
        state.messageSearchSubChatIndex = null;
    } else {
        state.messageSearchSubView = null;
        state.messageSearchSubChatIndex = null;
    }
    state.messageSearchKeepFocus = true;
    initChatApp();
}

function openMessageSearchContactsMore() {
    state.messageSearchSubView = 'contacts';
    initChatApp();
}

function openMessageSearchChatsMore() {
    state.messageSearchSubView = 'chats';
    state.messageSearchSubChatIndex = null;
    initChatApp();
}

function openMessageSearchGroupsMore() {
    state.messageSearchSubView = 'groups';
    initChatApp();
}

function openMessageSearchChatDetail(chatIndex) {
    state.messageSearchSubView = 'chatDetail';
    state.messageSearchSubChatIndex = chatIndex;
    initChatApp();
}

function setMessageSearchComposing(isComposing) {
    state.messageSearchComposing = !!isComposing;
}

function updateMessageSearchKeyword(value, selectionStart = null, selectionEnd = null, shouldRender = true) {
    state.messageSearchKeyword = value || '';
    state.messageSearchSelectionStart = Number.isInteger(selectionStart) ? selectionStart : null;
    state.messageSearchSelectionEnd = Number.isInteger(selectionEnd) ? selectionEnd : null;
    if (!shouldRender) return;
    state.messageSearchKeepFocus = true;
    initChatApp();
}

function handleMessageSearchInput(value, selectionStart = null, selectionEnd = null, eventIsComposing = false) {
    updateMessageSearchKeyword(value, selectionStart, selectionEnd, !eventIsComposing);
}

function handleMessageSearchKeyup(value, selectionStart = null, selectionEnd = null, keyCode = 0, eventIsComposing = false) {
    if (eventIsComposing || Number(keyCode) === 229) return;
    updateMessageSearchKeyword(value, selectionStart, selectionEnd, true);
}

function applyMessageSearchKeyword(keyword) {
    state.messageSearchKeyword = String(keyword || '');
    state.messageSearchKeepFocus = true;
    initChatApp();
}

function submitMessageSearchKeyword() {
    const q = String(state.messageSearchKeyword || '').trim();
    if (q) addMessageSearchRecent(q);
}

function openSearchContactProfile(contactIndex) {
    if (!Number.isInteger(contactIndex) || contactIndex < 0) return;
    const q = String(state.messageSearchKeyword || '').trim();
    if (q) addMessageSearchRecent(q);
    state.messageSearchOpen = false;
    state.messageSearchSubView = null;
    resetMessageSearchDraft();
    openProfilePage(contactIndex);
}

function openSearchContactChat(contact) {
    const q = String(state.messageSearchKeyword || '').trim();
    if (q) addMessageSearchRecent(q);
    const chatIndex = state.chats.findIndex(c => String(c?.contact?.qqId) === String(contact?.qqId));
    if (chatIndex >= 0) {
        state.messageSearchOpen = false;
        state.messageSearchSubView = null;
        resetMessageSearchDraft();
        openChat(chatIndex);
        return;
    }
    alert('暂无与该角色的聊天记录');
}

function jumpToSearchMessage(chatIndex, messageIndex) {
    const q = String(state.messageSearchKeyword || '').trim();
    if (q) addMessageSearchRecent(q);
    state.messageSearchOpen = false;
    state.messageSearchSubView = null;
    state.messageSearchSubChatIndex = null;
    resetMessageSearchDraft();
    state.scrollToMessageIndex = messageIndex;
    openChat(chatIndex);
}

window.openMessageSearchPage = openMessageSearchPage;
window.closeMessageSearchPage = closeMessageSearchPage;
window.backMessageSearchSubView = backMessageSearchSubView;
window.openMessageSearchContactsMore = openMessageSearchContactsMore;
window.openMessageSearchChatsMore = openMessageSearchChatsMore;
window.openMessageSearchGroupsMore = openMessageSearchGroupsMore;
window.openMessageSearchChatDetail = openMessageSearchChatDetail;
window.setMessageSearchComposing = setMessageSearchComposing;
window.handleMessageSearchKeyup = handleMessageSearchKeyup;
window.handleMessageSearchInput = handleMessageSearchInput;
window.applyMessageSearchKeyword = applyMessageSearchKeyword;
window.clearMessageSearchRecent = clearMessageSearchRecent;
window.openSearchContactProfile = openSearchContactProfile;
window.openSearchContactChat = openSearchContactChat;
window.jumpToSearchMessage = jumpToSearchMessage;
window.submitMessageSearchKeyword = submitMessageSearchKeyword;
window.updateMessageSearchKeyword = updateMessageSearchKeyword;

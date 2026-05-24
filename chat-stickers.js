// chat-stickers module
function ensureStickerDefaults() {
    if (!Array.isArray(state.stickerCategories)) {
        state.stickerCategories = [];
    }
    if (!state.stickerCategories.length) {
        state.stickerCategories = [{
            id: `sticker-category-default`,
            name: '默认',
            items: []
        }];
    }
    if (!state.stickerPanelTab || state.stickerPanelTab === 'favorites' || state.stickerPanelTab === 'search') return;
    const hasTab = state.stickerCategories.some(category => category.id === state.stickerPanelTab);
    if (!hasTab) {
        state.stickerPanelTab = state.stickerLastTab || state.stickerCategories[0].id;
    }
    const hasLastTab = state.stickerLastTab === 'favorites' || state.stickerCategories.some(category => category.id === state.stickerLastTab);
    if (!hasLastTab) {
        state.stickerLastTab = state.stickerCategories[0].id;
    }
}

function getStickerCategoriesForPanel() {
    ensureStickerDefaults();
    return state.stickerCategories;
}

function getAllStickers() {
    return getStickerCategoriesForPanel().flatMap(category => category.items || []);
}

function normalizeStickerSearchText(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[，。！？!?、；;：:\s\-_]/g, '');
}

function getStickerSuggestionsForChatInput(keyword, maxCount = 10) {
    const normalized = normalizeStickerSearchText(keyword || '');
    if (!normalized) return [];

    const ranked = getAllStickers()
        .map(item => {
            const itemDesc = normalizeStickerSearchText(item.desc || '');
            let score = 3;
            if (itemDesc === normalized) score = 0;
            else if (itemDesc.startsWith(normalized)) score = 1;
            else if (itemDesc.includes(normalized)) score = 2;
            else return null;
            return { item, score };
        })
        .filter(Boolean)
        .sort((a, b) => a.score - b.score || String(a.item.desc || '').localeCompare(String(b.item.desc || ''), 'zh-CN'));

    return ranked.slice(0, maxCount).map(entry => entry.item);
}

function getVisibleStickers() {
    const keyword = normalizeStickerSearchText(state.stickerSearchKeyword || '');
    const allStickers = getAllStickers();
    if (state.stickerPanelTab === 'favorites') {
        return allStickers.filter(item => item.favorite);
    }
    if (state.stickerPanelTab === 'search') {
        if (!keyword) return [];
        return allStickers.filter(item => normalizeStickerSearchText(item.desc || '').includes(keyword));
    }
    const category = getStickerCategoriesForPanel().find(item => item.id === state.stickerPanelTab);
    const list = category?.items || [];
    if (!keyword) return list;
    return list.filter(item => normalizeStickerSearchText(item.desc || '').includes(keyword));
}

function parseStickerUrlLine(line, fallbackIndex = 0) {
    const raw = String(line || '').trim();
    if (!raw) return null;

    const urlMatch = raw.match(/https?:\/\/\S+/i);
    if (!urlMatch) return null;
    const url = urlMatch[0].trim();
    let desc = raw.replace(url, '').replace(/[：:｜|\-–—]+/g, ' ').trim();
    if (!desc) {
        try {
            const pathname = new URL(url).pathname;
            const file = pathname.split('/').pop() || '';
            desc = decodeURIComponent(file).replace(/\.[a-z0-9]+$/i, '').trim();
        } catch (error) {
            desc = '';
        }
    }
    if (!desc) {
        desc = `表情${fallbackIndex + 1}`;
    }

    return {
        id: `sticker-item-${Date.now()}-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
        desc,
        url,
        favorite: false
    };
}

function extractStickerDescFromText(text) {
    const raw = String(text || '').trim();
    if (!raw) return '';
    const bracketMatch = raw.match(/^\[(?:表情|sticker)\]\s*(.+)$/i);
    if (bracketMatch) return bracketMatch[1].trim();
    const colonMatch = raw.match(/^(?:表情|sticker)[:：]\s*(.+)$/i);
    if (colonMatch) return colonMatch[1].trim();
    return '';
}

function resolveStickerForRole(descText) {
    const all = getAllStickers();
    if (!all.length) return null;
    const normalizeStickerDesc = (value) => String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^\s*(?:\[表情\]|\[sticker\]|表情[:：]|sticker[:：])\s*/i, '')
        .replace(/[，。！？!?、；;：:\s]/g, '');
    const desc = normalizeStickerDesc(descText);
    if (!desc) return null;

    const exact = all.find(item => normalizeStickerDesc(item.desc) === desc);
    if (exact) return exact;

    const partial = all.find(item => {
        const itemDesc = normalizeStickerDesc(item.desc);
        return itemDesc.includes(desc) || desc.includes(itemDesc);
    });
    if (partial) return partial;
    return null;
}

function coerceMessageToSticker(msg) {
    if (!msg || msg.withdrawn) return msg;

    // 用户消息：仅面板发送的 isSticker 才按表情显示，普通文字永不自动匹配表情库
    if (msg.isMine) {
        if (!msg.isSticker) return msg;
        const sticker = resolveStickerForRole(msg.stickerDesc || msg.text);
        if (!sticker) return msg;
        return {
            ...msg,
            isSticker: true,
            text: sticker.desc || msg.text,
            stickerUrl: sticker.url,
            stickerDesc: sticker.desc || msg.stickerDesc || msg.text
        };
    }

    // 角色消息：仅 isSticker 或带 [表情] 标记时才修正，避免普通台词误变表情
    const explicitStickerDesc = extractStickerDescFromText(msg.text);
    if (!msg.isSticker && !explicitStickerDesc) return msg;

    const lookupDesc = explicitStickerDesc || String(msg.text || '').trim();
    if (!lookupDesc) return msg;

    const sticker = resolveStickerForRole(lookupDesc);
    if (sticker) {
        return {
            ...msg,
            isSticker: true,
            text: sticker.desc || lookupDesc,
            stickerUrl: sticker.url,
            stickerDesc: sticker.desc || lookupDesc
        };
    }

    if (msg.isSticker || explicitStickerDesc) {
        const cleanText = explicitStickerDesc || String(msg.text || '').trim();
        return {
            ...msg,
            isSticker: true,
            text: cleanText,
            stickerDesc: cleanText || msg.stickerDesc || ''
        };
    }

    return msg;
}

function coerceStickerReplyItem(item) {
    if (!item) return item;
    if (item.isSticker) {
        const clean = extractStickerDescFromText(item.text) || String(item.text || '').trim();
        return { ...item, isSticker: true, text: clean };
    }
    const parsedDesc = extractStickerDescFromText(item.text);
    if (!parsedDesc) return item;
    const sticker = resolveStickerForRole(parsedDesc);
    if (!sticker) {
        return { ...item, isSticker: true, text: parsedDesc };
    }
    return {
        ...item,
        isSticker: true,
        text: sticker.desc || parsedDesc
    };
}

function repairChatMessageStickers() {
    let changed = false;
    (state.chats || []).forEach(chat => {
        if (!Array.isArray(chat?.messages)) return;
        chat.messages.forEach((msg, idx) => {
            if (msg.isMine && !msg.isSticker) return;
            const fixed = coerceMessageToSticker(msg);
            if (
                fixed.isSticker !== msg.isSticker
                || fixed.stickerUrl !== msg.stickerUrl
                || fixed.text !== msg.text
                || fixed.stickerDesc !== msg.stickerDesc
            ) {
                chat.messages[idx] = fixed;
                changed = true;
            }
        });
    });
    if (changed) saveStateToStorage();
}

let fileInputListenerAttached = false;

function toggleStickerPanel(forceOpen) {
    ensureStickerDefaults();
    const wasClosed = !state.stickerPanelOpen;
    state.plusPanelOpen = false;
    if (typeof forceOpen === 'boolean') {
        state.stickerPanelOpen = forceOpen;
    } else {
        state.stickerPanelOpen = !state.stickerPanelOpen;
    }
    if (state.stickerPanelOpen && !state.stickerPanelTab) {
        state.stickerPanelTab = 'favorites';
    }
    if (state.stickerPanelOpen && state.stickerPanelTab === 'search') {
        state.stickerPanelTab = state.stickerLastTab || 'favorites';
    }
    if (state.stickerPanelOpen && wasClosed) {
        state.autoScrollNext = true;
    }
    initChatApp();
}

function switchStickerPanelTab(tabId) {
    ensureStickerDefaults();
    state.stickerPanelTab = tabId;
    if (tabId !== 'search') {
        state.stickerLastTab = tabId;
    }
    if (tabId !== 'search') {
        state.stickerSearchKeyword = '';
    }
    saveStateToStorage();
    initChatApp();
}

function setStickerSearchComposing(isComposing) {
    state.stickerSearchComposing = !!isComposing;
}

function handleStickerSearchInput(value, selectionStart = null, selectionEnd = null, eventIsComposing = false) {
    const shouldRender = !eventIsComposing;
    updateStickerSearchKeyword(value, selectionStart, selectionEnd, shouldRender);
}

function handleStickerSearchKeyup(value, selectionStart = null, selectionEnd = null, keyCode = 0, eventIsComposing = false) {
    if (eventIsComposing || Number(keyCode) === 229) return;
    updateStickerSearchKeyword(value, selectionStart, selectionEnd, true);
}

function updateStickerSearchKeyword(value, selectionStart = null, selectionEnd = null, shouldRender = true) {
    state.stickerSearchKeyword = value || '';
    state.stickerSearchSelectionStart = Number.isInteger(selectionStart) ? selectionStart : null;
    state.stickerSearchSelectionEnd = Number.isInteger(selectionEnd) ? selectionEnd : null;
    if (!shouldRender) return;
    initChatApp();
}

function sendStickerMessage(stickerId) {
    const all = getAllStickers();
    const sticker = all.find(item => item.id === stickerId);
    if (!sticker) return;
    const chat = getChatByContactId(state.currentChatContact?.qqId);
    if (!chat) return;

    chat.messages.push({
        text: sticker.desc || '表情',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
        isSticker: true,
        stickerUrl: sticker.url,
        stickerDesc: sticker.desc || ''
    });
    markChatActivity(chat);
    state.autoScrollNext = true;
    saveStateToStorage();
    initChatApp();
}

function toggleStickerFavorite(stickerId) {
    const categories = getStickerCategoriesForPanel();
    categories.forEach(category => {
        category.items.forEach(item => {
            if (item.id === stickerId) {
                item.favorite = !item.favorite;
            }
        });
    });
    saveStateToStorage();
    initChatApp();
}

function openStickerManagerModal() {
    ensureStickerDefaults();
    state.showStickerManagerModal = true;
    state.stickerDraftCategoryName = '';
    state.stickerDraftUrlText = '';
    state.stickerDraftPreviewItems = [];
    initChatApp();
}

function closeStickerManagerModal() {
    state.showStickerManagerModal = false;
    state.stickerDraftCategoryName = '';
    state.stickerDraftUrlText = '';
    state.stickerDraftPreviewItems = [];
    initChatApp();
}

function updateStickerDraftField(field, value) {
    if (field === 'category') state.stickerDraftCategoryName = value || '';
    if (field === 'urlText') state.stickerDraftUrlText = value || '';
}

function handleStickerLocalFiles(event) {
    const files = Array.from(event?.target?.files || []);
    if (!files.length) return;

    const readers = files.map((file, idx) => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const desc = (file.name || `本地表情${idx + 1}`).replace(/\.[a-z0-9]+$/i, '');
            resolve({
                id: `sticker-local-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
                desc,
                url: e?.target?.result || '',
                favorite: false
            });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    }));

    Promise.all(readers).then(items => {
        const valid = items.filter(item => item && item.url);
        if (!valid.length) return;
        state.stickerDraftPreviewItems = [...state.stickerDraftPreviewItems, ...valid];
        initChatApp();
    });

    event.target.value = '';
}

function parseStickerDraftUrls() {
    const lines = String(state.stickerDraftUrlText || '')
        .split(/\n+/)
        .map(line => line.trim())
        .filter(Boolean);
    if (!lines.length) return;
    const parsed = lines
        .map((line, idx) => parseStickerUrlLine(line, idx))
        .filter(Boolean);
    if (!parsed.length) {
        alert('没有识别到有效图床链接，请检查格式');
        return;
    }
    state.stickerDraftPreviewItems = [...state.stickerDraftPreviewItems, ...parsed];
    initChatApp();
}

function removeStickerDraftItem(itemId) {
    state.stickerDraftPreviewItems = state.stickerDraftPreviewItems.filter(item => item.id !== itemId);
    initChatApp();
}

function saveStickerDraftItems() {
    if (!state.stickerDraftPreviewItems.length) {
        alert('请先解析或上传至少一个表情');
        return;
    }
    ensureStickerDefaults();
    const categoryName = (state.stickerDraftCategoryName || '').trim() || '默认';
    let category = state.stickerCategories.find(item => item.name === categoryName);
    if (!category) {
        category = {
            id: `sticker-category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: categoryName,
            items: []
        };
        state.stickerCategories.push(category);
    }

    const existingUrls = new Set(category.items.map(item => item.url));
    state.stickerDraftPreviewItems.forEach(item => {
        if (!item.url || existingUrls.has(item.url)) return;
        category.items.push({
            id: item.id || `sticker-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            desc: item.desc || '表情',
            url: item.url,
            favorite: !!item.favorite
        });
        existingUrls.add(item.url);
    });

    state.stickerPanelTab = category.id;
    state.showStickerManagerModal = false;
    state.stickerDraftCategoryName = '';
    state.stickerDraftUrlText = '';
    state.stickerDraftPreviewItems = [];
    saveStateToStorage();
    initChatApp();
}

window.toggleStickerPanel = toggleStickerPanel;
window.switchStickerPanelTab = switchStickerPanelTab;
window.setStickerSearchComposing = setStickerSearchComposing;
window.handleStickerSearchInput = handleStickerSearchInput;
window.handleStickerSearchKeyup = handleStickerSearchKeyup;
window.updateStickerSearchKeyword = updateStickerSearchKeyword;
window.sendStickerMessage = sendStickerMessage;
window.toggleStickerFavorite = toggleStickerFavorite;
window.openStickerManagerModal = openStickerManagerModal;
window.closeStickerManagerModal = closeStickerManagerModal;
window.updateStickerDraftField = updateStickerDraftField;
window.handleStickerLocalFiles = handleStickerLocalFiles;
window.parseStickerDraftUrls = parseStickerDraftUrls;
window.removeStickerDraftItem = removeStickerDraftItem;
window.saveStickerDraftItems = saveStickerDraftItems;

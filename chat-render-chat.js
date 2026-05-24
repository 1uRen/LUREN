// chat-render-chat module
function renderChatInputStickerSuggest() {
    if (state.messageSelectMode) return '';
    const keyword = String(state.chatInputStickerSuggestKeyword || '').trim();
    if (!keyword) return '';
    const suggestions = typeof getStickerSuggestionsForChatInput === 'function'
        ? getStickerSuggestionsForChatInput(keyword)
        : [];
    if (!suggestions.length) return '';

    return `
        <div class="chat-sticker-suggest" onclick="event.stopPropagation()">
            <div class="chat-sticker-suggest-list">
                ${suggestions.map(item => `
                    <button type="button" class="chat-sticker-suggest-item" onclick="event.stopPropagation(); sendStickerFromSuggestion('${item.id}')">
                        <img class="chat-sticker-suggest-img" src="${item.url}" alt="${item.desc || '表情'}">
                        <span class="chat-sticker-suggest-desc">${item.desc || '表情'}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function renderStickerPanel() {
    if (!state.stickerPanelOpen) return '';
    const stickers = getVisibleStickers();
    const categories = getStickerCategoriesForPanel();
    const defaultCategory = categories.find(category => category.name === '默认') || categories[0];
    const defaultCategoryId = defaultCategory?.id || 'favorites';
    const customCategories = categories.filter(category => category.id !== defaultCategoryId);

    return `
        <div class="sticker-sheet">
            <div class="sticker-sheet-handle"></div>
            <div class="sticker-sheet-body">
                ${state.stickerPanelTab === 'search' ? `
                    <div class="sticker-search-row">
                        <input
                            id="stickerSearchInput"
                            class="sticker-search-input"
                            placeholder="搜索表情描述"
                            value="${state.stickerSearchKeyword || ''}"
                            oncompositionstart="setStickerSearchComposing(true)"
                            oncompositionend="setStickerSearchComposing(false); updateStickerSearchKeyword(this.value, this.selectionStart, this.selectionEnd, true)"
                            oninput="handleStickerSearchInput(this.value, this.selectionStart, this.selectionEnd, (typeof event !== 'undefined' && event && event.isComposing))"
                            onkeyup="handleStickerSearchKeyup(this.value, this.selectionStart, this.selectionEnd, (typeof event !== 'undefined' && event ? event.keyCode : 0), (typeof event !== 'undefined' && event && event.isComposing))"
                        >
                    </div>
                ` : ''}
                <div class="sticker-grid">
                    ${stickers.length ? stickers.map(item => `
                        <div class="sticker-item">
                            <button class="sticker-fav-btn ${item.favorite ? 'active' : ''}" onclick="event.stopPropagation(); toggleStickerFavorite('${item.id}')">${item.favorite ? '★' : '☆'}</button>
                            <img class="sticker-item-img" src="${item.url}" alt="${item.desc || '表情'}" onclick="sendStickerMessage('${item.id}')">
                            <div class="sticker-item-desc">${item.desc || '表情'}</div>
                        </div>
                    `).join('') : `<div class="sticker-empty">暂无表情包</div>`}
                </div>
            </div>
            <div class="sticker-sheet-tabs">
                <button class="sticker-tab-icon-btn search ${state.stickerPanelTab === 'search' ? 'active' : ''}" title="搜索" onclick="switchStickerPanelTab('search')">
                    <span class="sticker-tab-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779432076720_search-line.svg')"></span>
                </button>
                <button class="sticker-tab-icon-btn favorite ${state.stickerPanelTab === 'favorites' ? 'active' : ''}" title="收藏" onclick="switchStickerPanelTab('favorites')">
                    <span class="sticker-tab-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779432073471_heart-fill.svg')"></span>
                </button>
                <button class="sticker-tab-icon-btn default ${state.stickerPanelTab === defaultCategoryId ? 'active' : ''}" title="默认" onclick="switchStickerPanelTab('${defaultCategoryId}')">
                    <span class="sticker-tab-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414603496_emotion-line.svg')"></span>
                </button>
                <button class="sticker-tab-icon-btn plus" title="添加" onclick="openStickerManagerModal()">
                    <span class="sticker-tab-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414609713_add-line.svg')"></span>
                </button>
                ${customCategories.map(category => `
                    <button class="sticker-tab-btn ${state.stickerPanelTab === category.id ? 'active' : ''}" onclick="switchStickerPanelTab('${category.id}')">${category.name}</button>
                `).join('')}
            </div>
        </div>
    `;
}

function renderPlusPanel() {
    if (!state.plusPanelOpen) return '';
    
    const plusItems = [
        { id: 'voice-call', icon: 'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Device/phone-fill.svg', label: '语音通话', action: 'handleVoiceCall()' },
        { id: 'video-call', icon: 'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Media/video-on-fill.svg', label: '视频通话', action: 'handleVideoCall()' },
        { id: 'red-packet', icon: 'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Finance/red-packet-fill.svg', label: '红包', action: 'handleRedPacket()' },
        { id: 'transfer', icon: 'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Finance/exchange-cny-line.svg', label: '转账', action: 'handleTransfer()' },
        { id: 'favorite', icon: 'https://img.heliar.top/file/1779432073471_heart-fill.svg', label: '收藏', action: 'handleFavorite()' },
        { id: 'location', icon: 'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Map/map-pin-fill.svg', label: '位置共享', action: 'handleLocation()' },
        { id: 'file-send', icon: 'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Document/folder-2-fill.svg', label: '文件发送', action: 'handleFileSend()' }
    ];

    return `
        <div class="plus-sheet">
            <div class="plus-sheet-handle"></div>
            <div class="plus-sheet-body">
                <div class="plus-grid">
                    ${plusItems.map(item => `
                        <button class="plus-item" onclick="${item.action}">
                            <span class="plus-item-icon" style="--icon-url:url('${item.icon}')"></span>
                            <span class="plus-item-label">${item.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderChatList() {
    const sortedChats = state.chats
        .map((chat, index) => ({ chat, index }))
        .sort((a, b) => {
            const pinnedDiff = Number(!!b.chat.pinned) - Number(!!a.chat.pinned);
            if (pinnedDiff !== 0) return pinnedDiff;
            const activityDiff = (Number(b.chat.updatedAt) || 0) - (Number(a.chat.updatedAt) || 0);
            if (activityDiff !== 0) return activityDiff;
            return b.index - a.index;
        })
        .map(item => item.chat);

    return `
        <div class="chat-content chat-scroll-host" onclick="hideContextMenu(event)">
            <div class="message-list-search-wrap">
                <button type="button" class="message-list-search-trigger" onclick="openMessageSearchPage()">
                    <span class="message-list-search-icon">⌕</span>
                    <span class="message-list-search-placeholder">搜索</span>
                </button>
            </div>
            <div class="chat-list chat-scroll-body">
                ${sortedChats.length ? sortedChats.map(chat => {
                    const originalIndex = state.chats.indexOf(chat);
                    const unread = state.unreadMessages[chat.contact.qqId] || 0;
                    return `
                    <div class="chat-item ${chat.pinned ? 'pinned' : ''}"
                         onclick="openChat(${originalIndex})"
                         oncontextmenu="showContextMenu(event, ${originalIndex})"
                         onmousedown="startLongPress(event, ${originalIndex})"
                         onmouseup="cancelLongPress()"
                         onmouseleave="cancelLongPress()"
                         ontouchstart="startLongPress(event, ${originalIndex})"
                         ontouchend="cancelLongPress()">
                        ${chat.pinned ? '<div class="pinned-badge"></div>' : ''}
                        <div class="chat-avatar-wrap ${chat.pinned ? 'pinned-offset' : ''}">
                            <img class="avatar-44" src="${chat.contact.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}">
                            ${unread > 0 ? `<div class="avatar-unread-badge">${unread}</div>` : ''}
                        </div>
                        <div class="chat-item-main">
                            <div class="text-15-medium">${chat.contact.remark || chat.contact.name}</div>
                            <div class="chat-item-preview">${getChatListPreviewText(chat)}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-12-muted">${chat.messages[chat.messages.length - 1]?.time || ''}</div>
                        </div>
                    </div>
                    `;
                }).join('') : '<div class="empty-state-text">暂无聊天</div>'}
            </div>
            ${renderContextMenu()}
        </div>
    `;
}

function renderChatInterface() {
    const contact = state.currentChatContact;
    const chat = state.chats.find(c => c.contact.qqId === contact.qqId);
    const showRoleAvatar = contact.showRoleAvatar !== false;
    const showUserAvatar = contact.showUserAvatar !== false;
    if (state.chatSettingsOpen) {
        return renderChatSettingsPage(contact, chat);
    }
    const messages = chat ? chat.messages : [];
    const shouldShowTimestamp = (index) => {
        const msg = messages[index];
        if (!msg || msg.withdrawn) return false;
        let nextVisibleMsg = null;
        for (let i = index + 1; i < messages.length; i++) {
            const candidate = messages[i];
            if (!candidate || candidate.withdrawn) continue;
            nextVisibleMsg = candidate;
            break;
        }
        if (!nextVisibleMsg) return true;
        if (!msg.isMine && nextVisibleMsg.isMine) return true;
        return false;
    };

    return `
        <div class="chat-fullscreen" onclick="handleChatGlobalClick(event)">
            <div class="chat-header">
                <div class="back-btn" onclick="closeChat()">‹</div>
                <img class="avatar-36" src="${contact.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}">
                <div class="flex-1">
                    <div class="text-15-medium">${contact.remark || contact.name}</div>
                    <div class="text-12-muted">${state.messageSelectMode ? `已选择 ${state.selectedMessages.length} 条` : (chat?.isTyping ? '对方正在输入...' : '在线')}</div>
                </div>
                <div class="chat-header-actions">
                    ${state.messageSelectMode ? `
                        <button type="button" class="message-select-forward-btn" onclick="openForwardModal()" ${state.selectedMessages.length ? '' : 'disabled'} title="转发">
                            <span class="message-select-forward-icon" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/System/share-forward-line.svg')"></span>
                        </button>
                        <button type="button" class="message-select-all-btn" onclick="selectAllMessages()">全选</button>
                    ` : ''}
                    <div class="menu-btn" onclick="openChatSettings()">⋮</div>
                </div>
            </div>
            <div class="chat-messages" onclick="hideMessageContextMenu(event)">
                ${messages.length === 0 && !chat?.isTyping ? `<div class="empty-state-text">暂无消息</div>` : ''}
                ${messages.map((msg, index) => {
                    const viewMsg = (!msg.isMine && typeof coerceMessageToSticker === 'function')
                        ? coerceMessageToSticker(msg)
                        : msg;
                    const forwardFromTag = viewMsg.isForwarded && viewMsg.forwardFrom && !viewMsg.isForwardMerged
                        ? `<div class="forward-from-tag">转发自 ${viewMsg.forwardFrom}</div>`
                        : '';
                    const mergedPreviewHtml = viewMsg.isForwardMerged
                        ? (viewMsg.forwardRecord?.items || []).slice(0, 4).map(item =>
                            `<div class="forward-merged-line">${item.author}: ${getForwardItemDisplayText(item)}</div>`
                        ).join('')
                        : '';
                    const mergedCount = viewMsg.forwardRecord?.items?.length || 0;
                    return `
                    <div class="message-item ${viewMsg.isMine ? 'mine' : ''} ${viewMsg.withdrawn ? 'withdrawn-row' : ''} ${((viewMsg.isMine ? showUserAvatar : showRoleAvatar) || viewMsg.withdrawn) ? '' : 'no-avatar'} ${state.messageSelectMode && state.selectedMessages.includes(index) ? 'selected' : ''}"
                        data-message-index="${index}"
                        onclick="onMessageItemClick(${index})"
                        oncontextmenu="showMessageContextMenu(event, ${index})"
                        onmousedown="startMessageLongPress(event, ${index})"
                        onmouseup="cancelMessageLongPress()"
                        onmouseleave="cancelMessageLongPress()"
                        ontouchstart="startMessageLongPress(event, ${index})"
                        ontouchend="cancelMessageLongPress()">
                        ${(viewMsg.isMine ? showUserAvatar : showRoleAvatar) ? `<img class="message-avatar" src="${viewMsg.isMine ? (state.currentUser?.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E') : (contact.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E')}">` : ''}
                        <div class="message-bubble ${viewMsg.isForwardMerged ? 'message-bubble-forward-merged' : ''} ${viewMsg.isSticker ? 'message-bubble-sticker' : (viewMsg.isMockImage ? 'message-bubble-image' : '')}">
                            ${viewMsg.withdrawn ? `
                                <div class="withdraw-notice">
                                    <span>${viewMsg.isMine ? '你撤回了一条消息' : `${contact.remark || contact.name}撤回了一条消息`}</span>
                                    ${viewMsg.isMine ? '' : `<button class="withdraw-view-btn" onclick="event.stopPropagation(); openWithdrawContent(${index})">查看</button>`}
                                </div>
                            ` : viewMsg.isForwardMerged ? `
                                <div class="message-content message-forward-merged" onclick="event.stopPropagation(); openForwardRecordByMessageIndex(${index})">
                                    <div class="forward-merged-title">${viewMsg.forwardRecord?.title || '聊天记录'}</div>
                                    <div class="forward-merged-preview">
                                        ${mergedPreviewHtml}
                                        <div class="forward-merged-divider"></div>
                                        <div class="forward-merged-footer">聊天记录</div>
                                    </div>
                                </div>
                            ` : viewMsg.isCameraImage ? `
                                <div class="message-content message-content-photo">
                                    ${forwardFromTag}
                                    <div class="message-photo-card">
                                        <img class="message-photo-img" src="${viewMsg.imageData || ''}" alt="${viewMsg.text || '图片'}">
                                    </div>
                                </div>
                            ` : viewMsg.isMockImage ? `
                                <div class="message-content message-content-image">
                                    ${forwardFromTag}
                                    <div class="mock-image-note">
                                        <div class="mock-image-note-text">${viewMsg.text}</div>
                                    </div>
                                </div>
                            ` : viewMsg.isMockVoice ? `
                                ${forwardFromTag}
                                <div class="message-content message-content-voice" onclick="event.stopPropagation(); toggleMockVoiceText(${index})">
                                    <span class="voice-play-icon">▶</span>
                                    <span class="voice-wave"></span>
                                    <span class="voice-duration">${getMockVoiceDurationSeconds(viewMsg.text)}"</span>
                                </div>
                                ${viewMsg.showVoiceText ? `<div class="voice-transcript">${viewMsg.text}</div>` : ''}
                            ` : viewMsg.isSticker ? `
                                <div class="message-content message-content-sticker">
                                    ${forwardFromTag}
                                    ${viewMsg.quotedMessage ? `
                                        <div class="quoted-message-block">
                                            <div class="quoted-message-author">${viewMsg.quotedMessage.author || '引用消息'}</div>
                                            <div class="quoted-message-text">${getQuotedMessageDisplayText(viewMsg.quotedMessage)}</div>
                                        </div>
                                    ` : ''}
                                    ${viewMsg.stickerUrl ? `
                                        <img class="message-sticker-img" src="${viewMsg.stickerUrl}" alt="${viewMsg.stickerDesc || viewMsg.text || '表情'}">
                                    ` : `
                                        <div class="message-sticker-fallback">${viewMsg.stickerDesc || viewMsg.text || '表情'}</div>
                                    `}
                                </div>
                            ` : `
                                ${viewMsg.text.trim() || viewMsg.quotedMessage ? `
                                    <div class="message-content">
                                        ${forwardFromTag}
                                        ${viewMsg.quotedMessage ? `
                                            <div class="quoted-message-block">
                                                <div class="quoted-message-author">${viewMsg.quotedMessage.author || '引用消息'}</div>
                                                <div class="quoted-message-text">${getQuotedMessageDisplayText(viewMsg.quotedMessage)}</div>
                                            </div>
                                        ` : ''}
                                        ${viewMsg.text.trim() ? `<div class="quoted-reply-text">${typeof extractStickerDescFromText === 'function' ? (extractStickerDescFromText(viewMsg.text) || viewMsg.text) : viewMsg.text}</div>` : ''}
                                    </div>
                                ` : ''}
                            `}
                        </div>
                        ${shouldShowTimestamp(index) ? `<div class="message-time message-time-inline">${viewMsg.time}</div>` : ''}
                        ${state.messageSelectMode ? `<div class="message-check ${state.selectedMessages.includes(index) ? 'checked' : ''}">${state.selectedMessages.includes(index) ? '✓' : ''}</div>` : ''}
                    </div>
                `;
                }).join('')}
                ${chat?.isTyping ? `
                    <div class="message-item ${showRoleAvatar ? '' : 'no-avatar'}">
                        ${showRoleAvatar ? `<img class="message-avatar" src="${contact.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}">` : ''}
                        <div class="message-bubble">
                            <div class="typing-indicator">
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                            </div>
                        </div>
                    </div>
                ` : ''}
                ${state.messageSelectMode ? `
                    <div class="message-select-divider-wrap">
                        <span class="message-select-divider-line"></span>
                        <button class="message-select-to-here" onclick="event.stopPropagation(); selectMessagesToHereFromDivider()">选中到这里</button>
                        <span class="message-select-divider-line"></span>
                    </div>
                ` : ''}
            </div>
            ${state.messageSelectMode ? `
                <div class="message-select-bar">
                    <div class="message-select-cancel" onclick="exitMessageSelectMode()">取消</div>
                    <div class="message-select-actions">
                        <button type="button" class="message-select-clear" onclick="clearSelectedMessages()">取消选中</button>
                        <button class="btn-danger-sm message-select-delete" onclick="deleteSelectedMessages()">🗑</button>
                    </div>
                </div>
            ` : `
                <div class="chat-input-stack">
                ${state.replyingQuote ? `
                    <div class="replying-quote-bar">
                        <div class="replying-quote-main">
                            <div class="replying-quote-title">引用 ${state.replyingQuote.author || '角色'}</div>
                            <div class="replying-quote-text">${getQuotedMessageDisplayText(state.replyingQuote)}</div>
                        </div>
                        <button class="replying-quote-close" onclick="clearReplyingQuote()">×</button>
                    </div>
                ` : ''}
                ${renderChatInputStickerSuggest()}
                <div class="chat-input-bar">
                    <input
                        class="chat-input"
                        id="chatInput"
                        placeholder="输入消息或表情描述..."
                        value="${state.chatInputStickerSuggestKeyword || ''}"
                        oncompositionstart="setChatInputComposing(true)"
                        oncompositionend="setChatInputComposing(false); updateChatInputStickerSuggest(this.value, this.selectionStart, this.selectionEnd, true)"
                        oninput="handleChatInputChange(this.value, this.selectionStart, this.selectionEnd, (typeof event !== 'undefined' && event && event.isComposing))"
                        onkeyup="handleChatInputKeyup(this.value, this.selectionStart, this.selectionEnd, (typeof event !== 'undefined' && event ? event.keyCode : 0), (typeof event !== 'undefined' && event && event.isComposing))"
                        onkeydown="handleChatInputKeydown(event)"
                    >
                    <button class="receive-btn" onclick="receiveMessage()"><img class="icon-20" src="https://img.heliar.top/file/1779243354774_内部传输_internal-transmission.png"></button>
                    <button class="send-btn" onclick="sendMessage()"><img class="icon-20" src="https://img.heliar.top/file/1779242699503_发送_send.png"></button>
                </div>
                </div>
                <div class="chat-tools-bar">
                    <button class="chat-tool-btn" onclick="openMockVoiceModal()"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414599723_mic-fill.svg')"></span></button>
                    <button class="chat-tool-btn" onclick="handleChatToolClick('图片')"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414606124_image-fill.svg')"></span></button>
                    <button class="chat-tool-btn" onclick="handleChatToolClick('相机')"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414599852_camera-fill.svg')"></span></button>
                    <button class="chat-tool-btn" onclick="handleChatToolClick('表情')"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414603496_emotion-line.svg')"></span></button>
                    <button class="chat-tool-btn" onclick="handleChatToolClick('加号')"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414609713_add-line.svg')"></span></button>
                </div>
                <input type="file" id="cameraImageInput" class="hidden-file-input" accept="image/*" capture="environment" onchange="onCameraImageSelected(event)">
                ${renderStickerPanel()}
                ${renderStickerManagerModal()}
                ${renderPlusPanel()}
            `}
            ${renderMessageContextMenu()}
        </div>
    `;
}

function renderChatSettingsPage(contact, chat) {
    const displayName = contact.remark || contact.name;
    const hideRoleAvatar = contact.showRoleAvatar === false;
    const hideUserAvatar = contact.showUserAvatar === false;
    const proactiveCall = contact.proactiveCall !== false;
    const specialCare = !!contact.specialCare;
    const translateMode = !!contact.translateMode;
    const specialCareToneFileName = contact.specialCareToneFileName || '选择音频文件';
    const messageToneFileName = contact.messageToneFileName || '选择音频文件';

    return `
        <div class="chat-fullscreen chat-settings-page">
            <div class="chat-header">
                <div class="back-btn" onclick="closeChatSettings()">‹</div>
                <div class="header-title">聊天设置</div>
                <div></div>
            </div>
            <div class="chat-settings-content">
                <div class="chat-settings-card chat-settings-card-profile">
                    <div class="chat-settings-contact">
                        <img class="avatar-50" src="${contact.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}">
                        <div class="chat-settings-contact-name">${displayName}</div>
                    </div>
                    <button class="chat-settings-item" onclick="alert('发起群聊功能开发中')">
                        <span class="chat-settings-action-left">
                            <span class="chat-settings-plus-btn">+</span>
                            <span>发起群聊</span>
                        </span>
                    </button>
                </div>

                <div class="chat-settings-card">
                    <button class="chat-settings-item" onclick="alert('查找聊天记录功能开发中')"><span>查找聊天记录</span><span>›</span></button>
                </div>

                <div class="chat-settings-card">
                    <label class="chat-settings-item switch-row">
                        <span>主动打电话</span>
                        <span class="switch">
                            <input type="checkbox" ${proactiveCall ? 'checked' : ''} onchange="toggleCurrentChatSetting('proactiveCall', this.checked)">
                            <span class="slider"></span>
                        </span>
                    </label>
                    <label class="chat-settings-item switch-row">
                        <span>隐藏角色头像</span>
                        <span class="switch">
                            <input type="checkbox" ${hideRoleAvatar ? 'checked' : ''} onchange="toggleCurrentChatSetting('showRoleAvatar', !this.checked); initChatApp();">
                            <span class="slider"></span>
                        </span>
                    </label>
                    <label class="chat-settings-item switch-row">
                        <span>隐藏用户头像</span>
                        <span class="switch">
                            <input type="checkbox" ${hideUserAvatar ? 'checked' : ''} onchange="toggleCurrentChatSetting('showUserAvatar', !this.checked); initChatApp();">
                            <span class="slider"></span>
                        </span>
                    </label>
                </div>

                <div class="chat-settings-card">
                    <label class="chat-settings-item switch-row">
                        <span>特别关心</span>
                        <span class="switch">
                            <input type="checkbox" ${specialCare ? 'checked' : ''} onchange="toggleCurrentChatSetting('specialCare', this.checked)">
                            <span class="slider"></span>
                        </span>
                    </label>
                    <button class="chat-settings-item" onclick="document.getElementById('specialCareToneInput')?.click()">
                        <span>特别关心提示音</span>
                        <span class="chat-settings-file-name">${specialCareToneFileName}</span>
                    </button>
                    <input id="specialCareToneInput" class="chat-settings-hidden-input" type="file" accept="audio/*" onchange="setCurrentChatToneFile('specialCareToneFileName', this.files && this.files[0] ? this.files[0].name : '')">
                    <button class="chat-settings-item" onclick="document.getElementById('messageToneInput')?.click()">
                        <span>消息提示音</span>
                        <span class="chat-settings-file-name">${messageToneFileName}</span>
                    </button>
                    <input id="messageToneInput" class="chat-settings-hidden-input" type="file" accept="audio/*" onchange="setCurrentChatToneFile('messageToneFileName', this.files && this.files[0] ? this.files[0].name : '')">
                    <label class="chat-settings-item switch-row">
                        <span>翻译模式</span>
                        <span class="switch">
                            <input type="checkbox" ${translateMode ? 'checked' : ''} onchange="toggleCurrentChatSetting('translateMode', this.checked)">
                            <span class="slider"></span>
                        </span>
                    </label>
                </div>

                <div class="chat-settings-card">
                    <button class="chat-settings-item" onclick="alert('设置当前聊天背景功能开发中')"><span>设置当前聊天背景</span><span>›</span></button>
                </div>

                <div class="chat-settings-danger-tip"><span class="chat-settings-danger-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3L1 21h22L12 3zm0 5.8c.55 0 1 .45 1 1V14a1 1 0 1 1-2 0V9.8c0-.55.45-1 1-1zm0 9.4a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg></span>危险操作</div>
                <div class="chat-settings-card">
                    <button class="chat-settings-item danger" onclick="clearCurrentChatMessages()"><span>删除聊天记录</span></button>
                    <button class="chat-settings-item danger" onclick="deleteCurrentChatFriend()"><span>删除好友</span></button>
                </div>
            </div>
        </div>
    `;
}

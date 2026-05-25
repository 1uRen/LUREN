// chat-render-core module
function shouldHideMainNav() {
    if (state.walletOpen) return false;
    if (state.viewingForwardRecord) return true;
    if (state.showSignatureHistory) return true;
    if (state.currentProfileContact) return true;
    if (state.showGroupManager) return true;
    if (state.showFriendRequests) return true;
    if (state.currentPage === 'messages' && state.messageSearchOpen) return true;
    if (state.currentPage === 'messages' && state.currentChatContact) return true;
    return false;
}

function renderChatApp() {
    const showTabBar = !shouldHideMainNav() && !state.walletOpen;
    return `
        <div class="chat-app">
            ${renderSidebar()}
            <div class="main-content${showTabBar ? ' with-tab-bar' : ''}">
                ${renderHeader()}
                ${renderContent()}
                ${renderBottomNav()}
            </div>
            <div class="drag-handle" onclick="openSidebar()">☰</div>
            ${renderModals()}
        </div>
    `;
}

function renderHeader() {
    if (shouldHideMainNav()) {
        return '';
    }
    if (state.walletOpen) {
        return `
            <div class="chat-header">
                <div class="back-btn" onclick="closeWallet()">←</div>
                <div class="header-title">我的钱包</div>
                <div></div>
            </div>
        `;
    }
    const title = state.currentPage === 'messages' ? '消息' : state.currentPage === 'contacts' ? '联系人' : '动态';
    return `
        <div class="chat-header">
            <div class="back-btn" onclick="goBack()">←</div>
            <div class="header-title">${title}</div>
            <div></div>
        </div>
    `;
}

function renderContent() {
    if (state.walletOpen) {
        return renderWalletPage();
    }
    if (state.viewingForwardRecord) {
        return renderForwardRecordPage();
    }
    if (state.showSignatureHistory) {
        return renderSignatureHistoryPage();
    }
    if (state.currentProfileContact) {
        return renderProfilePage();
    }
    if (state.currentPage === 'messages') {
        if (state.currentChatContact) {
            return renderChatInterface();
        }
        if (state.messageSearchOpen) {
            if (state.messageSearchSubView === 'contacts') {
                return renderMessageSearchContactsMore();
            }
            if (state.messageSearchSubView === 'chats') {
                return renderMessageSearchChatsMore();
            }
            if (state.messageSearchSubView === 'groups') {
                return renderMessageSearchGroupsMore();
            }
            if (state.messageSearchSubView === 'chatDetail') {
                return renderMessageSearchChatDetail();
            }
            return renderMessageSearchMain();
        }
        return renderChatList();
    } else if (state.currentPage === 'contacts') {
        if (state.showGroupManager) {
            return renderGroupManager();
        }
        if (state.showFriendRequests) {
            return `
                <div class="chat-fullscreen">
                    <div class="chat-header">
                        <button class="back-btn" onclick="closeFriendRequests()">‹</button>
                        <div class="friend-requests-title">好友申请</div>
                        <div></div>
                    </div>
                    <div class="friend-requests-body">
                        ${state.friendRequests.length ? state.friendRequests.map((request, index) => `
                            <div class="friend-request-card">
                                <div class="friend-request-row">
                                    <img class="avatar-44" src="${request.contact.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}">
                                    <div class="flex-1">
                                        <div class="text-15-medium">${request.contact.name}</div>
                                        <div class="text-12-muted">请求添加你为好友</div>
                                    </div>
                                    <div class="btn-row">
                                        <button class="btn-secondary-sm" onclick="rejectFriendRequest(${index})">拒绝</button>
                                        <button class="btn-primary-sm" onclick="acceptFriendRequest(${index})">接受</button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state-text">暂无好友申请</div>'}
                    </div>
                </div>
            `;
        }
        return `
            <div class="chat-content chat-scroll-host">
                <div class="contacts-page chat-scroll-body">
                    ${renderContactsContent()}
                </div>
            </div>
        `;
    } else {
        return `
            <div class="chat-content">
                <div class="posts-page">
                    <div class="post-card">
                        <div class="post-item">
                            <span class="post-title">空间动态</span>
                            <span>›</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function escapeHtmlAttr(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function renderForwardRecordPage() {
    const record = state.viewingForwardRecord;
    const items = record?.items || [];
    const userName = record?.userName || state.currentUser?.nickname || '你';
    const sourceName = record?.sourceName || '对方';
    const userAvatar = record?.userAvatar || state.currentUser?.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E';
    const roleAvatar = record?.sourceAvatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E';

    function renderForwardItem(item, itemIndex) {
        if (item.isForwardMerged && item.forwardRecord) {
            const isUser = item.isMine || item.author === userName;
            // 嵌套的聊天记录，显示为卡片
            return `
                <div class="message-item ${isUser ? 'mine' : ''}">
                    <img class="message-avatar" src="${isUser ? userAvatar : roleAvatar}">
                    <div class="message-bubble message-bubble-forward-merged">
                        <div class="message-content message-forward-merged" onclick="event.stopPropagation(); openNestedForwardRecord(${itemIndex})">
                            <div class="forward-merged-title">${item.forwardRecord?.title || '聊天记录'}</div>
                            <div class="forward-merged-preview">
                                ${(item.forwardRecord?.items || []).slice(0, 4).map(nestedItem =>
                                    `<div class="forward-merged-line">${nestedItem.author}: ${getForwardItemDisplayText(nestedItem)}</div>`
                                ).join('')}
                                <div class="forward-merged-divider"></div>
                                <div class="forward-merged-footer">聊天记录</div>
                            </div>
                        </div>
                    </div>
                    ${item.time ? `<div class="message-time message-time-inline">${item.time}</div>` : ''}
                </div>
            `;
        }

        const isUser = item.isMine || item.author === userName;
        const displayText = getForwardItemDisplayText(item);

        let bubbleContent = '';
        if (item.isSticker) {
            bubbleContent = `
                <div class="message-content message-content-sticker">
                    ${item.stickerUrl ? `
                        <img class="message-sticker-img" src="${item.stickerUrl}" alt="${item.stickerDesc || displayText || '表情'}">
                    ` : `
                        <div class="message-sticker-fallback">${item.stickerDesc || displayText || '表情'}</div>
                    `}
                </div>
            `;
        } else if (item.isMockImage || item.isCameraImage) {
            bubbleContent = `
                <div class="message-content message-content-image">
                    ${item.isCameraImage && item.imageData ? `
                        <div class="message-photo-card">
                            <img class="message-photo-img" src="${item.imageData}" alt="${item.imageName || displayText || '图片'}">
                        </div>
                    ` : `
                        <div class="mock-image-note">
                            <div class="mock-image-note-text">${item.text || item.imageName || displayText}</div>
                        </div>
                    `}
                </div>
            `;
        } else if (item.isMockVoice) {
            bubbleContent = `
                <div class="message-content message-content-voice" onclick="event.stopPropagation(); toggleMockVoiceTextForward(${itemIndex})">
                    <span class="voice-play-icon">▶</span>
                    <span class="voice-wave"></span>
                    <span class="voice-duration">${getMockVoiceDurationSeconds(item.text)}"</span>
                </div>
            `;
        } else {
            bubbleContent = `
                <div class="message-content">
                    ${item.quotedMessage ? `
                        <div class="quoted-message-block">
                            <div class="quoted-message-author">${item.quotedMessage.author || '引用消息'}</div>
                            <div class="quoted-message-text">${getQuotedMessageDisplayText(item.quotedMessage)}</div>
                        </div>
                    ` : ''}
                    ${displayText ? `<div class="quoted-reply-text">${displayText}</div>` : ''}
                </div>
            `;
        }

        return `
            <div class="message-item ${isUser ? 'mine' : ''}">
                <img class="message-avatar" src="${isUser ? userAvatar : roleAvatar}">
                <div class="message-bubble ${item.isSticker ? 'message-bubble-sticker' : (item.isMockImage || item.isCameraImage ? 'message-bubble-image' : '')}">
                    ${bubbleContent}
                </div>
                ${item.time ? `<div class="message-time message-time-inline">${item.time}</div>` : ''}
            </div>
        `;
    }

    return `
        <div class="chat-fullscreen forward-record-page">
            <div class="chat-header">
                <div class="back-btn" onclick="closeForwardRecord()">‹</div>
                <div class="flex-1">
                    <div class="text-15-medium">${record?.title || '聊天记录'}</div>
                </div>
                <div></div>
            </div>
            <div class="chat-messages">
                ${items.length ? items.map((item, index) => renderForwardItem(item, index)).join('') : '<div class="empty-state-text">暂无消息</div>'}
            </div>
        </div>
    `;
}

function renderBottomNav() {
    const totalUnread = Object.values(state.unreadMessages).reduce((sum, count) => sum + count, 0);
    const isMessages = state.currentPage === 'messages';
    const isContacts = state.currentPage === 'contacts';
    const isPosts = state.currentPage === 'posts';
    const messageIcon = isMessages
        ? 'https://img.heliar.top/file/1779413261667_message-2-fill.svg'
        : 'https://img.heliar.top/file/1779413265756_message-2-line.svg';
    const contactsIcon = isContacts
        ? 'https://img.heliar.top/file/1779413262148_user-3-fill.svg'
        : 'https://img.heliar.top/file/1779413265763_user-3-line.svg';
    const postsIcon = isPosts
        ? 'https://img.heliar.top/file/1779413261492_star-smile-fill.svg'
        : 'https://img.heliar.top/file/1779413265219_star-smile-line.svg';
    
    // 子页面与钱包页不显示底部导航
    if (shouldHideMainNav() || state.walletOpen) {
        return '';
    }
    
    return `
        <div class="bottom-nav">
            <div class="nav-item ${isMessages ? 'active' : ''}" onclick="switchPage('messages')">
                <div class="nav-icon-wrap">
                    <span class="nav-icon-svg" style="--icon-url:url('${messageIcon}')"></span>
                    ${totalUnread > 0 ? `<div class="nav-unread-badge">${totalUnread}</div>` : ''}
                </div>
                <span>消息</span>
            </div>
            <div class="nav-item ${isContacts ? 'active' : ''}" onclick="switchPage('contacts')"><span class="nav-icon-svg" style="--icon-url:url('${contactsIcon}')"></span> <span>联系人</span></div>
            <div class="nav-item ${isPosts ? 'active' : ''}" onclick="switchPage('posts')"><span class="nav-icon-svg" style="--icon-url:url('${postsIcon}')"></span> <span>动态</span></div>
        </div>
    `;
}

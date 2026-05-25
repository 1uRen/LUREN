// chat-render-modals module
function renderModals() {
    let modals = '';

    if (state.viewingWithdrawMessage !== null) {
        modals += `
            <div class="chat-modal show" onclick="closeWithdrawContent()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-title">撤回消息内容</div>
                    <div class="withdraw-content-box">${state.viewingWithdrawMessage}</div>
                    <button class="modal-btn primary" onclick="closeWithdrawContent()">关闭</button>
                </div>
            </div>
        `;
    }

    if (state.editingMessageIndex !== null) {
        modals += `
            <div class="chat-modal show" onclick="closeEditMessageModal(); initChatApp();">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-title">编辑消息</div>
                    <div class="edit-format-row">
                        <span class="edit-format-label">消息类型</span>
                        <select class="edit-type-select" id="editMessageType" onchange="state.editingMessageType=this.value">
                            <option value="text" ${state.editingMessageType === 'text' ? 'selected' : ''}>文字气泡</option>
                            <option value="voice" ${state.editingMessageType === 'voice' ? 'selected' : ''}>语音气泡</option>
                            <option value="image" ${state.editingMessageType === 'image' ? 'selected' : ''}>图片气泡</option>
                            <option value="sticker" ${state.editingMessageType === 'sticker' ? 'selected' : ''}>表情气泡</option>
                        </select>
                    </div>
                    <textarea class="edit-textarea" id="editMessageText" oninput="state.editingMessageText=this.value" placeholder="请输入消息内容">${state.editingMessageText || ''}</textarea>
                    <button class="modal-btn primary" onclick="saveEditedMessage()">保存</button>
                    <button class="modal-cancel-link" onclick="closeEditMessageModal(); initChatApp();">取消</button>
                </div>
            </div>
        `;
    }

    if (state.showMockVoiceModal) {
        modals += `
            <div class="chat-modal show" onclick="closeMockVoiceModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-title">模拟语音输入</div>
                    <input class="mock-voice-input" id="mockVoiceInput" value="${state.mockVoiceText || ''}" placeholder="输入语音内容..." oninput="updateMockVoiceText(this.value)" onkeydown="if(event.keyCode===13) sendMockVoiceMessage()">
                    <button class="modal-btn primary" onclick="sendMockVoiceMessage()">发送模拟语音</button>
                    <button class="modal-cancel-link" onclick="closeMockVoiceModal()">取消</button>
                </div>
            </div>
        `;
    }

    if (state.showMockImageModal) {
        modals += `
            <div class="chat-modal show" onclick="closeMockImageModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-title">模拟图片发送</div>
                    <input class="mock-voice-input" id="mockImageInput" value="${state.mockImageText || ''}" placeholder="输入模拟该图片的文字..." oninput="updateMockImageText(this.value)" onkeydown="if(event.keyCode===13) sendMockImageMessage()">
                    <button class="modal-btn primary" onclick="sendMockImageMessage()">发送模拟图片</button>
                    <button class="modal-cancel-link" onclick="closeMockImageModal()">取消</button>
                </div>
            </div>
        `;
    }

    if (state.showAddFriendModal) {
        modals += renderAddFriendModal();
    }

    if (state.showCreateContactModal) {
        modals += `
            <div class="chat-modal show">
                <div class="modal-content">
                    <div class="modal-title">创建角色</div>
                    <div class="edit-form">
                        <div class="form-group">
                            <div class="avatar-pick-wrap">
                                <button type="button" class="avatar-pick-btn" onclick="openFriendAvatarFilePicker()" aria-label="选择头像">
                                    <img class="avatar-preview avatar-pick-img" src="${state.newFriend.avatar || DEFAULT_CONTACT_AVATAR}" alt="">
                                </button>
                                <input class="edit-input nick-input" id="friendNick" value="${state.newFriend.name || ''}" placeholder="昵称">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="row-gap-10">
                                <input class="edit-input input-flex" id="friendRemark" value="${state.newFriend.remark || ''}" placeholder="备注">
                                <input class="edit-input input-flex" id="friendQQ" value="${state.newFriend.qqId}" placeholder="QQ号">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="row-gap-10">
                                <input class="edit-input input-flex" id="friendGender" value="${state.newFriend.gender || ''}" placeholder="性别">
                                <input class="edit-input input-flex" id="friendBirthday" value="${state.newFriend.birthday || ''}" placeholder="生日 (X月X日)">
                            </div>
                        </div>
                        <div class="form-group">
                            <textarea class="edit-textarea" id="friendSetting" placeholder="角色设定">${state.newFriend.setting || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <select class="edit-input" id="friendGroup">
                                ${state.groups.map(g => `<option value="${g}" ${state.newFriend.group === g ? 'selected' : ''}>${g}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <div class="between-row">
                                <span>主动加好友</span>
                                <label class="switch">
                                    <input type="checkbox" id="friendAutoAdd" ${state.newFriend.autoAddFriend ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group" id="autoAddChanceGroup" style="${state.newFriend.autoAddFriend ? 'display:block;' : 'display:none;'}">
                            <div class="between-row mb-8">
                                <span>添加几率</span>
                                <span>${state.newFriend.addChance || 80}%</span>
                            </div>
                            <input type="range" class="full-width" id="addChanceSlider" min="10" max="100" value="${state.newFriend.addChance || 80}">
                        </div>
                    </div>
                    <button class="modal-btn primary" onclick="createContact()">创建</button>
                    <button class="modal-cancel-link" onclick="closeCreateContactModal()">取消</button>
                </div>
            </div>
        `;
    }

    if (state.editingContactIndex !== null) {
        const contact = state.contacts[state.editingContactIndex];
        modals += `
            <div class="chat-modal show">
                <div class="modal-content">
                    <div class="modal-title">编辑角色</div>
                    <div class="edit-form">
                        <div class="form-group">
                            <div class="avatar-pick-wrap">
                                <button type="button" class="avatar-pick-btn" onclick="openEditContactAvatarFilePicker()" aria-label="选择头像">
                                    <img class="avatar-preview avatar-pick-img" src="${state.editingContactAvatar || contact.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}" alt="">
                                </button>
                                <input class="edit-input nick-input" id="editContactNick" value="${contact.name || ''}" placeholder="昵称">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="row-gap-10">
                                <input class="edit-input input-flex" id="editContactRemark" value="${contact.remark || ''}" placeholder="备注">
                                <input class="edit-input input-flex" id="editContactQQ" value="${contact.qqId}" placeholder="QQ号">
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="row-gap-10">
                                <input class="edit-input input-flex" id="editContactGender" value="${contact.gender || ''}" placeholder="性别">
                                <input class="edit-input input-flex" id="editContactBirthday" value="${contact.birthday || ''}" placeholder="生日 (X月X日)">
                            </div>
                        </div>
                        <div class="form-group">
                            <textarea class="edit-textarea" id="editContactSetting" placeholder="角色设定">${contact.setting || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <select class="edit-input" id="editContactGroup">
                                ${state.groups.map(g => `<option value="${g}" ${contact.group === g ? 'selected' : ''}>${g}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <div class="between-row">
                                <span>主动加好友</span>
                                <label class="switch">
                                    <input type="checkbox" id="editContactAutoAdd" ${contact.autoAddFriend ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group" id="editAutoAddChanceGroup" style="${contact.autoAddFriend ? 'display:block;' : 'display:none;'}">
                            <div class="between-row mb-8">
                                <span>添加几率</span>
                                <span>${contact.addChance || 80}%</span>
                            </div>
                            <input type="range" class="full-width" id="editAddChanceSlider" min="10" max="100" value="${contact.addChance || 80}">
                        </div>
                    </div>
                    <button class="modal-btn primary" onclick="saveContact()">保存</button>
                    <button class="modal-cancel-link" onclick="closeEditContactModal()">取消</button>
                </div>
            </div>
        `;
    }

    if (state.uploadMode) {
        const isBackgroundMode = state.uploadMode === 'background' || state.uploadMode === 'profileBackground';
        modals += `
            <div class="chat-modal show">
                <div class="modal-content">
                    <div class="modal-title">${state.uploadMode === 'avatar' ? '更换头像' : '更换背景'}</div>
                    <button class="modal-btn primary" onclick="uploadFile()">📁 选择本地图片</button>
                    <button class="modal-btn secondary" onclick="toggleUrlInput()">🔗 输入图片链接</button>
                    ${isBackgroundMode ? `<button class="modal-btn secondary" onclick="resetBackgroundToDefault()">↺ 恢复默认背景</button>` : ''}
                    <div class="url-input-container" id="urlContainer">
                        <input class="url-input" id="urlInput" placeholder="请输入图片URL">
                        <button class="modal-btn primary" onclick="uploadUrl()">确认</button>
                    </div>
                    <button class="modal-cancel-link" onclick="closeModals()">取消</button>
                </div>
            </div>
        `;
    }

    if (state.showAccountModal && !state.editingAccountIndex) {
        modals += `
            <div class="chat-modal show">
                <div class="modal-content">
                    <div class="modal-title">账号管理</div>
                    <div class="account-list">
                        ${state.users.map((u, i) => `
                            <div class="account-item">
                                <div class="account-info" onclick="switchAccount(${i})">
                                    <img class="account-avatar" src="${u.avatar}">
                                    <div>
                                        <div>${u.nickname}</div>
                                        <div class="text-12-muted">QQ: ${u.qqId}</div>
                                    </div>
                                </div>
                                <div class="account-actions">
                                    <button class="account-edit-btn" onclick="editAccount(${i})">编辑</button>
                                    ${i === 0 ? `<button class="account-delete-btn account-delete-btn-disabled" disabled>🗑</button>` : `<button class="account-delete-btn" onclick="deleteAccount(${i})">🗑</button>`}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="modal-btn secondary" onclick="createAccount()">➕ 创建新账号</button>
                    <button class="modal-cancel-link" onclick="closeModals()">取消</button>
                </div>
            </div>
        `;
    }

    if (state.editingAccountIndex !== null || state.isCreatingNewAccount) {
        const user = state.isCreatingNewAccount ? {
            avatar: state.users[0].avatar,
            nickname: '',
            qqId: '',
            gender: '男',
            userSetting: ''
        } : state.users[state.editingAccountIndex];
        modals += `
            <div class="chat-modal show">
                <div class="modal-content">
                    <div class="modal-title">${state.isCreatingNewAccount ? '创建新账号' : '编辑账号'}</div>
                    <div class="edit-form">
                        <div class="form-group">
                            <div class="row-center-12">
                                <button type="button" class="avatar-pick-btn avatar-pick-btn-inline" onclick="openAvatarFilePicker(${state.isCreatingNewAccount ? state.users.length : state.editingAccountIndex})" aria-label="选择头像">
                                    <img class="avatar-preview avatar-clickable" src="${state.editingAvatar || user.avatar}" alt="">
                                </button>
                                <button type="button" class="change-avatar-btn" onclick="openAvatarFilePicker(${state.isCreatingNewAccount ? state.users.length : state.editingAccountIndex})">更换头像</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <input class="edit-input" id="editNick" value="${user.nickname}" placeholder="昵称">
                        </div>
                        <div class="form-group">
                                <div class="gender-selector gender-selector-wrap">
                                    <label><input type="radio" name="gender" value="男" ${user.gender === '男' ? 'checked' : ''}>男</label>
                                    <label><input type="radio" name="gender" value="女" ${user.gender === '女' ? 'checked' : ''}>女</label>
                                    <label><input type="radio" name="gender" value="其他" ${user.gender === '其他' ? 'checked' : ''}>其他</label>
                                    <label><input type="radio" name="gender" value="custom" ${!['男', '女', '其他'].includes(user.gender) ? 'checked' : ''}>自定义</label>
                                    <input class="edit-input custom-gender-input" id="customGender" placeholder="自定义性别" style="${!['男', '女', '其他'].includes(user.gender) ? 'display:block;' : 'display:none;'}" value="${!['男', '女', '其他'].includes(user.gender) ? user.gender : ''}">
                                </div>
                            </div>
                        <div class="form-group">
                            <input class="edit-input" id="editQQ" value="${user.qqId}" placeholder="QQ号">
                        </div>
                        <div class="form-group">
                            <textarea class="edit-textarea" id="editUserSetting" placeholder="用户设定">${user.userSetting || ''}</textarea>
                        </div>
                    </div>
                    <button class="modal-btn primary" onclick="saveAccount()">保存</button>
                    <button class="modal-cancel-link" onclick="cancelEdit()">取消</button>
                </div>
            </div>
        `;
    }

    if (state.showForwardModal) {
        modals += renderForwardModal();
    }

    return modals + '<input type="file" id="fileInput" class="hidden-file-input" accept="image/*">';
}

function renderForwardModal() {
    const contacts = typeof getForwardableContacts === 'function' ? getForwardableContacts() : [];
    const selectedCount = state.selectedMessages.length;
    const selectedTargetId = typeof normalizeQQId === 'function'
        ? normalizeQQId(state.forwardTargetContactId)
        : String(state.forwardTargetContactId || '');
    const canConfirm = !!selectedTargetId && selectedCount > 0;
    const contactHtml = contacts.length
        ? contacts.map(contact => {
            const contactId = typeof normalizeQQId === 'function' ? normalizeQQId(contact.qqId) : String(contact.qqId || '');
            const active = selectedTargetId && selectedTargetId === contactId ? ' active' : '';
            return `
                <button type="button" class="forward-contact-item${active}" data-forward-contact-id="${escapeHtmlAttr(contactId)}">
                    <img class="avatar-36" src="${contact.avatar || DEFAULT_CONTACT_AVATAR}" alt="">
                    <div class="forward-contact-info">
                        <div class="text-15-medium">${contact.remark || contact.name}</div>
                        <div class="text-12-muted">${contact.qqId}</div>
                    </div>
                </button>
            `;
        }).join('')
        : '<div class="forward-contact-empty text-12-muted">暂无可转发的角色</div>';

    return `
        <div class="chat-modal show forward-modal-overlay">
            <div class="modal-content forward-modal">
                <div class="modal-title">转发消息</div>
                <div class="forward-mode-row">
                    <button type="button" class="forward-mode-btn ${state.forwardMode === 'merge' ? 'active' : ''}" data-forward-mode="merge">合并转发</button>
                    <button type="button" class="forward-mode-btn ${state.forwardMode === 'single' ? 'active' : ''}" data-forward-mode="single">逐条转发</button>
                </div>
                <div class="forward-selected-tip">已选 ${selectedCount} 条消息</div>
                <div class="forward-contact-list">${contactHtml}</div>
                <div class="forward-comment-wrap">
                    <input type="text" class="forward-comment-input" id="forwardCommentInput" placeholder="给好友留言..." value="${state.forwardComment || ''}" oninput="updateForwardComment(this.value)">
                </div>
                <button type="button" class="modal-btn primary ${canConfirm ? '' : 'disabled'}" data-forward-confirm ${canConfirm ? '' : 'disabled'}>发送</button>
                <button type="button" class="modal-cancel-link" data-forward-cancel>取消</button>
            </div>
        </div>
    `;
}

function renderContextMenu() {
    if (!state.contextMenu.show) return '';
    const chat = state.chats[state.contextMenu.chatIndex];
    if (!chat) return '';

    return `
        <div class="context-menu" style="left: ${state.contextMenu.x}px; top: ${state.contextMenu.y}px;">
            <div class="context-menu-item" onclick="togglePinChat(${state.contextMenu.chatIndex})">
                <span>${chat.pinned ? '取消置顶' : '置顶'}</span>
            </div>
            <div class="context-menu-item danger" onclick="deleteChat(${state.contextMenu.chatIndex})">
                <span>删除</span>
            </div>
        </div>
    `;
}

function renderMessageContextMenu() {
    if (!state.messageContextMenu.show || state.editingMessageIndex !== null) return '';
    if (!state.currentChatContact) return '';
    const chat = getChatByContactId(state.currentChatContact.qqId);
    const msg = chat?.messages?.[state.messageContextMenu.messageIndex];
    if (!msg) return '';

    const editDisabledClass = msg.withdrawn ? ' disabled' : '';
    const currentAssistantRound = getCurrentAssistantRoundRange(chat);
    const idx = state.messageContextMenu.messageIndex;
    const canReplayCurrentRound = !msg.isMine && !msg.withdrawn && currentAssistantRound
        && idx >= currentAssistantRound.start
        && idx <= currentAssistantRound.end;

    const items = [
        { label: '编辑', onclick: 'openEditMessage()', className: editDisabledClass.trim() },
        !msg.withdrawn ? { label: '复制', onclick: 'copyMessage()' } : null,
        msg.isMine ? { label: '撤回', onclick: 'withdrawMessage()', className: msg.withdrawn ? 'disabled' : '' } : null,
        canReplayCurrentRound ? { label: '重回', onclick: 'reopenAssistantRound()' } : null,
        !msg.withdrawn ? { label: '引用', onclick: 'quoteMessage()' } : null,
        { label: '多选', onclick: 'enterMessageSelectMode()' },
        { label: '删除', onclick: 'deleteMessage()', className: 'danger' }
    ].filter(Boolean);

    const itemHtml = items.map(item => {
        const extraClass = item.className ? ` ${item.className}` : '';
        return `<button type="button" class="message-context-menu-item${extraClass}" onclick="${item.onclick}"><span>${item.label}</span></button>`;
    }).join('');

    return `
        <div class="context-menu message-context-menu" style="left: ${state.messageContextMenu.anchorX}px; top: ${state.messageContextMenu.anchorY}px;">
            <div class="message-context-menu-grid">
                ${itemHtml}
            </div>
            <span class="message-context-menu-arrow" aria-hidden="true"></span>
        </div>
    `;
}
function renderStickerManagerModal() {
    if (!state.showStickerManagerModal) return '';
    return `
        <div class="chat-modal show">
            <div class="modal-content sticker-manager-modal" onclick="event.stopPropagation()">
                <div class="modal-title">添加表情包</div>
                <input class="edit-input" placeholder="分类名称（留空存入默认）" value="${state.stickerDraftCategoryName || ''}" oninput="updateStickerDraftField('category', this.value)">
                <textarea class="edit-textarea mt-10" placeholder="每行一个，格式：描述：图床链接&#10;也可粘贴纯链接自动修正" oninput="updateStickerDraftField('urlText', this.value)">${state.stickerDraftUrlText || ''}</textarea>
                <div class="row-gap-10 mt-10">
                    <button class="modal-btn secondary" onclick="parseStickerDraftUrls()">解析URL</button>
                    <button class="modal-btn secondary" onclick="document.getElementById('stickerLocalFileInput')?.click()">本地上传</button>
                </div>
                <input id="stickerLocalFileInput" class="hidden-file-input" type="file" accept="image/*" multiple onchange="handleStickerLocalFiles(event)">
                <div class="sticker-preview-grid">
                    ${state.stickerDraftPreviewItems.length ? state.stickerDraftPreviewItems.map(item => `
                        <div class="sticker-preview-item">
                            <img class="sticker-preview-img" src="${item.url}" alt="${item.desc || '表情'}">
                            <div class="sticker-preview-desc">${item.desc || '表情'}</div>
                            <button class="sticker-preview-remove" onclick="removeStickerDraftItem('${item.id}')">×</button>
                        </div>
                    `).join('') : `<div class="sticker-empty">暂无预览</div>`}
                </div>
                <button class="modal-btn primary" onclick="saveStickerDraftItems()">保存</button>
                <button class="modal-cancel-link" onclick="closeStickerManagerModal()">取消</button>
            </div>
        </div>
    `;
}

// chat-render-contacts module
function renderContactsContent() {
    const isContactAcceptedFriend = (contact) => !!contact?.isFriend;
    const acceptedContacts = state.contacts.filter(isContactAcceptedFriend);

    if (state.contactsTab === 'groups') {
        return `
            <div class="contact-actions">
                <button class="action-btn" onclick="openAddFriendModal()"><span class="action-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413778193_add-large-line.svg')"></span>添加好友</button>
                <button class="action-btn" onclick="alert('创建群聊功能开发中')"><span class="action-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413778420_group-fill.svg')"></span>创建群聊</button>
            </div>
            <div class="contact-notifications">
                <div class="notification-item" onclick="openFriendRequests()">
                    <span>新朋友</span>
                    ${state.friendRequests.length > 0 ? `<span class="notification-badge">${state.friendRequests.length}</span>` : ''}
                </div>
                <div class="section-divider"></div>
                <div class="notification-item" onclick="alert('群通知功能开发中')">群通知</div>
            </div>
            <div class="tabs-bar">
                <div class="tab-item ${state.contactsTab === 'groups' ? 'active' : ''}" onclick="switchContactsTab('groups')">分组</div>
                <div class="tab-item ${state.contactsTab === 'friends' ? 'active' : ''}" onclick="switchContactsTab('friends')">好友</div>
                <div class="tab-item ${state.contactsTab === 'groupsChat' ? 'active' : ''}" onclick="switchContactsTab('groupsChat')">群聊</div>
                <div class="tab-item ${state.contactsTab === 'manage' ? 'active' : ''}" onclick="switchContactsTab('manage')">角色管理</div>
            </div>
            <div class="group-manage-link group-manage-link-tight" onclick="openGroupManager()">管理分组</div>
            <div class="groups-list">
                ${state.groups.map(group => {
                    const members = acceptedContacts.filter(c => c.group === group);
                    return `
                        <div class="group-block">
                            <div class="group-header" onclick="toggleGroup('${group}')">
                                <div class="group-title">${group}</div>
                                <div class="group-arrow">${state.groupExpanded[group] ? '▼' : '▶'}</div>
                            </div>
                            ${state.groupExpanded[group] ? `
                                <div class="group-members">
                                    ${members.length ? members.map(member => {
                                        const contactIndex = state.contacts.findIndex(c => c.qqId === member.qqId);
                                        return `
                                        <div class="group-member group-member-row-sm" onclick="openProfilePage(${contactIndex})">
                                            <img class="avatar-40" src="${member.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}">
                                            <div>
                                                <div class="text-15-medium text-15-plain">${member.remark || member.name}</div>
                                                <div class="text-12-muted">${member.gender}${member.qqId ? ' · ' + member.qqId : ''}</div>
                                            </div>
                                        </div>
                                    `;
                                    }).join('') : '<div class="group-empty">暂无联系人</div>'}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (state.contactsTab === 'friends') {
        const sortedContacts = [...acceptedContacts].sort((a, b) => {
            const aName = a.name || '';
            const bName = b.name || '';
            return aName.localeCompare(bName, 'zh-CN');
        });

        const groupedByInitial = sortedContacts.reduce((acc, contact) => {
            const initial = contact.name ? contact.name.charAt(0).toUpperCase() : '#';
            if (!acc[initial]) acc[initial] = [];
            acc[initial].push(contact);
            return acc;
        }, {});

        return `
            <div class="contact-actions">
                <button class="action-btn" onclick="openAddFriendModal()"><span class="action-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413778193_add-large-line.svg')"></span>添加好友</button>
                <button class="action-btn" onclick="alert('创建群聊功能开发中')"><span class="action-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413778420_group-fill.svg')"></span>创建群聊</button>
            </div>
            <div class="contact-notifications">
                <div class="notification-item" onclick="openFriendRequests()">
                    <span>新朋友</span>
                    ${state.friendRequests.length > 0 ? `<span class="notification-badge">${state.friendRequests.length}</span>` : ''}
                </div>
                <div class="section-divider"></div>
                <div class="notification-item" onclick="alert('群通知功能开发中')">群通知</div>
            </div>
            <div class="tabs-bar">
                <div class="tab-item ${state.contactsTab === 'groups' ? 'active' : ''}" onclick="switchContactsTab('groups')">分组</div>
                <div class="tab-item ${state.contactsTab === 'friends' ? 'active' : ''}" onclick="switchContactsTab('friends')">好友</div>
                <div class="tab-item ${state.contactsTab === 'groupsChat' ? 'active' : ''}" onclick="switchContactsTab('groupsChat')">群聊</div>
                <div class="tab-item ${state.contactsTab === 'manage' ? 'active' : ''}" onclick="switchContactsTab('manage')">角色管理</div>
            </div>
            <div class="contacts-section-pad">
                <div class="contacts-card">
                    ${Object.keys(groupedByInitial).sort().map(initial => `
                        <div>
                            <div class="contacts-initial">${initial}</div>
                            ${groupedByInitial[initial].map(member => {
                                const contactIndex = state.contacts.findIndex(c => c.qqId === member.qqId);
                                return `
                                <div class="group-member group-member-row" onclick="openProfilePage(${contactIndex})">
                                    <img class="avatar-44" src="${member.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}">
                                    <div>
                                        <div class="text-15-medium">${member.remark || member.name}</div>
                                        <div class="text-12-muted">${member.gender}${member.qqId ? ' · ' + member.qqId : ''}</div>
                                    </div>
                                </div>
                            `;
                            }).join('')}
                        </div>
                    `).join('')}
                    ${sortedContacts.length === 0 ? '<div class="empty-state-text">暂无好友</div>' : ''}
                </div>
            </div>
        `;
    } else if (state.contactsTab === 'groupsChat') {
        return `
            <div class="contact-actions">
                <button class="action-btn" onclick="openAddFriendModal()"><span class="action-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413778193_add-large-line.svg')"></span>添加好友</button>
                <button class="action-btn" onclick="alert('创建群聊功能开发中')"><span class="action-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413778420_group-fill.svg')"></span>创建群聊</button>
            </div>
            <div class="contact-notifications">
                <div class="notification-item" onclick="openFriendRequests()">
                    <span>新朋友</span>
                    ${state.friendRequests.length > 0 ? `<span class="notification-badge">${state.friendRequests.length}</span>` : ''}
                </div>
                <div class="section-divider"></div>
                <div class="notification-item" onclick="alert('群通知功能开发中')">群通知</div>
            </div>
            <div class="tabs-bar">
                <div class="tab-item ${state.contactsTab === 'groups' ? 'active' : ''}" onclick="switchContactsTab('groups')">分组</div>
                <div class="tab-item ${state.contactsTab === 'friends' ? 'active' : ''}" onclick="switchContactsTab('friends')">好友</div>
                <div class="tab-item ${state.contactsTab === 'groupsChat' ? 'active' : ''}" onclick="switchContactsTab('groupsChat')">群聊</div>
                <div class="tab-item ${state.contactsTab === 'manage' ? 'active' : ''}" onclick="switchContactsTab('manage')">角色管理</div>
            </div>
            <div class="contacts-section-pad">
                <div class="contacts-empty-card">
                    <div class="text-14-muted">暂无群聊</div>
                    <div class="text-12-muted mt-8">群聊功能开发中</div>
                </div>
            </div>
        `;
    } else if (state.contactsTab === 'manage') {
        return `
            <div class="contact-actions">
                <button class="action-btn" onclick="openAddFriendModal()"><span class="action-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413778193_add-large-line.svg')"></span>添加好友</button>
                <button class="action-btn" onclick="alert('创建群聊功能开发中')"><span class="action-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413778420_group-fill.svg')"></span>创建群聊</button>
            </div>
            <div class="contact-notifications">
                <div class="notification-item" onclick="openFriendRequests()">
                    <span>新朋友</span>
                    ${state.friendRequests.length > 0 ? `<span class="notification-badge">${state.friendRequests.length}</span>` : ''}
                </div>
                <div class="section-divider"></div>
                <div class="notification-item" onclick="alert('群通知功能开发中')">群通知</div>
            </div>
            <div class="tabs-bar">
                <div class="tab-item ${state.contactsTab === 'groups' ? 'active' : ''}" onclick="switchContactsTab('groups')">分组</div>
                <div class="tab-item ${state.contactsTab === 'friends' ? 'active' : ''}" onclick="switchContactsTab('friends')">好友</div>
                <div class="tab-item ${state.contactsTab === 'groupsChat' ? 'active' : ''}" onclick="switchContactsTab('groupsChat')">群聊</div>
                <div class="tab-item ${state.contactsTab === 'manage' ? 'active' : ''}" onclick="switchContactsTab('manage')">角色管理</div>
            </div>
            <div class="contacts-section-pad">
                <div class="contact-manage-toolbar">
                    <button type="button" class="contact-manage-tool-btn" onclick="openContactRelationPanel()">关系</button>
                    <button type="button" class="contact-manage-tool-btn" onclick="openContactNpcPanel()">NPC</button>
                    <button type="button" class="contact-manage-tool-btn" onclick="openCreateContactModal()">添加</button>
                </div>
                <div class="contacts-card">
                    ${state.contacts.length ? state.contacts.map((member, index) => `
                        <div class="group-member group-member-row member-row-relative">
                            <img class="avatar-44" src="${member.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}">
                            <div class="flex-1">
                                <div class="text-15-medium">${member.remark || member.name}</div>
                                <div class="text-12-muted">${member.qqId} · ${member.gender}</div>
                            </div>
                            <div class="btn-row">
                                <button class="btn-edit-sm" onclick="editContact(${index})">编辑</button>
                                <button class="btn-danger-sm" onclick="deleteContact(${index})">🗑</button>
                            </div>
                        </div>
                    `).join('') : '<div class="empty-state-text">暂无角色</div>'}
                </div>
            </div>
        `;
    }
}

function renderGroupManager() {
    return `
        <div class="chat-fullscreen">
            <div class="group-manager-page">
                <div class="group-manager-header">
                    <div class="row-center-10">
                        <span class="back-btn" onclick="closeGroupManager()">←</span>
                        <span class="group-manager-title">管理分组</span>
                    </div>
                    <div class="row-center-12">
                        <button class="group-add-icon" onclick="addGroup()">+</button>
                        <span class="group-manager-close" onclick="closeGroupManager()">完成</span>
                    </div>
                </div>
                <div class="group-manager-card chat-scroll-body">
                    <div class="group-manager-list">
                        ${state.groups.map((group, index) => `
                            <div class="group-manager-item" draggable="true" ondragstart="onGroupDragStart(event, ${index})" ondragover="onGroupDragOver(event)" ondrop="onGroupDrop(event, ${index})">
                                <div class="group-item-left">
                                    <div class="drag-icon">☰</div>
                                    <div class="group-name">${group}</div>
                                </div>
                                <div class="group-actions">
                                    ${['特别关心', '我的好友'].includes(group) ? '' : `<button class="group-delete-btn" onclick="deleteGroup('${group}')">🗑</button>`}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${state.showAddGroupDialog ? `
                    <div class="group-add-popup-overlay" onclick="closeAddGroupDialog()">
                        <div class="group-add-popup" onclick="event.stopPropagation()">
                            <div class="group-add-popup-title">新分组名称</div>
                            <input id="newGroupNameInput" class="group-add-popup-input" placeholder="请输入分组名称" value="${state.newGroupName}">
                            <div class="group-add-popup-actions">
                                <button class="group-popup-btn primary" onclick="confirmAddGroup()">添加</button>
                            </div>
                            <button class="modal-cancel-link" onclick="closeAddGroupDialog()">取消</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderAddFriendModal() {
    const keyword = String(state.addFriendQQKeyword || '');
    const keywordAttr = escapeHtmlAttr(keyword);
    const suggestions = typeof getAddFriendContactSuggestions === 'function'
        ? getAddFriendContactSuggestions(keyword)
        : [];
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E';
    const trimmedKeyword = keyword.trim();
    const addedSet = new Set((state.addFriendAddedQQs || []).map(id => String(id)));
    const suggestHtml = suggestions.length
        ? `<div class="add-friend-suggest-list">${suggestions.map(contact => {
                const contactIndex = state.contacts.findIndex(c => String(c.qqId) === String(contact.qqId));
                const id = String(contact.qqId);
                const isAdded = addedSet.has(id);
                const actionBtn = isAdded
                    ? `<span class="add-friend-add-btn is-added" title="已添加"><span class="add-friend-action-icon" style="--icon-url:url('${ADD_FRIEND_CHECK_ICON}')"></span></span>`
                    : (contactIndex >= 0
                        ? `<button type="button" class="add-friend-add-btn" title="添加好友" onclick="event.stopPropagation(); addFriendByContactIndex(${contactIndex})"><span class="add-friend-action-icon is-plus" style="--icon-url:url('${ADD_FRIEND_PLUS_ICON}')"></span></button>`
                        : '');
                return `
                <div class="add-friend-suggest-row">
                    <img class="avatar-44" src="${contact.avatar || defaultAvatar}" alt="">
                    <div class="add-friend-suggest-info">
                        <div class="text-15-medium">${contact.remark || contact.name}</div>
                        <div class="text-12-muted">${contact.qqId}${contact.gender ? ' · ' + contact.gender : ''}</div>
                    </div>
                    ${actionBtn}
                </div>`;
            }).join('')}</div>`
        : (trimmedKeyword ? '<div class="add-friend-suggest-empty text-12-muted">未找到可添加的角色</div>' : '');

    return `
        <div class="chat-modal show" onclick="closeAddFriendModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-title">添加好友</div>
                <div class="edit-form">
                    <div class="form-group add-friend-qq-wrap">
                        <input class="edit-input" id="addFriendQQ" placeholder="请输入角色QQ号" value="${keywordAttr}"
                            oninput="handleAddFriendQQChange(this.value, this.selectionStart, this.selectionEnd, false)"
                            onkeyup="handleAddFriendQQKeyup(this.value, this.selectionStart, this.selectionEnd, event.keyCode, state.addFriendQQComposing)"
                            oncompositionstart="setAddFriendQQComposing(true)"
                            oncompositionend="setAddFriendQQComposing(false); handleAddFriendQQChange(this.value, this.selectionStart, this.selectionEnd, true)">
                        ${suggestHtml}
                    </div>
                </div>
                <button class="modal-cancel-link" onclick="closeAddFriendModal()">取消</button>
            </div>
        </div>
    `;
}

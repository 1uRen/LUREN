// chat-contacts module
function toggleGroup(group) { 
    state.groupExpanded[group] = !state.groupExpanded[group]; 
    initChatApp(); 
}

function openGroupManager() { 
    state.showGroupManager = true; 
    initChatApp(); 
}

function closeGroupManager() { 
    state.showGroupManager = false; 
    initChatApp(); 
}

function addGroup() {
    state.showAddGroupDialog = true;
    state.newGroupName = '';
    initChatApp();
}

function closeAddGroupDialog() {
    state.showAddGroupDialog = false;
    state.newGroupName = '';
    initChatApp();
}

function openContactRelationPanel() {
    alert('关系功能开发中');
}

function openContactNpcPanel() {
    alert('NPC功能开发中');
}

function confirmAddGroup() {
    const input = document.getElementById('newGroupNameInput');
    const name = (input?.value || '').trim();
    if (!name) {
        alert('请输入分组名称');
        return;
    }
    if (state.groups.includes(name)) {
        alert('该分组已存在');
        return;
    }
    state.groups.push(name);
    state.groupExpanded[name] = true;
    state.showAddGroupDialog = false;
    state.newGroupName = '';
    initChatApp();
}

let dragGroupIndex = null;

function onGroupDragStart(e, index) {
    dragGroupIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
}

function onGroupDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function onGroupDrop(e, index) {
    e.preventDefault();
    if (dragGroupIndex === null || dragGroupIndex === index) return;
    const item = state.groups[dragGroupIndex];
    const rect = e.currentTarget.getBoundingClientRect();
    const insertAfter = e.clientY > rect.top + rect.height / 2;
    state.groups.splice(dragGroupIndex, 1);
    let targetPos = index;
    if (dragGroupIndex < index) {
        targetPos = index - 1;
    }
    if (insertAfter) {
        targetPos += 1;
    }
    state.groups.splice(targetPos, 0, item);
    dragGroupIndex = null;
    initChatApp();
}

function deleteGroup(group) {
    if (group === '我的好友') {
        alert('“我的好友”分组不能删除');
        return;
    }
    if (!confirm(`是否确定删除分组 ${group}？删除后该分组内联系人将移动至“我的好友”。`)) return;
    state.contacts.forEach(contact => {
        if (contact.group === group) {
            contact.group = '我的好友';
        }
    });
    const idx = state.groups.indexOf(group);
    if (idx !== -1) {
        state.groups.splice(idx, 1);
        delete state.groupExpanded[group];
    }
    initChatApp();
}

function switchContactsTab(tab) {
    state.contactsTab = tab;
    state.contactsSelectMode = false;
    state.selectedContacts = [];
    initChatApp();
}

function enterSelectMode() {
    state.contactsSelectMode = true;
    state.selectedContacts = [];
    initChatApp();
}

function exitSelectMode() {
    state.contactsSelectMode = false;
    state.selectedContacts = [];
    initChatApp();
}

function toggleContactSelect(index) {
    const idx = state.selectedContacts.indexOf(index);
    if (idx > -1) {
        state.selectedContacts.splice(idx, 1);
    } else {
        state.selectedContacts.push(index);
    }
    initChatApp();
}

function editContact(index) {
    state.editingContactIndex = index;
    initChatApp();
}

function closeEditContactModal() {
    state.editingContactIndex = null;
    state.editingContactAvatar = null;
    initChatApp();
}

function openEditContactAvatarFilePicker() {
    document.getElementById('fileInput')?.click();
}

function saveContact() {
    const contact = state.contacts[state.editingContactIndex];
    const nick = document.getElementById('editContactNick')?.value;
    const remark = document.getElementById('editContactRemark')?.value;
    const qqId = document.getElementById('editContactQQ')?.value;
    const gender = document.getElementById('editContactGender')?.value;
    const birthday = document.getElementById('editContactBirthday')?.value;
    const setting = document.getElementById('editContactSetting')?.value;
    const group = document.getElementById('editContactGroup')?.value;
    
    const autoAddFriend = document.getElementById('editContactAutoAdd')?.checked || false;
    const addChance = parseInt(document.getElementById('editAddChanceSlider')?.value) || 80;
    
    if (!nick) {
        alert('请输入角色昵称');
        return;
    }
    
    const constellation = getConstellation(birthday);
    
    contact.name = nick;
    contact.remark = remark;
    contact.qqId = qqId;
    contact.gender = (gender || '').trim();
    contact.birthday = birthday;
    contact.constellation = constellation;
    contact.setting = setting;
    contact.group = group || '我的好友';
    contact.autoAddFriend = autoAddFriend;
    contact.addChance = addChance;
    
    // 更新聊天记录中的联系人信息
    const chat = state.chats.find(c => c.contact.qqId === contact.qqId);
    if (chat) {
        chat.contact.name = nick;
        chat.contact.remark = remark;
        chat.contact.gender = (gender || '').trim();
        chat.contact.birthday = birthday;
        chat.contact.constellation = constellation;
        chat.contact.setting = setting;
        if (state.editingContactAvatar) {
            chat.contact.avatar = state.editingContactAvatar;
        }
    }
    
    // 更新当前聊天的联系人信息
    if (state.currentChatContact && state.currentChatContact.qqId === contact.qqId) {
        state.currentChatContact.name = nick;
        state.currentChatContact.remark = remark;
        state.currentChatContact.gender = (gender || '').trim();
        state.currentChatContact.birthday = birthday;
        state.currentChatContact.constellation = constellation;
        state.currentChatContact.setting = setting;
        if (state.editingContactAvatar) {
            state.currentChatContact.avatar = state.editingContactAvatar;
        }
    }
    
    if (state.editingContactAvatar) {
        contact.avatar = state.editingContactAvatar;
    }
    
    const alreadyFriend = !!contact.isFriend || state.chats.some(c => c?.contact?.qqId === contact.qqId);
    // 只拦截“同一角色”的未处理申请；其他角色的申请不受影响
    const hasUnhandledRequestFromSameRole = state.friendRequests.some(r => r?.contact?.qqId === contact.qqId);
    if (autoAddFriend && !alreadyFriend && !hasUnhandledRequestFromSameRole) {
        const random = Math.random() * 100;
        if (random <= addChance) {
            state.friendRequests.push({
                contact: contact,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            });
        }
    }
    
    saveStateToStorage();
    closeEditContactModal();
}

function deleteContact(index) {
    const contact = state.contacts[index];
    if (!confirm(`是否确定删除角色 ${contact.name}？`)) {
        return;
    }
    
    state.contacts.splice(index, 1);
    
    const qqId = contact.qqId;
    
    state.chats = state.chats.filter(c => c.contact.qqId !== qqId);
    
    delete state.unreadMessages[qqId];
    
    if (state.currentChatContact && state.currentChatContact.qqId === qqId) {
        state.currentChatContact = null;
    }
    
    if (state.contactsSelectMode) {
        state.selectedContacts = state.selectedContacts.filter(i => i !== index).map(i => i > index ? i - 1 : i);
    }
    
    saveStateToStorage();
    initChatApp();
}

function batchMoveContacts() {
    if (state.selectedContacts.length === 0) {
        alert('请先选择要移动的角色');
        return;
    }
    const group = prompt('请输入目标分组名称:\n' + state.groups.join('\n'));
    if (group && state.groups.includes(group)) {
        state.selectedContacts.forEach(index => {
            state.contacts[index].group = group;
        });
        exitSelectMode();
    }
}

function batchDeleteContacts() {
    if (state.selectedContacts.length === 0) {
        alert('请先选择要删除的角色');
        return;
    }
    if (!confirm(`确定删除选中的 ${state.selectedContacts.length} 个角色？`)) {
        return;
    }
    state.selectedContacts.sort((a, b) => b - a).forEach(index => {
        state.contacts.splice(index, 1);
    });
    exitSelectMode();
}

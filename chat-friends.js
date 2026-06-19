// chat-friends module
function openFriendRequests() {
    state.showFriendRequests = true;
    initChatApp();
}

function closeFriendRequests() {
    state.showFriendRequests = false;
    initChatApp();
}

function acceptFriendRequest(index) {
    const request = state.friendRequests[index];
    const qqId = request?.contact?.qqId;
    const contact = state.contacts.find(c => c?.qqId === qqId);
    if (contact) {
        contact.isFriend = true;
    }
    if (request?.contact) {
        request.contact.isFriend = true;
    }
    const existingChat = state.chats.find(c => c.contact.qqId === request.contact.qqId);
    
    if (!existingChat) {
        const newChat = {
            contact: request.contact,
            messages: [{
                text: '我们已经是好友啦，快来聊天吧',
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                isMine: false
            }]
        };
        markChatActivity(newChat);
        state.chats.push(newChat);
        
        state.unreadMessages[request.contact.qqId] = 1;
    }
    
    state.friendRequests.splice(index, 1);
    saveStateToStorage();
    initChatApp();
}

function rejectFriendRequest(index) {
    state.friendRequests.splice(index, 1);
    saveStateToStorage();
    initChatApp();
}

function openCreateContactModal() {
    state.showCreateContactModal = true;
    state.newFriend = {
        avatar: '',
        avatarPlaceholderColor: pickLowSatAvatarColor(String(Date.now()) + Math.random()),
        name: '',
        qqId: '',
        gender: '',
        setting: '',
        group: '我的好友'
    };
    initChatApp();
}

function closeCreateContactModal() {
    state.showCreateContactModal = false;
    state.newFriend = {
        avatar: '',
        avatarPlaceholderColor: '',
        name: '',
        qqId: '',
        gender: '',
        setting: '',
        group: '我的好友'
    };
    initChatApp();
}

function createContact() {
    saveFriendFormData();
    
    if (!state.newFriend.name) {
        alert('请输入角色昵称');
        return;
    }
    if (!state.newFriend.qqId) {
        alert('请输入QQ号');
        return;
    }
    
    const exists = state.contacts.find(c => c.qqId === state.newFriend.qqId);
    if (exists) {
        alert('该QQ号已存在');
        return;
    }
    
    const newContact = {
        avatar: resolveContactAvatarSrc(
            state.newFriend.name,
            state.newFriend.avatar,
            state.newFriend.avatarPlaceholderColor
        ),
        name: state.newFriend.name,
        remark: state.newFriend.remark,
        qqId: state.newFriend.qqId,
        gender: state.newFriend.gender,
        birthday: state.newFriend.birthday,
        constellation: state.newFriend.constellation,
        setting: state.newFriend.setting,
        group: state.newFriend.group,
        isFriend: false,
        autoAddFriend: state.newFriend.autoAddFriend || false,
        addChance: state.newFriend.addChance || 80
    };
    
    state.contacts.push(newContact);
    
    if (newContact.autoAddFriend) {
        const random = Math.random() * 100;
        if (random <= newContact.addChance) {
            state.friendRequests.push({
                contact: newContact,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            });
        }
    }
    
    saveStateToStorage();
    closeCreateContactModal();
}

function getAddFriendContactSuggestions(keyword, maxCount = 12) {
    const q = String(keyword || '').trim();
    if (!q) return [];
    const qLower = q.toLowerCase();
    const addedSet = new Set((state.addFriendAddedQQs || []).map(id => String(id)));
    return state.contacts
        .filter(contact => {
            if (!contact?.qqId) return false;
            const id = String(contact.qqId);
            return !contact.isFriend || addedSet.has(id);
        })
        .map(contact => {
            const qq = String(contact.qqId);
            const qqLower = qq.toLowerCase();
            let score = 0;
            if (qqLower.startsWith(qLower)) score = 2;
            else if (qqLower.includes(qLower)) score = 1;
            return score ? { contact, score } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || String(a.contact.qqId).localeCompare(String(b.contact.qqId), 'zh-CN'))
        .slice(0, maxCount)
        .map(item => item.contact);
}

function setAddFriendQQComposing(isComposing) {
    state.addFriendQQComposing = !!isComposing;
}

function updateAddFriendQQInput(value, selectionStart = null, selectionEnd = null, shouldRender = true) {
    state.addFriendQQKeyword = value || '';
    state.addFriendQQSelectionStart = Number.isInteger(selectionStart) ? selectionStart : null;
    state.addFriendQQSelectionEnd = Number.isInteger(selectionEnd) ? selectionEnd : null;
    if (!shouldRender) return;
    state.keepAddFriendInputFocusNextRender = true;
    initChatApp();
}

function handleAddFriendQQChange(value, selectionStart = null, selectionEnd = null, eventIsComposing = false) {
    updateAddFriendQQInput(value, selectionStart, selectionEnd, !eventIsComposing);
}

function handleAddFriendQQKeyup(value, selectionStart = null, selectionEnd = null, keyCode = 0, eventIsComposing = false) {
    if (eventIsComposing || Number(keyCode) === 229) return;
    updateAddFriendQQInput(value, selectionStart, selectionEnd, true);
}

function addFriendByContactIndex(contactIndex) {
    const contact = state.contacts[contactIndex];
    if (!contact?.qqId) {
        alert('未找到该角色');
        return;
    }
    addFriendByQQ(contact.qqId);
}

function addFriendByQQ(qqId) {
    const id = String(qqId ?? '').trim();
    if (!id) return;

    const contact = state.contacts.find(c => String(c.qqId) === id);
    if (!contact) {
        alert('未找到该角色');
        return;
    }

    if (!Array.isArray(state.addFriendAddedQQs)) {
        state.addFriendAddedQQs = [];
    }
    if (state.addFriendAddedQQs.includes(id)) {
        return;
    }

    contact.isFriend = true;

    const existingChat = state.chats.find(c => String(c.contact?.qqId) === id);
    if (!existingChat) {
        const newChat = {
            contact: contact,
            messages: [{
                text: '我们已经是好友啦，快来聊天吧',
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                isMine: false
            }]
        };
        markChatActivity(newChat);
        state.chats.push(newChat);
        state.unreadMessages[id] = 1;
    }

    state.addFriendAddedQQs.push(id);
    saveStateToStorage();
    state.keepAddFriendInputFocusNextRender = true;
    initChatApp();
}

function openAddFriendModal() {
    state.showAddFriendModal = true;
    state.addFriendQQKeyword = '';
    state.addFriendAddedQQs = [];
    state.addFriendQQComposing = false;
    state.addFriendQQSelectionStart = null;
    state.addFriendQQSelectionEnd = null;
    state.newFriend = {
        avatar: '',
        name: '',
        qqId: '',
        gender: '',
        setting: '',
        group: '我的好友'
    };
    initChatApp();
}

function closeAddFriendModal() {
    state.showAddFriendModal = false;
    state.addFriendQQKeyword = '';
    state.addFriendAddedQQs = [];
    state.addFriendQQComposing = false;
    state.keepAddFriendInputFocusNextRender = false;
    initChatApp();
}

function openFriendAvatarFilePicker() {
    saveFriendFormData();
    document.getElementById('fileInput')?.click();
}

function saveFriendFormData() {
    const nick = document.getElementById('friendNick')?.value;
    const remark = document.getElementById('friendRemark')?.value;
    const qqId = document.getElementById('friendQQ')?.value;
    const gender = document.getElementById('friendGender')?.value;
    const birthday = document.getElementById('friendBirthday')?.value;
    const setting = document.getElementById('friendSetting')?.value;
    const group = document.getElementById('friendGroup')?.value;
    
    state.newFriend.name = nick || '';
    state.newFriend.remark = remark || '';
    state.newFriend.qqId = qqId || '';
    state.newFriend.gender = (gender || '').trim();
    state.newFriend.birthday = birthday || '';
    state.newFriend.constellation = getConstellation(birthday);
    state.newFriend.setting = setting || '';
    state.newFriend.group = group || '我的好友';
    state.newFriend.autoAddFriend = document.getElementById('friendAutoAdd')?.checked || false;
    state.newFriend.addChance = parseInt(document.getElementById('addChanceSlider')?.value) || 80;
}

function saveFriend() {
    const nick = document.getElementById('friendNick')?.value;
    const qqId = document.getElementById('friendQQ')?.value;
    const setting = document.getElementById('friendSetting')?.value;
    const group = document.getElementById('friendGroup')?.value;
    
    const radios = document.querySelectorAll('input[name="friendGender"]');
    let gender = '男';
    for (const r of radios) { 
        if (r.checked) { 
            gender = r.value; 
            if (gender === 'custom') {
                gender = document.getElementById('friendCustomGender')?.value || '其他';
            }
            break; 
        } 
    }
    
    if (!nick) {
        alert('请输入角色昵称');
        return;
    }
    
    state.contacts.push({
        id: Date.now(),
        name: nick,
        avatar: state.newFriend.avatar || '',
        qqId: qqId || '',
        gender: gender,
        setting: setting || '',
        group: group || '我的好友'
    });
    
    closeAddFriendModal();
}

window.setAddFriendQQComposing = setAddFriendQQComposing;
window.handleAddFriendQQChange = handleAddFriendQQChange;
window.handleAddFriendQQKeyup = handleAddFriendQQKeyup;
window.addFriendByContactIndex = addFriendByContactIndex;
window.addFriendByQQ = addFriendByQQ;
window.openAddFriendModal = openAddFriendModal;
window.closeAddFriendModal = closeAddFriendModal;

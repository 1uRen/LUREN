// chat-sidebar module
function openSidebar() { state.sidebarOpen = true; initChatApp(); }

function closeSidebar() { state.sidebarOpen = false; initChatApp(); }

function openChangeBgModal() { state.uploadMode = 'background'; initChatApp(); }

function openChangeProfileBgModal() { state.uploadMode = 'profileBackground'; initChatApp(); }

function openAccountModal() { state.showAccountModal = true; state.editingAccountIndex = null; initChatApp(); }

function closeModals() { state.uploadMode = null; state.showAccountModal = false; state.editingAccountIndex = null; initChatApp(); }

function cancelEdit() { 
    state.editingAccountIndex = null; 
    state.isCreatingNewAccount = false; 
    state.editingAvatar = null;
    initChatApp(); 
}

function toggleUrlInput() { document.getElementById('urlContainer')?.classList.toggle('show'); }

function uploadFile() { document.getElementById('fileInput')?.click(); }

function resetBackgroundToDefault() {
    if (state.uploadMode === 'profileBackground') {
        if (state.currentProfileContactIndex !== null && state.contacts[state.currentProfileContactIndex]) {
            state.contacts[state.currentProfileContactIndex].bgImage = '';
            state.currentProfileContact = state.contacts[state.currentProfileContactIndex];
            saveStateToStorage();
        }
    } else if (state.uploadMode === 'background') {
        const themeSidebarBg = typeof getActiveThemeBackgrounds === 'function'
            ? getActiveThemeBackgrounds().sidebarBg
            : DEFAULT_SIDEBAR_BG;
        state.currentUser.background = themeSidebarBg;
        saveStateToStorage();
    }
    closeModals();
}

function uploadUrl() {
    const url = document.getElementById('urlInput')?.value;
    if (url) {
        if (state.uploadMode === 'avatar') {
            state.currentUser.avatar = url;
            saveStateToStorage();
        } else if (state.uploadMode === 'profileBackground') {
            if (state.currentProfileContactIndex !== null && state.contacts[state.currentProfileContactIndex]) {
                state.contacts[state.currentProfileContactIndex].bgImage = url;
                state.currentProfileContact = state.contacts[state.currentProfileContactIndex];
                saveStateToStorage();
            }
        } else {
            state.currentUser.background = url;
            saveStateToStorage();
        }
        closeModals();
    }
}

function saveSignature(el) { 
    state.currentUser.signature = el.innerText || '这是一句个性签名'; 
    saveStateToStorage();
}

function switchAccount(index) { 
    state.currentUser = state.users[index]; 
    saveStateToStorage();
    initChatApp(); 
}

function editAccount(index) { state.editingAccountIndex = index; initChatApp(); }

function deleteAccount(index) {
    if (index === 0) {
        alert('默认账号不能删除');
        return;
    }
    const userToDelete = state.users[index];
    if (!confirm(`是否确定注销账号 ${userToDelete.nickname}？`)) {
        return;
    }
    state.users.splice(index, 1);
    if (state.currentUser === userToDelete) {
        state.currentUser = state.users[0] || null;
    }
    state.showAccountModal = false;
    state.editingAccountIndex = null;
    initChatApp();
}

function createAccount() {
    state.isCreatingNewAccount = true;
    state.editingAccountIndex = -1;
    initChatApp();
}

function openAvatarFilePicker(index) {
    state.avatarEditTarget = index;
    document.getElementById('fileInput')?.click();
}

function saveAccount() {
    const radios = document.querySelectorAll('input[name="gender"]');
    let gender = '男';
    for (const r of radios) { 
        if (r.checked) { 
            gender = r.value; 
            if (gender === 'custom') {
                gender = document.getElementById('customGender')?.value || '其他';
            }
            break; 
        } 
    }
    
    if (state.isCreatingNewAccount) {
        const newUser = {
            id: state.users.length + 1,
            nickname: document.getElementById('editNick')?.value || '新用户',
            avatar: state.editingAvatar || state.users[0].avatar,
            background: state.users[0].background,
            signature: '这是一句个性签名',
            userSetting: document.getElementById('editUserSetting')?.value || '用户设定',
            qqId: document.getElementById('editQQ')?.value || String(123456 + state.users.length),
            gender: gender
        };
        state.users.push(newUser);
        state.isCreatingNewAccount = false;
    } else {
        const user = state.users[state.editingAccountIndex];
        user.nickname = document.getElementById('editNick')?.value || user.nickname;
        user.qqId = document.getElementById('editQQ')?.value || user.qqId;
        user.userSetting = document.getElementById('editUserSetting')?.value || user.userSetting;
        user.gender = gender;
        if (state.editingAvatar) {
            user.avatar = state.editingAvatar;
        }
        if (state.editingAccountIndex === state.users.indexOf(state.currentUser)) {
            state.currentUser = user;
        }
    }
    cancelEdit();
}

window.openChangeProfileBgModal = openChangeProfileBgModal;

// chat-profile module
function openProfilePage(contactIndex) {
    state.currentProfileContact = state.contacts[contactIndex];
    state.currentProfileContactIndex = contactIndex;
    state.likeIconPressed = false;
    // 确保联系人有必要的字段
    if (!state.currentProfileContact.signatureHistory) {
        state.currentProfileContact.signatureHistory = [];
    }
    if (!state.currentProfileContact.likes) {
        state.currentProfileContact.likes = 0;
    }
    initChatApp();
}

function closeProfilePage() {
    state.currentProfileContact = null;
    state.currentProfileContactIndex = null;
    state.likeIconPressed = false;
    state.showSignatureHistory = false;
    initChatApp();
}

function openSignatureHistory() {
    state.showSignatureHistory = true;
    initChatApp();
}

function closeSignatureHistory() {
    state.showSignatureHistory = false;
    initChatApp();
}

let likeLongPressTimer = null;

let likeLongPressInterval = null;

let likeLongPressIndex = null;

let lastLikeTriggerAt = 0;

function likeContact(index) {
    const now = Date.now();
    // 避免 click/touch 兼容事件在极短时间内重复触发
    if (now - lastLikeTriggerAt < 120) return;
    lastLikeTriggerAt = now;

    const contact = state.contacts[index];
    if (!contact) return;
    
    contact.likes = (contact.likes || 0) + 1;
    
    // 更新当前显示的联系人
    if (state.currentProfileContact && state.currentProfileContact.qqId === contact.qqId) {
        state.currentProfileContact.likes = contact.likes;
    }
    
    // 创建飘字动画
    createLikeAnimation();
    updateLikeCountDisplay(contact.likes);
    
    saveStateToStorage();
}

function updateLikeCountDisplay(likes) {
    const likeCountElement = document.querySelector('.profile-like-section .like-count');
    if (!likeCountElement) return;
    likeCountElement.textContent = String(likes || 0);
}

function createLikeAnimation() {
    const likeSection = document.querySelector('.profile-like-section');
    if (!likeSection) return;
    
    const sectionRect = likeSection.getBoundingClientRect();
    const floatElement = document.createElement('div');
    floatElement.className = 'like-float';
    floatElement.textContent = '+1';
    const startOffsetX = (Math.random() - 0.5) * 18;
    const driftX = (Math.random() - 0.5) * 46;
    const riseDistance = 72 + Math.random() * 24;
    floatElement.style.left = `${(sectionRect.left + sectionRect.width / 2 + startOffsetX).toFixed(1)}px`;
    floatElement.style.top = `${(sectionRect.top - 6).toFixed(1)}px`;
    floatElement.style.setProperty('--drift-x', `${driftX.toFixed(1)}px`);
    floatElement.style.setProperty('--rise-y', `-${riseDistance.toFixed(1)}px`);
    document.body.appendChild(floatElement);
    
    // 动画结束后移除元素
    setTimeout(() => {
        floatElement.remove();
    }, 1700);
}

function startLikeLongPress(index) {
    likeLongPressIndex = index;
    setLikeIconPressed(true);
    likeLongPressTimer = setTimeout(() => {
        // 长按触发连赞
        likeLongPressInterval = setInterval(() => {
            likeContact(likeLongPressIndex);
        }, 160);
    }, 500);
}

function cancelLikeLongPress() {
    setLikeIconPressed(false);
    if (likeLongPressTimer) {
        clearTimeout(likeLongPressTimer);
        likeLongPressTimer = null;
    }
    if (likeLongPressInterval) {
        clearInterval(likeLongPressInterval);
        likeLongPressInterval = null;
    }
    likeLongPressIndex = null;
}

function setLikeIconPressed(isPressed) {
    state.likeIconPressed = isPressed;
    const likeIcon = document.querySelector('.profile-like-section .like-icon-svg');
    if (!likeIcon) return;
    likeIcon.style.setProperty('--icon-url', `url('${isPressed ? LIKE_ICON_FILLED : LIKE_ICON_OUTLINE}')`);
}

function saveProfileSignature(element) {
    const contact = state.currentProfileContact;
    if (!contact) return;
    
    const newSignature = element.innerText.trim();
    const oldSignature = contact.signature || '';
    
    // 如果签名有变化，且新签名不是空的，就把新签名加入历史记录
    if (newSignature !== oldSignature && newSignature && newSignature !== '编辑个性签名') {
        if (!contact.signatureHistory) {
            contact.signatureHistory = [];
        }
        contact.signatureHistory.unshift({
            text: newSignature,
            time: new Date().toLocaleString('zh-CN')
        });
    }
    
    contact.signature = newSignature;
    
    // 同步更新 state.contacts 中的联系人数据
    if (state.currentProfileContactIndex !== null) {
        state.contacts[state.currentProfileContactIndex].signature = contact.signature;
        state.contacts[state.currentProfileContactIndex].signatureHistory = contact.signatureHistory;
    }
    
    saveStateToStorage();
}

function openChatFromProfile() {
    const contact = state.currentProfileContact;
    if (!contact) return;
    
    // 查找或创建聊天
    let chat = state.chats.find(c => c.contact.qqId === contact.qqId);
    if (!chat) {
        chat = {
            contact: contact,
            messages: []
        };
        state.chats.push(chat);
        markChatActivity(chat);
        saveStateToStorage();
    }
    
    state.currentProfileContact = null;
    state.showSignatureHistory = false;
    state.currentPage = 'messages';
    state.currentChatContact = contact;
    state.autoScrollNext = true;
    delete state.unreadMessages[contact.qqId];
    saveStateToStorage();
    initChatApp();
}

window.openProfilePage = openProfilePage;
window.closeProfilePage = closeProfilePage;
window.openSignatureHistory = openSignatureHistory;
window.closeSignatureHistory = closeSignatureHistory;
window.openChatFromProfile = openChatFromProfile;

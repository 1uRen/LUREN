// chat-settings module
function openChatSettings() {
    if (!state.currentChatContact) return;
    state.chatSettingsOpen = true;
    initChatApp();
}

function closeChatSettings() {
    state.chatSettingsOpen = false;
    initChatApp();
}

function toggleCurrentChatSetting(field, value) {
    const contactId = state.currentChatContact?.qqId;
    if (!contactId) return;
    const contact = state.contacts.find(c => c.qqId === contactId);
    if (contact) {
        contact[field] = !!value;
    }
    if (state.currentChatContact) {
        state.currentChatContact[field] = !!value;
    }
    const chat = getChatByContactId(contactId);
    if (chat?.contact) {
        chat.contact[field] = !!value;
    }
    saveStateToStorage();
}

function setCurrentChatToneFile(field, fileName) {
    const contactId = state.currentChatContact?.qqId;
    if (!contactId) return;
    const normalizedName = (fileName || '').trim();
    const contact = state.contacts.find(c => c.qqId === contactId);
    if (contact) {
        contact[field] = normalizedName;
    }
    if (state.currentChatContact) {
        state.currentChatContact[field] = normalizedName;
    }
    const chat = getChatByContactId(contactId);
    if (chat?.contact) {
        chat.contact[field] = normalizedName;
    }
    saveStateToStorage();
    initChatApp();
}

function clearCurrentChatMessages() {
    const contactId = state.currentChatContact?.qqId;
    const chat = getChatByContactId(contactId);
    if (!chat) return;
    if (!confirm('确定清空当前聊天记录吗？消息框会保留。')) return;
    chat.messages = [];
    chat.isTyping = false;
    state.messageContextMenu.show = false;
    state.messageContextMenu.messageIndex = null;
    state.messageSelectMode = false;
    state.selectedMessages = [];
    state.messageSelectAnchor = null;
    saveStateToStorage();
    initChatApp();
}

function deleteCurrentChatFriend() {
    const contactId = state.currentChatContact?.qqId;
    if (!contactId) return;
    const contact = state.contacts.find(c => c.qqId === contactId);
    const name = (contact?.remark || contact?.name || state.currentChatContact?.remark || state.currentChatContact?.name || '该角色');
    if (!confirm(`确定删除好友 ${name} 吗？角色会保留在角色管理中。`)) return;

    if (contact) {
        contact.isFriend = false;
    }
    state.friendRequests = state.friendRequests.filter(r => r?.contact?.qqId !== contactId);
    state.chats = state.chats.filter(c => c?.contact?.qqId !== contactId);
    delete state.unreadMessages[contactId];

    state.chatSettingsOpen = false;
    state.currentChatContact = null;
    state.messageContextMenu.show = false;
    state.messageContextMenu.messageIndex = null;
    state.messageSelectMode = false;
    state.selectedMessages = [];
    state.messageSelectAnchor = null;

    saveStateToStorage();
    initChatApp();
}

window.openChatSettings = openChatSettings;
window.closeChatSettings = closeChatSettings;
window.toggleCurrentChatSetting = toggleCurrentChatSetting;
window.setCurrentChatToneFile = setCurrentChatToneFile;
window.clearCurrentChatMessages = clearCurrentChatMessages;
window.deleteCurrentChatFriend = deleteCurrentChatFriend;

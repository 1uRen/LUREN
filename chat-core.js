// chat-core module
let chatScrollRenderToken = 0;

function initChatApp() {
    const renderToken = ++chatScrollRenderToken;
    const shouldRestoreStickerSearchFocus = !!(state.currentChatContact && state.stickerPanelOpen && state.stickerPanelTab === 'search' && !state.stickerSearchComposing);
    const restoreSelectionStart = state.stickerSearchSelectionStart;
    const restoreSelectionEnd = state.stickerSearchSelectionEnd;
    const shouldRestoreChatInputFocus = !!(state.currentChatContact && (state.keepChatInputFocusNextRender || state.chatInputComposing) && !state.messageSelectMode);
    const restoreChatInputSelectionStart = state.chatInputSelectionStart;
    const restoreChatInputSelectionEnd = state.chatInputSelectionEnd;
    const restoreMessageSearchSelectionStart = state.messageSearchSelectionStart;
    const restoreMessageSearchSelectionEnd = state.messageSearchSelectionEnd;
    const shouldRestoreMessageSearchFocus = !!(state.messageSearchOpen && state.messageSearchKeepFocus && !state.messageSearchComposing);
    const prevChatEl = document.querySelector('.chat-fullscreen .chat-messages');
    const prevScrollTop = prevChatEl ? prevChatEl.scrollTop : 0;
    const prevClientHeight = prevChatEl ? prevChatEl.clientHeight : 0;
    const prevScrollHeight = prevChatEl ? prevChatEl.scrollHeight : 0;
    const wasNearBottom = prevChatEl ? (prevScrollTop + prevClientHeight >= prevScrollHeight - 24) : true;

    const container = document.querySelector('.iphone-container');
    if (!container) return;
    document.body.classList.remove('mode-home', 'mode-settings');
    document.body.classList.add('mode-chat');
    container.style.height = '';
    container.style.paddingBottom = '';
    container.innerHTML = renderChatApp();
    attachListeners();
    if (typeof bindForwardModalListeners === 'function') {
        bindForwardModalListeners();
    }

    if (shouldRestoreMessageSearchFocus) {
        const input = document.getElementById('messageSearchInput');
        if (input) {
            if (document.activeElement !== input) {
                input.focus({ preventScroll: true });
            }
            if (Number.isInteger(restoreMessageSearchSelectionStart) && Number.isInteger(restoreMessageSearchSelectionEnd)) {
                const maxLen = input.value.length;
                const start = Math.max(0, Math.min(restoreMessageSearchSelectionStart, maxLen));
                const end = Math.max(start, Math.min(restoreMessageSearchSelectionEnd, maxLen));
                input.setSelectionRange(start, end);
            } else {
                const len = input.value.length;
                input.setSelectionRange(len, len);
            }
        }
        state.messageSearchKeepFocus = false;
    }

    if (state.currentChatContact || state.viewingForwardRecord) {
        requestAnimationFrame(() => {
            if (renderToken !== chatScrollRenderToken) return;
            const el = document.querySelector('.chat-fullscreen .chat-messages');
            if (!el) return;
            if (state.viewingForwardRecord) {
                // 聊天记录页面自动滚动到底部
                el.scrollTop = el.scrollHeight;
            } else if (Number.isInteger(state.scrollToMessageIndex)) {
                const targetIdx = state.scrollToMessageIndex;
                state.scrollToMessageIndex = null;
                const target = el.querySelector(`[data-message-index="${targetIdx}"]`);
                if (target) {
                    target.scrollIntoView({ block: 'center', behavior: 'auto' });
                }
            } else if (state.messageSelectMode || state.preserveChatScrollNextRender || state.showForwardModal) {
                el.scrollTop = Math.max(0, Math.min(prevScrollTop, el.scrollHeight - el.clientHeight));
            } else if (state.autoScrollNext || wasNearBottom) {
                el.scrollTop = el.scrollHeight;
            } else {
                el.scrollTop = Math.max(0, Math.min(prevScrollTop, el.scrollHeight - el.clientHeight));
            }
            if (shouldRestoreStickerSearchFocus && !state.viewingForwardRecord) {
                const input = document.getElementById('stickerSearchInput');
                if (input) {
                    if (document.activeElement !== input) {
                        input.focus({ preventScroll: true });
                    }
                    if (Number.isInteger(restoreSelectionStart) && Number.isInteger(restoreSelectionEnd)) {
                        const maxLen = input.value.length;
                        const start = Math.max(0, Math.min(restoreSelectionStart, maxLen));
                        const end = Math.max(start, Math.min(restoreSelectionEnd, maxLen));
                        input.setSelectionRange(start, end);
                    }
                }
            }
            if (shouldRestoreChatInputFocus && !state.viewingForwardRecord) {
                const chatInput = document.getElementById('chatInput');
                if (chatInput) {
                    if (document.activeElement !== chatInput) {
                        chatInput.focus({ preventScroll: true });
                    }
                    if (Number.isInteger(restoreChatInputSelectionStart) && Number.isInteger(restoreChatInputSelectionEnd)) {
                        const maxLen = chatInput.value.length;
                        const start = Math.max(0, Math.min(restoreChatInputSelectionStart, maxLen));
                        const end = Math.max(start, Math.min(restoreChatInputSelectionEnd, maxLen));
                        chatInput.setSelectionRange(start, end);
                    } else {
                        const len = chatInput.value.length;
                        chatInput.setSelectionRange(len, len);
                    }
                }
                state.keepChatInputFocusNextRender = false;
            }
            state.preserveChatScrollNextRender = false;
            state.autoScrollNext = false;
        });
    }
    
    setTimeout(() => {
        if (state.showAddFriendModal && state.keepAddFriendInputFocusNextRender) {
            const input = document.getElementById('addFriendQQ');
            if (input) {
                if (document.activeElement !== input) {
                    input.focus({ preventScroll: true });
                }
                if (Number.isInteger(state.addFriendQQSelectionStart) && Number.isInteger(state.addFriendQQSelectionEnd)) {
                    const maxLen = input.value.length;
                    const start = Math.max(0, Math.min(state.addFriendQQSelectionStart, maxLen));
                    const end = Math.max(start, Math.min(state.addFriendQQSelectionEnd, maxLen));
                    input.setSelectionRange(start, end);
                } else {
                    const len = input.value.length;
                    input.setSelectionRange(len, len);
                }
            }
            state.keepAddFriendInputFocusNextRender = false;
        }

        const genderRadios = document.querySelectorAll('input[name="friendGender"]');
        genderRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const customGenderInput = document.getElementById('friendCustomGender');
                if (customGenderInput) {
                    customGenderInput.style.display = this.value === 'custom' ? 'block' : 'none';
                }
            });
        });
        
        // 编辑账号模态框的性别选择逻辑
        const accountGenderRadios = document.querySelectorAll('input[name="gender"]');
        accountGenderRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const customGenderInput = document.getElementById('customGender');
                if (customGenderInput) {
                    customGenderInput.style.display = this.value === 'custom' ? 'block' : 'none';
                }
            });
        });
        
        // 编辑角色模态框的性别选择逻辑
        const contactGenderRadios = document.querySelectorAll('input[name="editContactGender"]');
        contactGenderRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const customGenderInput = document.getElementById('editContactCustomGender');
                if (customGenderInput) {
                    customGenderInput.style.display = this.value === 'custom' ? 'block' : 'none';
                }
            });
        });
        
        // 创建角色主动加好友开关逻辑
        const friendAutoAddSwitch = document.getElementById('friendAutoAdd');
        if (friendAutoAddSwitch) {
            friendAutoAddSwitch.addEventListener('change', function() {
                const chanceGroup = document.getElementById('autoAddChanceGroup');
                if (chanceGroup) {
                    chanceGroup.style.display = this.checked ? 'block' : 'none';
                }
            });
        }
               
        // 创建角色几率滑块实时更新
        const addChanceSlider = document.getElementById('addChanceSlider');
        if (addChanceSlider) {
            addChanceSlider.addEventListener('input', function() {
                const chanceDisplay = addChanceSlider.parentElement.querySelector('span:last-child');
                if (chanceDisplay) {
                    chanceDisplay.textContent = this.value + '%';
                }
            });
        }

        // 编辑角色主动加好友开关逻辑
        const editContactAutoAddSwitch = document.getElementById('editContactAutoAdd');
        if (editContactAutoAddSwitch) {
            editContactAutoAddSwitch.addEventListener('change', function() {
                const chanceGroup = document.getElementById('editAutoAddChanceGroup');
                if (chanceGroup) {
                    chanceGroup.style.display = this.checked ? 'block' : 'none';
                }
            });
        }
        
                // 编辑角色几率滑块实时更新
        const editAddChanceSlider = document.getElementById('editAddChanceSlider');
        if (editAddChanceSlider) {
            editAddChanceSlider.addEventListener('input', function() {
                const chanceDisplay = editAddChanceSlider.parentElement.querySelector('span:last-child');
                if (chanceDisplay) {
                    chanceDisplay.textContent = this.value + '%';
                }
            });
        }
    }, 10);
}

function isAccountAvatarEditing() {
    return state.isCreatingNewAccount || (state.editingAccountIndex !== null && state.editingAccountIndex >= 0);
}

async function handleAvatarFileInputChange(e) {
    const input = e.target;
    const file = input?.files?.[0];
    if (input) input.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        const croppedImage = await cropImageToSquare(event.target.result);

        if (isAccountAvatarEditing()) {
            state.editingAvatar = croppedImage;
            state.avatarEditTarget = null;
            initChatApp();
        } else if (state.showCreateContactModal || state.showAddFriendModal) {
            state.newFriend.avatar = croppedImage;
            initChatApp();
        } else if (state.editingContactIndex !== null) {
            state.editingContactAvatar = croppedImage;
            initChatApp();
        } else if (state.uploadMode === 'avatar') {
            state.currentUser.avatar = croppedImage;
            saveStateToStorage();
            closeModals();
        } else if (state.uploadMode === 'profileBackground') {
            if (state.currentProfileContactIndex !== null && state.contacts[state.currentProfileContactIndex]) {
                state.contacts[state.currentProfileContactIndex].bgImage = croppedImage;
                state.currentProfileContact = state.contacts[state.currentProfileContactIndex];
                saveStateToStorage();
            }
            closeModals();
        } else if (state.uploadMode === 'background') {
            state.currentUser.background = croppedImage;
            saveStateToStorage();
            closeModals();
        } else if (state.avatarEditTarget !== null && state.users[state.avatarEditTarget]) {
            state.users[state.avatarEditTarget].avatar = croppedImage;
            if (state.users[state.avatarEditTarget] === state.currentUser) {
                state.currentUser.avatar = croppedImage;
            }
            state.avatarEditTarget = null;
            saveStateToStorage();
            initChatApp();
        }
    };
    reader.readAsDataURL(file);
}

function attachListeners() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput) return;
    fileInput.removeEventListener('change', handleAvatarFileInputChange);
    fileInput.addEventListener('change', handleAvatarFileInputChange);
}

function goBack() {
    if (state.viewingForwardRecord) {
        closeForwardRecord();
        return;
    }
    location.reload();
}

function switchPage(page) {
    if (page !== 'messages') {
        state.messageSearchOpen = false;
        state.messageSearchSubView = null;
        state.messageSearchSubChatIndex = null;
        state.messageSearchKeyword = '';
        state.messageSearchComposing = false;
        state.messageSearchKeepFocus = false;
        state.messageSearchSelectionStart = null;
        state.messageSearchSelectionEnd = null;
    }
    state.currentPage = page;
    initChatApp();
}

window.initChatApp = initChatApp;

// CHAT应用 - 简化版本

const DEFAULT_SIDEBAR_BG = 'https://img.heliar.top/file/1779271589650_IMG_20260520_180609.png';
const DEFAULT_PROFILE_BG = 'https://img.heliar.top/file/1779271260974_IMG_20260520_180013.jpg';
const DEFAULT_CONTACT_AVATAR = 'https://img.heliar.top/file/1779274233510_image_1779154309511.png';
const LEGACY_SIDEBAR_BGS = [
    'https://img.heliar.top/file/1779038914728_IMG_20260518_012229_edit_3883979776694321.png',
    'https://img.heliar.top/file/1779271268039_IMG_20260520_180038.png'
];

const state = {
    currentPage: 'messages',
    sidebarOpen: false,
    uploadMode: null,
    showAccountModal: false,
    editingAccountIndex: null,
    avatarEditTarget: null,
    editingAvatar: null,
    editingContactAvatar: null,
    showAddFriendModal: false,
    addFriendQQKeyword: '',
    addFriendQQComposing: false,
    addFriendQQSelectionStart: null,
    addFriendQQSelectionEnd: null,
    keepAddFriendInputFocusNextRender: false,
    addFriendAddedQQs: [],
    newFriend: {
        avatar: DEFAULT_CONTACT_AVATAR,
        name: '',
        qqId: '',
        gender: '',
        setting: '',
        group: '我的好友'
    },
    contactsTab: 'groups',
    selectedContacts: [],
    contactsSelectMode: false,
    editingContactIndex: null,
    users: [{
        id: 1,
        nickname: '用户',
        avatar: 'https://img.heliar.top/file/1779038914728_IMG_20260518_012229_edit_3883979776694321.png',
        background: DEFAULT_SIDEBAR_BG,
        signature: '这是一句个性签名',
        userSetting: '用户设定',
        qqId: '123456',
        gender: '男'
    }],
    currentUser: null,
    groups: ['特别关心', '我的好友'],
    contacts: [],
    groupExpanded: {
        '特别关心': true,
        '我的好友': true
    },
    showGroupManager: false,
    showAddGroupDialog: false,
    newGroupName: '',
    currentChatContact: null,
    chats: [],
    showCreateContactModal: false,
    unreadMessages: {},
    friendRequests: [],
    showFriendRequests: false,
    showMockVoiceModal: false,
    mockVoiceText: '',
    showMockImageModal: false,
    mockImageText: '',
    editingMessageIndex: null,
    editingMessageText: '',
    editingMessageType: 'text',
    viewingWithdrawMessage: null,
    messageContextMenu: {
        show: false,
        messageIndex: null,
        x: 0,
        y: 0,
        anchorX: 0,
        anchorY: 0
    },
    messageSelectMode: false,
    selectedMessages: [],
    messageSelectAnchor: null,
    replyingQuote: null,
    stickerPanelOpen: false,
    stickerPanelTab: 'favorites',
    stickerLastTab: 'favorites',
    stickerSearchKeyword: '',
    stickerSearchSelectionStart: null,
    stickerSearchSelectionEnd: null,
    stickerSearchComposing: false,
    stickerCategories: [],
    showStickerManagerModal: false,
    stickerDraftCategoryName: '',
    stickerDraftUrlText: '',
    stickerDraftPreviewItems: [],
    keepChatInputFocusNextRender: false,
    chatInputStickerSuggestKeyword: '',
    chatInputSelectionStart: null,
    chatInputSelectionEnd: null,
    chatInputComposing: false,
    autoScrollNext: false,
    contextMenu: {
        show: false,
        chatIndex: null,
        x: 0,
        y: 0
    },
    currentProfileContact: null,
    currentProfileContactIndex: null,
    likeIconPressed: false,
    showSignatureHistory: false
    ,
    chatSettingsOpen: false,
    messageSearchOpen: false,
    messageSearchKeyword: '',
    messageSearchComposing: false,
    messageSearchKeepFocus: false,
    messageSearchSelectionStart: null,
    messageSearchSelectionEnd: null,
    messageSearchRecent: [],
    messageSearchSubView: null,
    messageSearchSubChatIndex: null,
    scrollToMessageIndex: null,
    preserveChatScrollNextRender: false,
    groupChats: [],
    plusPanelOpen: false,
    showForwardModal: false,
    forwardMode: 'single',
    forwardTargetContactId: null,
    viewingForwardRecord: null,
    walletOpen: false,
    walletBalance: 100,
    walletLastCollectDate: null,
    walletShowRewardAnimation: false,
    walletCurrentReward: 0
};

const LIKE_ICON_OUTLINE = 'https://img.heliar.top/file/1779414610160_thumb-up-line.svg';
const LIKE_ICON_FILLED = 'https://img.heliar.top/file/1779414608061_thumb-up-fill.svg';
const ADD_FRIEND_PLUS_ICON = 'https://img.heliar.top/file/1779413778193_add-large-line.svg';
const ADD_FRIEND_CHECK_ICON = 'https://img.heliar.top/file/1779458304685_check-fill.svg';
const PROFILE_SURPRISE_CHECK_ICON = 'https://img.heliar.top/file/1779465177482_phone-find-fill.svg';

function saveStateToStorage() {
    saveChatData(state.users, state.contacts, state.chats, state.unreadMessages, {
        stickerCategories: state.stickerCategories,
        stickerLastTab: state.stickerLastTab,
        messageSearchRecent: state.messageSearchRecent,
        groupChats: state.groupChats,
        walletBalance: state.walletBalance,
        walletLastCollectDate: state.walletLastCollectDate
    });
}

function loadStateFromStorage() {
    const savedData = loadChatData();
    let usersMigrated = false;
    if (savedData) {
        if (savedData.users && savedData.users.length > 0) {
            state.users = savedData.users;
            state.users.forEach((user) => {
                // Migrate old built-in default background to the new default.
                if (!user.background || LEGACY_SIDEBAR_BGS.includes(user.background)) {
                    user.background = DEFAULT_SIDEBAR_BG;
                    usersMigrated = true;
                }
            });
        }
        if (savedData.contacts) {
            state.contacts = savedData.contacts;
        }
        if (savedData.chats) {
            state.chats = savedData.chats;
            // 仅从存储恢复时清除正在输入（避免页面刷新后卡住）
            state.chats.forEach((chat, idx) => {
                chat.isTyping = false;
                if (!Number.isFinite(chat.updatedAt)) {
                    chat.updatedAt = idx + 1;
                }
            });
        }
        if (savedData.unreadMessages) {
            state.unreadMessages = savedData.unreadMessages;
        }
        if (Array.isArray(savedData.stickerCategories)) {
            state.stickerCategories = savedData.stickerCategories.map((category, idx) => ({
                id: category.id || `sticker-category-${Date.now()}-${idx}`,
                name: String(category.name || `分类${idx + 1}`).trim(),
                items: Array.isArray(category.items) ? category.items.map((item, itemIdx) => ({
                    id: item.id || `sticker-item-${Date.now()}-${idx}-${itemIdx}`,
                    desc: String(item.desc || '').trim(),
                    url: String(item.url || '').trim(),
                    favorite: !!item.favorite
                })).filter(item => item.url) : []
            })).filter(category => category.name);
        }
        if (typeof savedData.stickerLastTab === 'string' && savedData.stickerLastTab.trim()) {
            state.stickerLastTab = savedData.stickerLastTab.trim();
        }
        if (Array.isArray(savedData.messageSearchRecent)) {
            state.messageSearchRecent = savedData.messageSearchRecent
                .map(item => String(item || '').trim())
                .filter(Boolean)
                .slice(0, 12);
        }
        if (Array.isArray(savedData.groupChats)) {
            state.groupChats = savedData.groupChats;
        }
        if (typeof savedData.walletBalance === 'number') {
            state.walletBalance = savedData.walletBalance;
        }
        if (savedData.walletLastCollectDate) {
            state.walletLastCollectDate = savedData.walletLastCollectDate;
        }
    }
    // 兼容旧数据：未显式记录好友状态时，按是否存在聊天记录推断一次
    state.contacts.forEach(contact => {
        if (typeof contact.isFriend !== 'boolean') {
            contact.isFriend = state.chats.some(c => c?.contact?.qqId === contact.qqId);
        }
    });
    ensureStickerDefaults();
    state.currentUser = state.users[0];
    repairChatMessageStickers();
    if (usersMigrated) {
        saveStateToStorage();
    }
}

function getChatByContactId(qqId) {
    if (!qqId) return null;
    return state.chats.find(c => c.contact.qqId === qqId);
}

function markChatActivity(chat, timestamp = Date.now()) {
    if (!chat) return;
    chat.updatedAt = Number(timestamp) || Date.now();
}

function getChatListPreviewText(chat) {
    const msgs = chat?.messages;
    if (!Array.isArray(msgs) || !msgs.length) return '';
    const last = msgs[msgs.length - 1];
    if (!last) return '';
    if (last.isSticker) return '[表情]';
    if (last.isForwardMerged) return '[聊天记录]';
    return last.text || '';
}

function getContactForAI(contact) {
    if (!contact) return null;
    const fromContacts = state.contacts?.find(c => c.qqId === contact.qqId);
    return fromContacts || contact;
}

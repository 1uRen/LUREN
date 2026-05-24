/**
 * One-time splitter: chat.js -> feature modules (layer 1)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const srcPath = path.join(ROOT, 'chat.js');
const source = fs.readFileSync(srcPath, 'utf8');

const PREAMBLE_END = source.indexOf('function saveStateToStorage');
const preamble = source.slice(0, PREAMBLE_END).trimEnd();

const WINDOW_EXPORTS_START = source.indexOf('\nwindow.initChatApp');
const bootstrapTail = source.slice(WINDOW_EXPORTS_START).trim();

const body = source.slice(PREAMBLE_END, WINDOW_EXPORTS_START);

function extractTopLevelBlocks(code) {
    const blocks = [];
    let i = 0;
    const len = code.length;

    while (i < len) {
        while (i < len && (code[i] === ' ' || code[i] === '\t')) i++;
        if (i >= len) break;

        if (code[i] === '\n') {
            i++;
            continue;
        }
        if (code.startsWith('/*', i)) {
            const end = code.indexOf('*/', i);
            i = end === -1 ? len : end + 2;
            continue;
        }
        if (code.startsWith('//', i)) {
            const end = code.indexOf('\n', i);
            i = end === -1 ? len : end + 1;
            continue;
        }

        const start = i;
        const fnMatch = code.slice(i).match(/^function\s+(\w+)\s*\(/);
        const letMatch = code.slice(i).match(/^(?:let|const|var)\s+(\w+)/);

        if (!fnMatch && !letMatch) {
            i++;
            continue;
        }

        if (fnMatch) {
            i += fnMatch[0].length;
            let depth = 1;
            while (i < len && depth > 0) {
                const ch = code[i];
                if (ch === '(') depth++;
                else if (ch === ')') depth--;
                i++;
            }
            while (i < len && code[i] !== '{') i++;
            if (i < len && code[i] === '{') {
                depth = 1;
                i++;
                while (i < len && depth > 0) {
                    const ch = code[i];
                    if (ch === '{') depth++;
                    else if (ch === '}') depth--;
                    i++;
                }
            }
        } else {
            i += letMatch[0].length;
            if (code[i] === '=') {
                i++;
                if (code[i] === ' ') i++;
                if (code[i] === 'f' && code.slice(i, i + 8) === 'function') {
                    while (i < len && code[i] !== '{') i++;
                    if (code[i] === '{') {
                        let depth = 1;
                        i++;
                        while (i < len && depth > 0) {
                            if (code[i] === '{') depth++;
                            else if (code[i] === '}') depth--;
                            i++;
                        }
                    }
                } else {
                    while (i < len && code[i] !== ';') i++;
                    if (code[i] === ';') i++;
                }
            } else {
                while (i < len && code[i] !== ';') i++;
                if (code[i] === ';') i++;
            }
        }

        while (i < len && (code[i] === ' ' || code[i] === '\t')) i++;
        if (code[i] === '\n') i++;

        const block = code.slice(start, i).trimEnd();
        if (block) blocks.push(block);
    }
    return blocks;
}

const blocks = extractTopLevelBlocks(body);

function blockName(block) {
    const fn = block.match(/^function\s+(\w+)/);
    if (fn) return fn[1];
    const v = block.match(/^(?:let|const|var)\s+(\w+)/);
    return v ? `$${v[1]}` : null;
}

const MODULE_MAP = {
    'chat-state.js': new Set([
        'saveStateToStorage', 'loadStateFromStorage', 'getChatByContactId', 'markChatActivity',
        'getChatListPreviewText', 'getContactForAI'
    ]),
    'chat-utils.js': new Set([
        'getQuotedMessageDisplayText', 'scrollChatToBottom', 'cropImageToSquare', 'getConstellation',
        'getMockVoiceDurationSeconds', 'isVisionCapableModel', 'getCameraImageFallbackText', 'trimMessagesForApi'
    ]),
    'chat-stickers.js': new Set([
        'ensureStickerDefaults', 'getStickerCategoriesForPanel', 'getAllStickers', 'normalizeStickerSearchText',
        'getStickerSuggestionsForChatInput', 'getVisibleStickers', 'parseStickerUrlLine', 'extractStickerDescFromText',
        'resolveStickerForRole', 'coerceMessageToSticker', 'coerceStickerReplyItem', 'repairChatMessageStickers',
        'toggleStickerPanel', 'switchStickerPanelTab', 'setStickerSearchComposing', 'handleStickerSearchInput',
        'handleStickerSearchKeyup', 'updateStickerSearchKeyword', 'sendStickerMessage', 'toggleStickerFavorite',
        'openStickerManagerModal', 'closeStickerManagerModal', 'updateStickerDraftField', 'handleStickerLocalFiles',
        'parseStickerDraftUrls', 'removeStickerDraftItem', 'saveStickerDraftItems',
        '$fileInputListenerAttached'
    ]),
    'chat-ai-send.js': new Set([
        'buildChatMessagesForAI', 'pushAssistantMessageItem', 'appendAssistantReplyPlan', 'filterInvalidStickersFromPlan',
        'isPunctuationOnlyText', 'isDegenerateAssistantReply', 'hasInvalidStickerIntents', 'salvageAssistantReplyPlan',
        'finalizeAssistantReplyPlan', 'notifyAssistantReplyDropped', 'requestAssistantReplyWithRepair',
        'receiveMessage', 'fetchAIResponse'
    ]),
    'chat-plus.js': new Set([
        'handleChatToolClick', 'togglePlusPanel', 'closePlusPanel', 'handleVoiceCall', 'handleVideoCall',
        'handleRedPacket', 'handleTransfer', 'handleFavorite', 'handleLocation', 'handleFileSend', 'handleChatGlobalClick'
    ]),
    'chat-core.js': new Set([
        '$chatScrollRenderToken', 'initChatApp', 'attachListeners', 'goBack', 'switchPage'
    ]),
    'chat-sidebar.js': new Set([
        'openSidebar', 'closeSidebar', 'openChangeBgModal', 'openChangeProfileBgModal', 'openAccountModal',
        'closeModals', 'cancelEdit', 'toggleUrlInput', 'uploadFile', 'resetBackgroundToDefault', 'uploadUrl',
        'saveSignature', 'switchAccount', 'editAccount', 'deleteAccount', 'createAccount', 'openAvatarFilePicker',
        'saveAccount'
    ]),
    'chat-chat-list.js': new Set([
        '$longPressTimer', 'startLongPress', 'cancelLongPress', 'showContextMenu', 'showContextMenuAt',
        'hideContextMenu', 'togglePinChat', 'deleteChat', 'openChat', 'closeChat'
    ]),
    'chat-profile.js': new Set([
        'openProfilePage', 'closeProfilePage', 'openSignatureHistory', 'closeSignatureHistory',
        '$likeLongPressTimer', '$likeLongPressInterval', '$likeLongPressIndex', '$lastLikeTriggerAt',
        'likeContact', 'updateLikeCountDisplay', 'createLikeAnimation', 'startLikeLongPress', 'cancelLikeLongPress',
        'setLikeIconPressed', 'saveProfileSignature', 'openChatFromProfile'
    ]),
    'chat-contacts.js': new Set([
        'toggleGroup', 'openGroupManager', 'closeGroupManager', 'addGroup', 'closeAddGroupDialog',
        'openContactRelationPanel', 'openContactNpcPanel', 'confirmAddGroup', '$dragGroupIndex',
        'onGroupDragStart', 'onGroupDragOver', 'onGroupDrop', 'deleteGroup', 'switchContactsTab',
        'enterSelectMode', 'exitSelectMode', 'toggleContactSelect', 'editContact', 'closeEditContactModal',
        'openEditContactAvatarFilePicker', 'saveContact', 'deleteContact', 'batchMoveContacts', 'batchDeleteContacts'
    ]),
    'chat-friends.js': new Set([
        'openFriendRequests', 'closeFriendRequests', 'acceptFriendRequest', 'rejectFriendRequest',
        'openCreateContactModal', 'closeCreateContactModal', 'createContact', 'getAddFriendContactSuggestions',
        'setAddFriendQQComposing', 'updateAddFriendQQInput', 'handleAddFriendQQChange', 'handleAddFriendQQKeyup',
        'addFriendByContactIndex', 'addFriendByQQ', 'openAddFriendModal', 'closeAddFriendModal',
        'openFriendAvatarFilePicker', 'saveFriendFormData', 'saveFriend'
    ]),
    'chat-settings.js': new Set([
        'openChatSettings', 'closeChatSettings', 'toggleCurrentChatSetting', 'setCurrentChatToneFile',
        'clearCurrentChatMessages', 'deleteCurrentChatFriend'
    ]),
    'chat-messages.js': new Set([
        'sendMessage', 'setChatInputComposing', 'updateChatInputStickerSuggest', 'handleChatInputChange',
        'handleChatInputKeyup', 'handleChatInputKeydown', 'sendStickerFromSuggestion',
        'openMockVoiceModal', 'closeMockVoiceModal', 'updateMockVoiceText', 'sendMockVoiceMessage', 'toggleMockVoiceText',
        'openMockImageModal', 'closeMockImageModal', 'updateMockImageText', 'sendMockImageMessage',
        'openCameraImagePicker', 'onCameraImageSelected',
        '$messageLongPressTimer', 'startMessageLongPress', 'cancelMessageLongPress', 'showMessageContextMenu',
        'showMessageContextMenuAt', 'hideMessageContextMenu', 'closeEditMessageModal', 'openEditMessage',
        'quoteMessage', 'copyMessage', 'clearReplyingQuote', 'saveEditedMessage', 'withdrawMessage',
        'openWithdrawContent', 'closeWithdrawContent', 'deleteMessage', 'getCurrentAssistantRoundRange', 'reopenAssistantRound'
    ])
};

// openChangeProfileBgModal is in sidebar in map but was duplicated in profile - only sidebar

const moduleBlocks = {};
Object.keys(MODULE_MAP).forEach(f => { moduleBlocks[f] = []; });
const unassigned = [];

blocks.forEach(block => {
    const name = blockName(block);
    let assigned = false;
    for (const [file, names] of Object.entries(MODULE_MAP)) {
        if (name && names.has(name)) {
            moduleBlocks[file].push(block);
            assigned = true;
            break;
        }
    }
    if (!assigned) unassigned.push({ name, block: block.slice(0, 80) });
});

if (unassigned.length) {
    console.error('Unassigned blocks:', unassigned);
    process.exit(1);
}

// Remove openChangeProfileBgModal duplicate from profile if any - it's only in sidebar set

// Window exports per module - parse from bootstrapTail
const exportLines = bootstrapTail.split('\n').filter(l => l.startsWith('window.'));
const exportMap = {};
exportLines.forEach(line => {
    const m = line.match(/window\.(\w+)\s*=\s*(\w+)/);
    if (m) exportMap[m[2]] = m[1];
});

function getExportsForModule(file, blocksInModule) {
    const fnNames = blocksInModule
        .map(blockName)
        .filter(n => n && !n.startsWith('$'));
    return fnNames
        .filter(fn => exportMap[fn])
        .map(fn => `window.${exportMap[fn]} = ${fn};`)
        .join('\n');
}

// Write chat-state.js with preamble
const stateFns = moduleBlocks['chat-state.js'].join('\n\n');
fs.writeFileSync(path.join(ROOT, 'chat-state.js'), `${preamble}\n\n${stateFns}\n`, 'utf8');

Object.entries(moduleBlocks).forEach(([file, blks]) => {
    if (file === 'chat-state.js') return;
    const header = `// ${file.replace('.js', '')} module\n`;
    const content = blks.join('\n\n');
    const exports = getExportsForModule(file, blks);
    const exportSection = exports ? `\n\n${exports}\n` : '\n';
    fs.writeFileSync(path.join(ROOT, file), header + content + exportSection, 'utf8');
});

// chat.js bootstrap
const bootstrap = `// CHAT bootstrap — load modules then init storage
${bootstrapTail}
`;
fs.writeFileSync(path.join(ROOT, 'chat.js'), bootstrap, 'utf8');
console.log('Split complete:', Object.keys(moduleBlocks).length + 1, 'modules');

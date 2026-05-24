/**
 * Split chat-render.js into feature render modules
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const srcPath = path.join(ROOT, 'chat-render.js');
const source = fs.readFileSync(srcPath, 'utf8');

function extractTopLevelBlocks(code) {
    const blocks = [];
    let i = 0;
    const len = code.length;
    while (i < len) {
        while (i < len && (code[i] === ' ' || code[i] === '\t')) i++;
        if (i >= len) break;
        if (code[i] === '\n') { i++; continue; }
        const start = i;
        const fnMatch = code.slice(i).match(/^function\s+(\w+)\s*\(/);
        if (!fnMatch) { i++; continue; }
        i += fnMatch[0].length;
        let depth = 1;
        while (i < len && depth > 0) {
            if (code[i] === '(') depth++;
            else if (code[i] === ')') depth--;
            i++;
        }
        while (i < len && code[i] !== '{') i++;
        if (i < len && code[i] === '{') {
            depth = 1;
            i++;
            while (i < len && depth > 0) {
                if (code[i] === '{') depth++;
                else if (code[i] === '}') depth--;
                i++;
            }
        }
        while (i < len && code[i] === '\n') i++;
        blocks.push({ name: fnMatch[1], code: code.slice(start, i).trimEnd() });
    }
    return blocks;
}

const blocks = extractTopLevelBlocks(source);

const MODULE_MAP = {
    'chat-render-core.js': new Set([
        'renderChatApp', 'renderHeader', 'renderContent', 'renderBottomNav', 'escapeHtmlAttr'
    ]),
    'chat-render-sidebar.js': new Set(['renderSidebar']),
    'chat-render-contacts.js': new Set([
        'renderContactsContent', 'renderGroupManager', 'renderAddFriendModal'
    ]),
    'chat-render-profile.js': new Set(['renderProfilePage', 'renderSignatureHistoryPage']),
    'chat-render-chat.js': new Set([
        'renderChatList', 'renderChatInterface', 'renderChatSettingsPage',
        'renderChatInputStickerSuggest', 'renderStickerPanel', 'renderPlusPanel'
    ]),
    'chat-render-modals.js': new Set([
        'renderModals', 'renderContextMenu', 'renderMessageContextMenu', 'renderStickerManagerModal'
    ]),
    'chat-render-search.js': new Set([
        'renderMessageSearchTop', 'renderMessageSearchInput', 'renderSearchSectionHeader',
        'renderSearchContactRow', 'renderSearchChatPreviewRow', 'renderMessageSearchMain',
        'renderMessageSearchContactsMore', 'renderMessageSearchChatsMore', 'renderMessageSearchChatDetail',
        'renderMessageSearchGroupsMore'
    ])
};

const byName = Object.fromEntries(blocks.map(b => [b.name, b.code]));
const moduleBlocks = {};
Object.keys(MODULE_MAP).forEach(f => { moduleBlocks[f] = []; });
const unassigned = [];

blocks.forEach(({ name, code }) => {
    let ok = false;
    for (const [file, names] of Object.entries(MODULE_MAP)) {
        if (names.has(name)) {
            moduleBlocks[file].push(code);
            ok = true;
            break;
        }
    }
    if (!ok) unassigned.push(name);
});

if (unassigned.length) {
    console.error('Unassigned render functions:', unassigned);
    process.exit(1);
}

Object.entries(moduleBlocks).forEach(([file, blks]) => {
    const header = `// ${file.replace('.js', '')} module\n`;
    fs.writeFileSync(path.join(ROOT, file), header + blks.join('\n\n') + '\n', 'utf8');
});

fs.writeFileSync(path.join(ROOT, 'chat-render.js'), `// Deprecated shell — render modules loaded via index.html\n`, 'utf8');
console.log('Render split complete:', Object.keys(moduleBlocks).length, 'files');

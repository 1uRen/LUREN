// chat-render-search module
function renderMessageListSearchBar() {
    return `
        <div class="message-list-search-wrap">
            <button type="button" class="message-list-search-trigger" onclick="openMessageSearchPage()">
                <span class="message-list-search-icon">⌕</span>
                <span class="message-list-search-placeholder">搜索</span>
            </button>
        </div>
    `;
}

function renderMessageSearchPageContent() {
    if (state.messageSearchSubView === 'contacts') {
        return renderMessageSearchContactsMore();
    }
    if (state.messageSearchSubView === 'chats') {
        return renderMessageSearchChatsMore();
    }
    if (state.messageSearchSubView === 'groups') {
        return renderMessageSearchGroupsMore();
    }
    if (state.messageSearchSubView === 'chatDetail') {
        return renderMessageSearchChatDetail();
    }
    return renderMessageSearchMain();
}

function renderMessageSearchTop(keyword, options = {}) {
    const { showBack = false, showCancel = true } = options;
    return `
        <div class="message-search-top">
            ${showBack ? `<button type="button" class="message-search-back-btn" onclick="backMessageSearchSubView()">‹</button>` : ''}
            ${renderMessageSearchInput(keyword, { showCancel, autofocus: true })}
        </div>
    `;
}

function renderMessageSearchInput(keyword, options = {}) {
    const { showCancel = true, autofocus = true } = options;
    const keywordAttr = typeof escapeSearchAttr === 'function' ? escapeSearchAttr(keyword) : keyword;
    return `
        <div class="message-search-input-wrap">
            <span class="message-search-input-icon">⌕</span>
            <input
                id="messageSearchInput"
                class="message-search-input"
                type="text"
                placeholder="搜索"
                value="${keywordAttr}"
                autocomplete="off"
                ${autofocus ? 'autofocus' : ''}
                oninput="handleMessageSearchInput(this.value, this.selectionStart, this.selectionEnd, (typeof event !== 'undefined' && event && event.isComposing))"
                onkeyup="handleMessageSearchKeyup(this.value, this.selectionStart, this.selectionEnd, (typeof event !== 'undefined' && event ? event.keyCode : 0), (typeof event !== 'undefined' && event && event.isComposing))"
                oncompositionstart="setMessageSearchComposing(true)"
                oncompositionend="setMessageSearchComposing(false); updateMessageSearchKeyword(this.value, this.selectionStart, this.selectionEnd, true)"
                onkeydown="if(event.keyCode===13){event.preventDefault();submitMessageSearchKeyword();}"
            >
            ${keyword ? `<button type="button" class="message-search-clear-btn" onclick="updateMessageSearchKeyword('', true)">×</button>` : ''}
            ${showCancel ? `<button type="button" class="message-search-cancel-btn" onclick="closeMessageSearchPage()">取消</button>` : ''}
        </div>
    `;
}

function renderSearchSectionHeader(title, total, moreHandler) {
    const showMore = typeof moreHandler === 'string';
    return `
        <div class="message-search-section-head">
            <span class="message-search-section-title">${title}</span>
            ${showMore ? `<button type="button" class="message-search-more-btn" onclick="${moreHandler}">更多</button>` : ''}
        </div>
    `;
}

function renderSearchContactRow(item, keyword, options = {}) {
    const contact = item.contact;
    const contactIndex = item.contactIndex;
    const title = typeof getSearchContactTitle === 'function' ? getSearchContactTitle(contact) : (contact.remark || contact.name);
    const meta = typeof getSearchContactMeta === 'function' ? getSearchContactMeta(contact) : '';
    const avatar = contact.avatar || MESSAGE_SEARCH_DEFAULT_AVATAR;
    const onClick = options.onClick || `openSearchContactProfile(${contactIndex})`;
    return `
        <button type="button" class="message-search-row" onclick="${onClick}">
            <img class="message-search-avatar" src="${avatar}" alt="">
            <div class="message-search-row-main">
                <div class="message-search-row-title">${typeof highlightSearchText === 'function' ? highlightSearchText(title, keyword) : title}</div>
                <div class="message-search-row-meta">${typeof highlightSearchText === 'function' ? highlightSearchText(meta, keyword) : meta}</div>
            </div>
        </button>
    `;
}

function renderSearchChatPreviewRow(result, keyword) {
    const contact = result.contact;
    const title = typeof getSearchContactTitle === 'function' ? getSearchContactTitle(contact) : (contact.remark || contact.name);
    const meta = `${result.total} 条相关聊天记录`;
    const avatar = contact.avatar || MESSAGE_SEARCH_DEFAULT_AVATAR;
    return `
        <button type="button" class="message-search-row message-search-row-arrow" onclick="openMessageSearchChatDetail(${result.chatIndex})">
            <img class="message-search-avatar" src="${avatar}" alt="">
            <div class="message-search-row-main">
                <div class="message-search-row-title">${typeof highlightSearchText === 'function' ? highlightSearchText(title, keyword) : title}</div>
                <div class="message-search-row-meta">${meta}</div>
            </div>
            <span class="message-search-row-chevron">›</span>
        </button>
    `;
}

function renderMessageSearchMain() {
    const keyword = String(state.messageSearchKeyword || '');
    const results = typeof getMessageSearchResults === 'function'
        ? getMessageSearchResults(keyword)
        : { contacts: [], chats: [], groups: [] };
    const recent = Array.isArray(state.messageSearchRecent) ? state.messageSearchRecent : [];
    const hasKeyword = !!keyword.trim();

    const contactsPreview = results.contacts.slice(0, 3);
    const chatsPreview = results.chats.slice(0, 3);
    const groupsPreview = results.groups.slice(0, 3);

    return `
        <div class="chat-fullscreen message-search-page">
            ${renderMessageSearchTop(keyword, { showBack: false, showCancel: true })}
            <div class="message-search-body chat-scroll-body">
                ${!hasKeyword && recent.length ? `
                    <div class="message-search-recent">
                        <div class="message-search-recent-head">
                            <span>最近搜索</span>
                            <button type="button" class="message-search-recent-clear" onclick="clearMessageSearchRecent()">清空</button>
                        </div>
                        <div class="message-search-recent-list">
                            ${recent.map(item => {
                                const keywordArg = JSON.stringify(String(item ?? ''));
                                const label = typeof escapeSearchHtml === 'function' ? escapeSearchHtml(item) : item;
                                return `<button type="button" class="message-search-recent-chip" onclick='applyMessageSearchKeyword(${keywordArg})'>${label}</button>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                ${hasKeyword ? `
                    <div class="message-search-section">
                        ${renderSearchSectionHeader('联系人', results.contacts.length, 'openMessageSearchContactsMore()')}
                        ${contactsPreview.length
                            ? contactsPreview.map(item => renderSearchContactRow(item, keyword)).join('')
                            : '<div class="message-search-empty">未找到相关联系人</div>'}
                    </div>
                    <div class="message-search-section">
                        ${renderSearchSectionHeader('聊天记录', results.chats.length, 'openMessageSearchChatsMore()')}
                        ${chatsPreview.length
                            ? chatsPreview.map(item => renderSearchChatPreviewRow(item, keyword)).join('')
                            : '<div class="message-search-empty">未找到相关聊天记录</div>'}
                    </div>
                    <div class="message-search-section">
                        ${renderSearchSectionHeader('群聊', results.groups.length, 'openMessageSearchGroupsMore()')}
                        ${groupsPreview.length
                            ? groupsPreview.map(group => `
                                <button type="button" class="message-search-row" onclick="alert('群聊功能开发中')">
                                    <img class="message-search-avatar" src="${group.avatar || MESSAGE_SEARCH_DEFAULT_AVATAR}" alt="">
                                    <div class="message-search-row-main">
                                        <div class="message-search-row-title">${typeof highlightSearchText === 'function' ? highlightSearchText(group.name || '群聊', keyword) : (group.name || '群聊')}</div>
                                        <div class="message-search-row-meta">${group.desc || '群聊'}</div>
                                    </div>
                                </button>
                            `).join('')
                            : '<div class="message-search-empty">未找到相关群聊</div>'}
                    </div>
                ` : (!recent.length ? '<div class="message-search-hint">输入关键词搜索联系人、备注、QQ号、聊天内容与群聊名称</div>' : '')}
            </div>
        </div>
    `;
}

function renderMessageSearchContactsMore() {
    const keyword = String(state.messageSearchKeyword || '');
    const results = typeof searchContactsByKeyword === 'function' ? searchContactsByKeyword(keyword) : [];
    return `
        <div class="chat-fullscreen message-search-page">
            ${renderMessageSearchTop(keyword, { showBack: true, showCancel: false })}
            <div class="message-search-body chat-scroll-body">
                <div class="message-search-section">
                    ${results.length
                        ? results.map(item => renderSearchContactRow(item, keyword, {
                            onClick: `openSearchContactProfile(${item.contactIndex})`
                        })).join('')
                        : '<div class="message-search-empty">未找到相关联系人</div>'}
                </div>
            </div>
        </div>
    `;
}

function renderMessageSearchChatsMore() {
    const keyword = String(state.messageSearchKeyword || '');
    const results = typeof searchChatRecordsByKeyword === 'function' ? searchChatRecordsByKeyword(keyword) : [];
    return `
        <div class="chat-fullscreen message-search-page">
            ${renderMessageSearchTop(keyword, { showBack: true, showCancel: false })}
            <div class="message-search-body chat-scroll-body">
                <div class="message-search-section">
                    ${results.length
                        ? results.map(item => `
                            <button type="button" class="message-search-row message-search-row-arrow" onclick="openMessageSearchChatDetail(${item.chatIndex})">
                                <img class="message-search-avatar" src="${item.contact.avatar || MESSAGE_SEARCH_DEFAULT_AVATAR}" alt="">
                                <div class="message-search-row-main">
                                    <div class="message-search-row-title">${typeof getSearchContactTitle === 'function' ? getSearchContactTitle(item.contact) : (item.contact.remark || item.contact.name)}</div>
                                    <div class="message-search-row-meta">${item.total} 条相关记录</div>
                                </div>
                                <span class="message-search-row-chevron">›</span>
                            </button>
                        `).join('')
                        : '<div class="message-search-empty">未找到相关聊天记录</div>'}
                </div>
            </div>
        </div>
    `;
}

function renderMessageSearchChatDetail() {
    const keyword = String(state.messageSearchKeyword || '');
    const chatIndex = state.messageSearchSubChatIndex;
    const chat = Number.isInteger(chatIndex) ? state.chats[chatIndex] : null;
    if (!chat) {
        return renderMessageSearchChatsMore();
    }
    const hits = typeof searchChatRecordsByKeyword === 'function'
        ? (searchChatRecordsByKeyword(keyword).find(item => item.chatIndex === chatIndex)?.hits || [])
        : [];
    const title = typeof getSearchContactTitle === 'function'
        ? getSearchContactTitle(chat.contact)
        : (chat.contact.remark || chat.contact.name);

    return `
        <div class="chat-fullscreen message-search-page">
            ${renderMessageSearchTop(keyword, { showBack: true, showCancel: false })}
            <div class="message-search-body chat-scroll-body">
                <div class="message-search-section">
                    ${hits.length
                        ? hits.map(hit => `
                            <button type="button" class="message-search-hit-item message-search-hit-item-full ${hit.isMine ? 'mine' : 'theirs'}" onclick="jumpToSearchMessage(${chatIndex}, ${hit.msgIndex})">
                                <div class="message-search-hit-snippet">${typeof highlightSearchText === 'function' ? highlightSearchText(hit.snippet, keyword) : hit.snippet}</div>
                                <div class="message-search-hit-time">${hit.time || ''}</div>
                            </button>
                        `).join('')
                        : '<div class="message-search-empty">未找到相关消息</div>'}
                </div>
            </div>
        </div>
    `;
}

function renderMessageSearchGroupsMore() {
    const keyword = String(state.messageSearchKeyword || '');
    const results = typeof searchGroupsByKeyword === 'function' ? searchGroupsByKeyword(keyword) : [];
    return `
        <div class="chat-fullscreen message-search-page">
            ${renderMessageSearchTop(keyword, { showBack: true, showCancel: false })}
            <div class="message-search-body chat-scroll-body">
                <div class="message-search-section">
                    ${results.length
                        ? results.map(group => `
                            <button type="button" class="message-search-row" onclick="alert('群聊功能开发中')">
                                <img class="message-search-avatar" src="${group.avatar || MESSAGE_SEARCH_DEFAULT_AVATAR}" alt="">
                                <div class="message-search-row-main">
                                    <div class="message-search-row-title">${typeof highlightSearchText === 'function' ? highlightSearchText(group.name || '群聊', keyword) : (group.name || '群聊')}</div>
                                    <div class="message-search-row-meta">${group.desc || '群聊'}</div>
                                </div>
                            </button>
                        `).join('')
                        : '<div class="message-search-empty">未找到相关群聊</div>'}
                </div>
            </div>
        </div>
    `;
}

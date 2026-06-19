const DECORATE_UPLOAD_ICON =
    'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/System/upload-2-line.svg';
const DECORATE_PROFILE_ICON =
    'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/User%20%26%20Faces/user-line.svg';

const decorateState = {
    currentTab: 'recommend',
    themeDetailId: null,
    themeDetailSlide: 0,
    themeDetailChromeVisible: false,
    uploadThemeId: null
};

const DECORATE_TABS = [
    { id: 'recommend', label: '推荐' },
    { id: 'theme', label: '主题' },
    { id: 'avatar', label: '头像挂件' },
    { id: 'background', label: '聊天背景' },
    { id: 'font', label: '字体' }
];

const DECORATE_THEMES = [
    {
        id: 'glass',
        name: '磨砂蓝白',
        previewImage: './assets/decorate/theme-glass-preview.png',
        previewType: 'theme-glass',
        defaultBubbleId: 'glass-blue',
        css: './themes/glass.css'
    },
    {
        id: 'warm',
        name: '暖色简约',
        previewImage: './assets/decorate/theme-warm-preview.png',
        previewType: 'theme-warm',
        defaultBubbleId: 'warm-orange',
        css: './themes/warm.css'
    }
];

const THEME_PREVIEW_ASSISTANT = {
    name: '小助手',
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23ebb382'/%3E%3Ctext x='50' y='58' text-anchor='middle' font-size='34' fill='%23fff' font-family='sans-serif'%3E助%3C/text%3E%3C/svg%3E"
};

const THEME_PREVIEW_ROBOT = {
    name: '测试机器人',
    avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23a8b0bc'/%3E%3Ctext x='50' y='58' text-anchor='middle' font-size='34' fill='%23fff' font-family='sans-serif'%3E机%3C/text%3E%3C/svg%3E"
};

function getThemeById(themeId) {
    return DECORATE_THEMES.find((item) => item.id === themeId) || null;
}

function openDecorateApp() {
    closeSidebar();
    decorateState.themeDetailId = null;
    decorateState.themeDetailSlide = 0;
    decorateState.themeDetailChromeVisible = false;
    initDecorateApp();
}

function initDecorateApp() {
    const container = document.querySelector('.iphone-container');
    if (!container) return;
    if (decorateState.currentTab === 'bubble') {
        decorateState.currentTab = 'recommend';
    }
    if (typeof applyChatDecorateSettings === 'function') {
        applyChatDecorateSettings();
    }
    document.body.classList.remove('mode-home', 'mode-chat', 'mode-settings');
    document.body.classList.add('mode-decorate');
    if (decorateState.themeDetailId) {
        container.innerHTML = renderThemeDetailPage(decorateState.themeDetailId);
        attachThemeDetailCarousel();
        attachThemeDetailUpload();
    } else {
        container.innerHTML = renderDecorateApp();
        const contentEl = container.querySelector('.decorate-content');
        if (contentEl) {
            contentEl.innerHTML = renderDecorateContent();
        }
        attachDecorateTabScroll();
        scrollActiveDecorateTabIntoView(false);
    }
    if (typeof syncIosBottomFill === 'function') {
        requestAnimationFrame(syncIosBottomFill);
    }
    if (typeof mountStatusBar === 'function') {
        requestAnimationFrame(mountStatusBar);
    }
}

function renderDecorateApp() {
    const tabsHtml = DECORATE_TABS.map((tab) => {
        const isActive = tab.id === decorateState.currentTab;
        const activeClass = isActive ? ' active' : '';
        return `<div class="decorate-tab${activeClass}" onclick="switchDecorateTab('${tab.id}')">${tab.label}</div>`;
    }).join('');

    return `
        <div class="decorate-app">
            <div class="decorate-header">
                <div class="decorate-header-side">
                    <div class="decorate-back-btn" onclick="goBackFromDecorate()">‹</div>
                </div>
                <div class="decorate-header-title">个性装扮</div>
                <div class="decorate-header-side decorate-header-actions">
                    <button type="button" class="decorate-header-icon-btn" aria-label="个人"
                        onclick="openDecorateProfile()">
                        <span class="nav-icon-svg" style="--icon-url:url('${DECORATE_PROFILE_ICON}')"></span>
                    </button>
                </div>
            </div>
            <div class="decorate-tabs-wrap">
                <div class="decorate-tabs">${tabsHtml}</div>
            </div>
            <div class="decorate-content"></div>
        </div>
    `;
}

function renderThemeDetailPage(themeId) {
    const theme = getThemeById(themeId);
    if (!theme) {
        decorateState.themeDetailId = null;
        return renderDecorateApp();
    }

    const settings = loadChatDecorateSettings();
    const isApplied = settings.themeId === themeId;
    const activeDot = decorateState.themeDetailSlide || 0;
    const dotsHtml = [0, 1, 2].map((index) => {
        const activeClass = index === activeDot ? ' active' : '';
        return `<span class="theme-detail-dot${activeClass}" data-dot="${index}" onclick="event.stopPropagation(); goThemeDetailSlide(${index})"></span>`;
    }).join('');
    const applyClass = isApplied ? ' theme-detail-apply is-applied' : ' theme-detail-apply';
    const applyAttrs = isApplied ? 'disabled' : `onclick="applyThemeFromDetail('${themeId}')"`;
    const chromeClass = decorateState.themeDetailChromeVisible ? ' is-chrome-visible' : '';

    return `
        <div class="decorate-app decorate-theme-detail${chromeClass}">
            <div class="theme-detail-stage">
                <div class="theme-detail-carousel" id="themeDetailCarousel">
                    <div class="theme-detail-slide">${renderThemeDetailSlideMessages()}</div>
                    <div class="theme-detail-slide">${renderThemeDetailSlideChat()}</div>
                    <div class="theme-detail-slide">${renderThemeDetailSlideSidebar()}</div>
                </div>
            </div>
            <div class="theme-detail-chrome theme-detail-chrome-top decorate-header theme-detail-header"
                onclick="event.stopPropagation()">
                <div class="decorate-header-side">
                    <div class="decorate-back-btn" onclick="goBackFromThemeDetail()">‹</div>
                </div>
                <div class="decorate-header-title">主题</div>
                <div class="decorate-header-side decorate-header-actions">
                    <button type="button" class="decorate-header-icon-btn" aria-label="更多" disabled>
                        <span class="theme-detail-more">···</span>
                    </button>
                </div>
            </div>
            <div class="theme-detail-chrome theme-detail-chrome-bottom theme-detail-footer"
                onclick="event.stopPropagation()">
                <div class="theme-detail-name">${theme.name}</div>
                <div class="theme-detail-dots" id="themeDetailDots">${dotsHtml}</div>
                <div class="theme-detail-actions">
                    <button type="button" class="theme-detail-upload" aria-label="上传封面"
                        onclick="triggerThemeCoverUpload('${themeId}')">
                        <span class="nav-icon-svg" style="--icon-url:url('${DECORATE_UPLOAD_ICON}')"></span>
                    </button>
                    <button type="button" class="${applyClass}" ${applyAttrs}>
                        ${isApplied ? '已应用' : '应用'}
                    </button>
                </div>
            </div>
            <input type="file" id="themeCoverFileInput" accept="image/*" hidden>
            <div class="home-indicator"></div>
        </div>
    `;
}

function getThemePreviewPlaceholderAvatar() {
    return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E';
}

function getThemePreviewUserAvatar() {
    return state.currentUser?.avatar || getThemePreviewPlaceholderAvatar();
}

function getThemeDefaultBubbleId(themeId) {
    const theme = getThemeById(themeId);
    return theme?.defaultBubbleId || 'glass-blue';
}

function syncBubbleWithTheme(settings) {
    if (!settings) return settings;
    settings.bubbleId = getThemeDefaultBubbleId(settings.themeId || 'glass');
    return settings;
}

function getThemePreviewShellAttrs(themeId) {
    const id = themeId || loadChatDecorateSettings().themeId || 'glass';
    const bubbleId = getThemeDefaultBubbleId(id);
    return `data-chat-theme="${id}" data-chat-bubble="${bubbleId}"`;
}

function getThemePreviewSidebarBg(themeId) {
    const id = themeId
        || (typeof loadChatDecorateSettings === 'function' ? loadChatDecorateSettings().themeId : null)
        || 'glass';
    const assets = typeof getThemeBackgrounds === 'function' ? getThemeBackgrounds(id) : null;
    return assets?.sidebarBg || (typeof GLASS_SIDEBAR_BG !== 'undefined' ? GLASS_SIDEBAR_BG : '');
}

function renderThemePreviewBottomNav() {
    return `
        <div class="bottom-nav">
            <div class="nav-item active">
                <div class="nav-icon-wrap">
                    <span class="nav-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413261667_message-2-fill.svg')"></span>
                </div>
                <span>消息</span>
            </div>
            <div class="nav-item nav-item-channels">
                <span class="nav-icon-svg" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Editor/hashtag.svg')"></span>
                <span>频道</span>
            </div>
            <div class="nav-item">
                <span class="nav-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413265763_user-3-line.svg')"></span>
                <span>联系人</span>
            </div>
            <div class="nav-item">
                <span class="nav-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779413265219_star-smile-line.svg')"></span>
                <span>动态</span>
            </div>
        </div>
    `;
}

function renderThemePreviewChatListItems() {
    return `
        <div class="chat-item pinned">
            <div class="pinned-badge"></div>
            <div class="chat-avatar-wrap">
                <img class="avatar-44" src="${THEME_PREVIEW_ASSISTANT.avatar}" alt="">
            </div>
            <div class="chat-item-main">
                <div class="text-15-medium">${THEME_PREVIEW_ASSISTANT.name}</div>
                <div class="chat-item-preview">[转账] 转账</div>
            </div>
            <div class="text-right">
                <div class="text-12-muted">12:30</div>
            </div>
        </div>
        <div class="chat-item">
            <div class="chat-avatar-wrap">
                <img class="avatar-44" src="${THEME_PREVIEW_ROBOT.avatar}" alt="">
            </div>
            <div class="chat-item-main">
                <div class="text-15-medium">${THEME_PREVIEW_ROBOT.name}</div>
                <div class="chat-item-preview">[图片] 这是一张图片预览</div>
            </div>
            <div class="text-right">
                <div class="text-12-muted">昨天</div>
            </div>
        </div>
    `;
}

function renderThemePreviewTransferCard({ amount, note, isMine, status }) {
    const footerText = isMine
        ? (status === 'claimed' ? '对方已收款' : '待对方接收')
        : (status === 'claimed' ? '已收款' : '待收款');
    const done = status === 'claimed';
    return `
        <div class="pay-card-transfer ${done ? 'pay-card-done' : ''}">
            <div class="pay-card-transfer-main">
                <div class="pay-card-icon pay-card-icon-transfer"></div>
                <div class="pay-card-body">
                    <div class="pay-card-title">¥${Number(amount || 0).toFixed(2)}</div>
                    <div class="pay-card-sub">${note || '转账'}</div>
                </div>
            </div>
            <div class="pay-card-transfer-footer">${footerText}</div>
        </div>
    `;
}

function renderThemePreviewMessageRow({ isMine, bubbleClass, innerHtml }) {
    const avatar = isMine ? getThemePreviewUserAvatar() : THEME_PREVIEW_ASSISTANT.avatar;
    const itemClass = isMine ? 'message-item mine' : 'message-item';
    const bubbleExtra = bubbleClass ? ` ${bubbleClass}` : '';
    return `
        <div class="${itemClass}">
            <img class="message-avatar" src="${avatar}" alt="">
            <div class="message-bubble${bubbleExtra}">${innerHtml}</div>
        </div>
    `;
}

function renderThemePreviewVoiceBubble(text) {
    const duration = getMockVoiceDurationSeconds(text);
    return `
        <div class="message-content message-content-voice">
            <span class="voice-play-icon">▶</span>
            ${renderVoiceWaveMarkup(duration)}
            <span class="voice-duration">${duration}"</span>
        </div>
        <div class="voice-transcript">${text}</div>
    `;
}

function renderThemePreviewImageBubble(text) {
    return `
        <div class="message-content message-content-image">
            <div class="mock-image-note">
                <div class="mock-image-note-text">${text}</div>
            </div>
        </div>
    `;
}

function renderThemePreviewChatMessages() {
    return [
        renderThemePreviewMessageRow({
            isMine: true,
            innerHtml: '<div class="message-content"><div class="quoted-reply-text">你好</div></div>'
        }),
        renderThemePreviewMessageRow({
            isMine: false,
            innerHtml: renderThemePreviewVoiceBubble('这是一条语音消息')
        }),
        renderThemePreviewMessageRow({
            isMine: true,
            bubbleClass: 'message-bubble-image',
            innerHtml: renderThemePreviewImageBubble('这是一张图片预览')
        }),
        renderThemePreviewMessageRow({
            isMine: true,
            bubbleClass: 'message-bubble-payment',
            innerHtml: renderThemePreviewTransferCard({
                amount: 1,
                note: '转账',
                isMine: true,
                status: 'pending'
            })
        }),
        renderThemePreviewMessageRow({
            isMine: false,
            bubbleClass: 'message-bubble-payment',
            innerHtml: renderThemePreviewTransferCard({
                amount: 1,
                note: '转账',
                isMine: false,
                status: 'claimed'
            })
        })
    ].join('');
}

function renderThemePreviewChatComposer() {
    return `
        <div class="chat-composer">
            <div class="chat-input-stack">
                <div class="chat-input-bar">
                    <input class="chat-input" type="text" readonly tabindex="-1" placeholder="输入消息或表情描述..." value="">
                    <button class="receive-btn" type="button" tabindex="-1" aria-hidden="true">
                        <img class="icon-20" src="https://img.heliar.top/file/1779243354774_内部传输_internal-transmission.png" alt="">
                    </button>
                    <button class="send-btn" type="button" tabindex="-1" aria-hidden="true">
                        <img class="icon-20" src="https://img.heliar.top/file/1779242699503_发送_send.png" alt="">
                    </button>
                </div>
            </div>
            <div class="chat-tools-bar">
                <button class="chat-tool-btn" type="button" tabindex="-1" aria-hidden="true"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414599723_mic-fill.svg')"></span></button>
                <button class="chat-tool-btn" type="button" tabindex="-1" aria-hidden="true"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414606124_image-fill.svg')"></span></button>
                <button class="chat-tool-btn" type="button" tabindex="-1" aria-hidden="true"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414599852_camera-fill.svg')"></span></button>
                <button class="chat-tool-btn" type="button" tabindex="-1" aria-hidden="true"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414603496_emotion-line.svg')"></span></button>
                <button class="chat-tool-btn" type="button" tabindex="-1" aria-hidden="true"><span class="chat-tool-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414609713_add-line.svg')"></span></button>
            </div>
        </div>
    `;
}

function renderThemeDetailSlideMessages() {
    const themeId = decorateState.themeDetailId || loadChatDecorateSettings().themeId || 'glass';
    const shellAttrs = getThemePreviewShellAttrs(themeId);
    return `
        <div class="theme-detail-preview-shell chat-app" ${shellAttrs}>
            <div class="main-content with-tab-bar">
                <div class="chat-header">
                    <button type="button" class="back-btn" tabindex="-1" aria-hidden="true">←</button>
                    <div class="header-title">消息</div>
                    <div></div>
                </div>
                <div class="chat-content chat-scroll-host">
                    <div class="message-list-search-wrap">
                        <button type="button" class="message-list-search-trigger" tabindex="-1">
                            <span class="message-list-search-icon">⌕</span>
                            <span class="message-list-search-placeholder">搜索</span>
                        </button>
                    </div>
                    <div class="chat-list chat-scroll-body">
                        ${renderThemePreviewChatListItems()}
                    </div>
                </div>
                ${renderThemePreviewBottomNav()}
            </div>
        </div>
    `;
}

function renderThemeDetailSlideChat() {
    const themeId = decorateState.themeDetailId || loadChatDecorateSettings().themeId || 'glass';
    const shellAttrs = getThemePreviewShellAttrs(themeId);
    return `
        <div class="theme-detail-preview-shell chat-app" ${shellAttrs}>
            <div class="chat-fullscreen theme-detail-chat-preview">
                <div class="chat-header">
                    <button type="button" class="back-btn" tabindex="-1" aria-hidden="true">‹</button>
                    <img class="avatar-36" src="${THEME_PREVIEW_ASSISTANT.avatar}" alt="">
                    <div class="flex-1">
                        <div class="text-15-medium">${THEME_PREVIEW_ASSISTANT.name}</div>
                        <div class="text-12-muted">在线</div>
                    </div>
                    <div class="chat-header-actions">
                        <button type="button" class="menu-btn" tabindex="-1" aria-hidden="true">⋮</button>
                    </div>
                </div>
                <div class="chat-messages theme-detail-chat-messages">
                    ${renderThemePreviewChatMessages()}
                </div>
                ${renderThemePreviewChatComposer()}
            </div>
        </div>
    `;
}

function renderThemeDetailSlideSidebar() {
    const user = state.currentUser || {};
    const themeId = decorateState.themeDetailId || loadChatDecorateSettings().themeId || 'glass';
    const sidebarBg = getThemePreviewSidebarBg(themeId);
    const shellAttrs = getThemePreviewShellAttrs(themeId);
    const userAvatar = getThemePreviewUserAvatar();
    const nickname = user.nickname || '用户';
    const signature = user.signature || '';

    return `
        <div class="theme-detail-preview-shell chat-app" ${shellAttrs}>
            <div class="sidebar open theme-detail-sidebar-preview">
                <div class="sidebar-bg" style="background-image:url('${sidebarBg}')">
                    <div class="sidebar-bg-overlay"></div>
                </div>
                <div class="sidebar-user">
                    <div class="user-info">
                        <img class="user-avatar" src="${userAvatar}" alt="">
                        <div class="user-details">
                            <div class="user-nick-row">
                                <span class="user-nickname">${nickname}</span>
                                <span class="switch-account">切换账号</span>
                            </div>
                            <div class="user-signature">${signature}</div>
                        </div>
                    </div>
                </div>
                <div class="sidebar-menu">
                    <div class="menu-item">
                        <span class="menu-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414605563_wallet-3-fill.svg')"></span>
                        <span class="menu-item-text">我的钱包</span>
                    </div>
                    <div class="menu-item">
                        <span class="menu-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414606253_folder-open-fill.svg')"></span>
                        我的文件
                    </div>
                    <div class="menu-item">
                        <span class="menu-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414602934_draw-fill.svg')"></span>
                        个性装扮
                    </div>
                    <div class="menu-item">
                        <span class="menu-icon-svg" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Health%20%26%20Medical/heart-fill.svg')"></span>
                        我的收藏
                    </div>
                    <div class="menu-item">
                        <span class="menu-icon-svg" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/System/settings-3-fill.svg')"></span>
                        我的设置
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderDecorateContent() {
    const tab = decorateState.currentTab;
    const settings = loadChatDecorateSettings();
    const sections = [];

    if (tab === 'recommend' || tab === 'theme') {
        sections.push(renderDecorateSection({
            title: '主题',
            targetTab: 'theme',
            cardsHtml: renderDecorateThemeCards(settings)
        }));
    }

    if (!sections.length) {
        return '<div class="decorate-empty">暂无内容</div>';
    }

    return `<div class="decorate-content-inner">${sections.join('')}</div>`;
}

function renderDecorateSection({ title, targetTab, cardsHtml }) {
    return `
        <section class="decorate-section">
            <div class="decorate-section-head" onclick="openDecorateSectionTab('${targetTab}')">
                <h2 class="decorate-section-title">${title}</h2>
                <span class="decorate-section-more" aria-hidden="true">›</span>
            </div>
            <div class="decorate-scroll-row">${cardsHtml}</div>
        </section>
    `;
}

function renderDecorateThemeCards(settings) {
    return DECORATE_THEMES.map((item) => renderDecorateCard({
        item,
        isActive: settings.themeId === item.id,
        onClick: `openThemeDetail('${item.id}')`
    })).join('');
}

function renderDecorateCard({ item, isActive, onClick, previewShape }) {
    const activeClass = isActive ? ' is-active' : '';
    const shapeClass = previewShape === 'square' ? ' decorate-card-preview--square' : '';
    const bubbleBgClass = previewShape === 'square' ? ' decorate-card-preview--bubble-bg' : '';
    return `
        <article class="decorate-card${activeClass}" onclick="${onClick}">
            <div class="decorate-card-preview${shapeClass}${bubbleBgClass}">
                ${renderDecoratePreview(item)}
            </div>
            <div class="decorate-card-name">${item.name}</div>
        </article>
    `;
}

function renderDecoratePreview(item) {
    const previewImage = typeof getThemePreviewImage === 'function'
        ? getThemePreviewImage(item)
        : item.previewImage;
    if (previewImage) {
        return `<img class="decorate-card-preview-img" src="${previewImage}" alt="${item.name}">`;
    }
    if (item.previewType === 'theme-glass') {
        return renderGlassThemePreview();
    }
    if (item.previewType === 'theme-warm') {
        return renderWarmThemePreview();
    }
    return '';
}

function renderGlassThemePreview() {
    return `
        <div class="decorate-mock decorate-mock-theme-glass" aria-hidden="true">
            <div class="decorate-theme-header--glass">
                <span class="decorate-theme-back--glass">‹</span>
                <span class="decorate-theme-title--glass">消息</span>
            </div>
            <div class="decorate-theme-body--glass">
                <div class="decorate-theme-row--glass">
                    <div class="decorate-theme-avatar--glass"></div>
                    <div class="decorate-theme-row-main">
                        <div class="decorate-theme-name--glass">...</div>
                        <div class="decorate-theme-msg--glass">...</div>
                    </div>
                    <div class="decorate-theme-time--glass">21:30</div>
                </div>
                <div class="decorate-theme-row--glass">
                    <div class="decorate-theme-avatar--glass decorate-theme-avatar--glass-alt"></div>
                    <div class="decorate-theme-row-main">
                        <div class="decorate-theme-name--glass">...</div>
                        <div class="decorate-theme-msg--glass">...</div>
                    </div>
                    <div class="decorate-theme-time--glass">20:12</div>
                </div>
            </div>
            <div class="decorate-theme-tabbar--glass">
                <span class="decorate-theme-tab--glass is-active"></span>
                <span class="decorate-theme-tab--glass"></span>
                <span class="decorate-theme-tab--glass"></span>
                <span class="decorate-theme-tab--glass"></span>
            </div>
        </div>
    `;
}

function renderWarmThemePreview() {
    return `
        <div class="decorate-mock decorate-mock-theme-warm" aria-hidden="true">
            <div class="decorate-theme-header">
                <span class="decorate-theme-back">‹</span>
                <span class="decorate-theme-title">消息</span>
            </div>
            <div class="decorate-theme-body">
                <div class="decorate-theme-row">
                    <div class="decorate-theme-avatar"></div>
                    <div class="decorate-theme-row-main">
                        <div class="decorate-theme-name">小鹿</div>
                        <div class="decorate-theme-msg">晚安呀～</div>
                    </div>
                    <div class="decorate-theme-time">21:30</div>
                </div>
                <div class="decorate-theme-row">
                    <div class="decorate-theme-avatar decorate-theme-avatar--alt"></div>
                    <div class="decorate-theme-row-main">
                        <div class="decorate-theme-name">眠眠</div>
                        <div class="decorate-theme-msg">明天见</div>
                    </div>
                    <div class="decorate-theme-time">20:12</div>
                </div>
                <div class="decorate-theme-row">
                    <div class="decorate-theme-avatar decorate-theme-avatar--alt2"></div>
                    <div class="decorate-theme-row-main">
                        <div class="decorate-theme-name">鹿群</div>
                        <div class="decorate-theme-msg">[图片] 这是一张图片预览</div>
                    </div>
                    <div class="decorate-theme-time">昨天</div>
                </div>
            </div>
            <div class="decorate-theme-tabbar">
                <span class="decorate-theme-tab is-active"></span>
                <span class="decorate-theme-tab"></span>
                <span class="decorate-theme-tab"></span>
                <span class="decorate-theme-tab"></span>
            </div>
        </div>
    `;
}

function openThemeDetail(themeId) {
    if (!getThemeById(themeId)) return;
    decorateState.themeDetailId = themeId;
    decorateState.themeDetailSlide = 0;
    decorateState.themeDetailChromeVisible = false;
    initDecorateApp();
}

function goBackFromThemeDetail() {
    decorateState.themeDetailId = null;
    decorateState.themeDetailSlide = 0;
    decorateState.themeDetailChromeVisible = false;
    initDecorateApp();
}

function toggleThemeDetailChrome() {
    decorateState.themeDetailChromeVisible = !decorateState.themeDetailChromeVisible;
    const root = document.querySelector('.decorate-theme-detail');
    if (root) {
        root.classList.toggle('is-chrome-visible', decorateState.themeDetailChromeVisible);
    }
}

function applyThemeFromDetail(themeId) {
    const settings = loadChatDecorateSettings();
    if (settings.themeId === themeId) return;
    settings.themeId = themeId;
    syncBubbleWithTheme(settings);
    saveChatDecorateSettings(settings);
    applyChatDecorateSettings();
    if (typeof applyThemeBackgrounds === 'function') {
        applyThemeBackgrounds(themeId);
    }
    initDecorateApp();
}

function triggerThemeCoverUpload(themeId) {
    decorateState.uploadThemeId = themeId;
    const input = document.getElementById('themeCoverFileInput');
    if (input) input.click();
}

function attachThemeDetailUpload() {
    const input = document.getElementById('themeCoverFileInput');
    if (!input) return;
    input.onchange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file || !decorateState.uploadThemeId) return;
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            if (typeof saveThemePreviewImage === 'function') {
                saveThemePreviewImage(decorateState.uploadThemeId, loadEvent.target.result);
            }
            input.value = '';
            initDecorateApp();
        };
        reader.readAsDataURL(file);
    };
}

function goThemeDetailSlide(index) {
    const carousel = document.getElementById('themeDetailCarousel');
    if (!carousel) return;
    const slide = Math.max(0, Math.min(2, index));
    decorateState.themeDetailSlide = slide;
    carousel.scrollTo({
        left: carousel.clientWidth * slide,
        behavior: 'smooth'
    });
    document.querySelectorAll('.theme-detail-dot').forEach((dot) => {
        dot.classList.toggle('active', Number(dot.dataset.dot) === slide);
    });
}

function attachThemeDetailCarousel() {
    const carousel = document.getElementById('themeDetailCarousel');
    if (!carousel) return;

    if (decorateState.themeDetailSlide > 0) {
        carousel.scrollLeft = carousel.clientWidth * decorateState.themeDetailSlide;
    }

    const syncDots = () => {
        const slide = Math.round(carousel.scrollLeft / carousel.clientWidth);
        const nextSlide = Number.isFinite(slide) ? Math.max(0, Math.min(2, slide)) : 0;
        if (nextSlide === decorateState.themeDetailSlide) return;
        decorateState.themeDetailSlide = nextSlide;
        document.querySelectorAll('.theme-detail-dot').forEach((dot) => {
            const index = Number(dot.dataset.dot);
            dot.classList.toggle('active', index === nextSlide);
        });
    };

    carousel.addEventListener('scroll', syncDots, { passive: true });

    carousel.onwheel = (event) => {
        if (carousel.scrollWidth <= carousel.clientWidth) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        carousel.scrollLeft += event.deltaY;
    };

    let dragActive = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let pointerMoved = false;
    let touchMoved = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const endDrag = () => {
        if (!dragActive) return;
        dragActive = false;
        carousel.classList.remove('is-dragging');
        const slide = Math.round(carousel.scrollLeft / carousel.clientWidth);
        const nextSlide = Math.max(0, Math.min(2, slide));
        decorateState.themeDetailSlide = nextSlide;
        carousel.scrollTo({
            left: carousel.clientWidth * nextSlide,
            behavior: 'smooth'
        });
        document.querySelectorAll('.theme-detail-dot').forEach((dot) => {
            dot.classList.toggle('active', Number(dot.dataset.dot) === nextSlide);
        });
    };

    carousel.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return;
        dragActive = true;
        pointerMoved = false;
        dragStartX = event.pageX;
        dragStartScroll = carousel.scrollLeft;
        carousel.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (event) => {
        if (!dragActive) return;
        if (Math.abs(event.pageX - dragStartX) > 8) {
            pointerMoved = true;
        }
        event.preventDefault();
        carousel.scrollLeft = dragStartScroll - (event.pageX - dragStartX);
    });

    window.addEventListener('mouseup', endDrag);

    carousel.addEventListener('touchstart', (event) => {
        const touch = event.touches && event.touches[0];
        touchMoved = false;
        if (touch) {
            touchStartX = touch.pageX;
            touchStartY = touch.pageY;
        }
    }, { passive: true });

    carousel.addEventListener('touchmove', (event) => {
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        if (Math.abs(touch.pageX - touchStartX) > 8 || Math.abs(touch.pageY - touchStartY) > 8) {
            touchMoved = true;
        }
    }, { passive: true });

    carousel.addEventListener('click', (event) => {
        if (pointerMoved || touchMoved) return;
        event.stopPropagation();
        toggleThemeDetailChrome();
    });
}

function openDecorateSectionTab(tab) {
    if (decorateState.currentTab === tab) return;
    decorateState.currentTab = tab;
    initDecorateApp();
    scrollActiveDecorateTabIntoView(true);
}

function applyChatDecorateSettings() {
    const settings = typeof loadChatDecorateSettings === 'function'
        ? loadChatDecorateSettings()
        : { themeId: 'glass', bubbleId: 'glass-blue' };
    const root = document.documentElement;
    const previewThemeId = decorateState.themeDetailId;
    const themeId = previewThemeId || settings.themeId || 'glass';
    const bubbleId = getThemeDefaultBubbleId(themeId);

    if (!previewThemeId && settings.bubbleId !== bubbleId) {
        settings.bubbleId = bubbleId;
        if (typeof saveChatDecorateSettings === 'function') {
            saveChatDecorateSettings(settings);
        }
    }

    if (themeId === 'warm') {
        root.dataset.chatTheme = 'warm';
    } else if (themeId === 'glass') {
        root.dataset.chatTheme = 'glass';
    } else {
        root.dataset.chatTheme = themeId;
    }

    if (bubbleId === 'warm-orange') {
        root.dataset.chatBubble = 'warm-orange';
    } else {
        root.dataset.chatBubble = 'glass-blue';
    }
}

function scrollActiveDecorateTabIntoView(smooth) {
    requestAnimationFrame(() => {
        const wrap = document.querySelector('.decorate-tabs-wrap');
        const activeTab = document.querySelector('.decorate-tab.active');
        if (!wrap || !activeTab || wrap.scrollWidth <= wrap.clientWidth) return;

        const tabLeft = activeTab.offsetLeft;
        const tabWidth = activeTab.offsetWidth;
        const wrapWidth = wrap.clientWidth;
        const target = tabLeft - (wrapWidth - tabWidth) / 2;
        const maxScroll = wrap.scrollWidth - wrapWidth;
        const nextLeft = Math.max(0, Math.min(target, maxScroll));

        wrap.scrollTo({
            left: nextLeft,
            behavior: smooth ? 'smooth' : 'auto'
        });
    });
}

function attachDecorateTabScroll() {
    const wrap = document.querySelector('.decorate-tabs-wrap');
    if (!wrap) return;

    wrap.onwheel = (event) => {
        if (wrap.scrollWidth <= wrap.clientWidth) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        wrap.scrollLeft += event.deltaY;
    };
}

function switchDecorateTab(tab) {
    if (decorateState.currentTab === tab) return;
    decorateState.currentTab = tab;
    initDecorateApp();
    scrollActiveDecorateTabIntoView(true);
}

function goBackFromDecorate() {
    decorateState.themeDetailId = null;
    applyChatDecorateSettings();
    initChatApp();
}

function openDecorateProfile() {
    alert('个人中心开发中');
}

applyChatDecorateSettings();

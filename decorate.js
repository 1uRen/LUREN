const DECORATE_UPLOAD_ICON =
    'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/System/upload-2-line.svg';
const DECORATE_PROFILE_ICON =
    'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/User%20%26%20Faces/user-line.svg';

const decorateState = {
    currentTab: 'recommend'
    // chatTheme: 'default' | 'qq'  // phase 2: default = warm; qq = blue-white
};

const DECORATE_TABS = [
    { id: 'recommend', label: '推荐' },
    { id: 'theme', label: '主题' },
    { id: 'bubble', label: '聊天气泡' },
    { id: 'avatar', label: '头像挂件' },
    { id: 'background', label: '聊天背景' },
    { id: 'font', label: '字体' }
];

function openDecorateApp() {
    closeSidebar();
    initDecorateApp();
}

function initDecorateApp() {
    const container = document.querySelector('.iphone-container');
    if (!container) return;
    document.body.classList.remove('mode-home', 'mode-chat', 'mode-settings');
    document.body.classList.add('mode-decorate');
    container.innerHTML = renderDecorateApp();
    attachDecorateTabScroll();
    scrollActiveDecorateTabIntoView(false);
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
                    <button type="button" class="decorate-header-icon-btn" aria-label="上传"
                        onclick="openDecorateUpload()">
                        <span class="nav-icon-svg" style="--icon-url:url('${DECORATE_UPLOAD_ICON}')"></span>
                    </button>
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
            <div class="home-indicator"></div>
        </div>
    `;
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
    initChatApp();
}

function openDecorateUpload() {
    alert('上传功能开发中');
}

function openDecorateProfile() {
    alert('个人中心开发中');
}

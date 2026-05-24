// chat-render-sidebar module
function renderSidebar() {
    const sidebarBg = state.currentUser?.background || DEFAULT_SIDEBAR_BG;
    const hasWalletRedDot = !state.walletLastCollectDate || state.walletLastCollectDate !== getTodayDate();
    return `
        <div class="sidebar ${state.sidebarOpen ? 'open' : ''}">
            <div class="sidebar-bg" style="background-image:url('${sidebarBg}')" onclick="openChangeBgModal()">
                <div class="sidebar-bg-overlay"></div>
            </div>
            <div class="sidebar-user">
                <div class="user-info">
                    <img class="user-avatar" src="${state.currentUser.avatar}">
                    <div class="user-details">
                        <div class="user-nick-row">
                            <span class="user-nickname">${state.currentUser.nickname}</span>
                            <span class="switch-account" onclick="openAccountModal()">切换账号</span>
                        </div>
                        <div class="user-signature" contenteditable="true" onblur="saveSignature(this)">${state.currentUser.signature}</div>
                    </div>
                </div>
            </div>
            <div class="sidebar-menu">
                <div class="menu-item" onclick="openWallet()">
                    <span class="menu-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414605563_wallet-3-fill.svg')"></span>
                    <span class="menu-item-text">我的钱包</span>
                    ${hasWalletRedDot ? '<span class="wallet-red-dot"></span>' : ''}
                </div>
                <div class="menu-item"><span class="menu-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414606253_folder-open-fill.svg')"></span>我的文件</div>
                <div class="menu-item"><span class="menu-icon-svg" style="--icon-url:url('https://img.heliar.top/file/1779414602934_draw-fill.svg')"></span>个性装扮</div>
                <div class="menu-item"><span class="menu-icon-svg" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Health%20%26%20Medical/heart-fill.svg')"></span>我的收藏</div>
                <div class="menu-item"><span class="menu-icon-svg" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/System/settings-3-fill.svg')"></span>我的设置</div>
            </div>
        </div>
        <div class="sidebar-overlay ${state.sidebarOpen ? 'show' : ''}" onclick="closeSidebar()"></div>
    `;
}

function getTodayDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

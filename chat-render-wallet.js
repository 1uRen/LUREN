// chat-render-wallet module
function renderWalletPage() {
    const balance = state.walletBalance || 0;
    const canCollect = typeof canCollectWalletReward === 'function' ? canCollectWalletReward() : true;
    
    return `
        <div class="wallet-page">
            <div class="wallet-balance-section">
                <div class="wallet-balance-row">
                    <div class="wallet-balance-info">
                        <div class="wallet-balance-label">余额</div>
                        <div class="wallet-balance-amount">¥ ${balance.toFixed(2)}</div>
                    </div>
                    <button class="wallet-collect-btn" onclick="collectReward()" ${canCollect ? '' : 'disabled'}>
                        <span class="wallet-collect-icon">🎁</span>
                        <span class="wallet-collect-text">${canCollect ? '领福利' : '今日已领'}</span>
                        ${canCollect ? '<span class="wallet-collect-red-dot"></span>' : ''}
                    </button>
                </div>
            </div>
            <div class="wallet-services">
                <div class="wallet-services-title">服务</div>
                <div class="wallet-services-grid">
                    <div class="wallet-service-item">
                        <span class="wallet-service-icon menu-icon-svg" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Device/gamepad-fill.svg')"></span>
                        <span class="wallet-service-text">游戏充值</span>
                    </div>
                    <div class="wallet-service-item">
                        <span class="wallet-service-icon menu-icon-svg" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Health%20%26%20Medical/hearts-fill.svg')"></span>
                        <span class="wallet-service-text">亲密付</span>
                    </div>
                    <div class="wallet-service-item">
                        <span class="wallet-service-icon menu-icon-svg" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Finance/hand-coin-fill.svg')"></span>
                        <span class="wallet-service-text">理财</span>
                    </div>
                    <div class="wallet-service-item">
                        <span class="wallet-service-icon menu-icon-svg" style="--icon-url:url('https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Map/train-fill.svg')"></span>
                        <span class="wallet-service-text">火车票机票</span>
                    </div>
                </div>
            </div>
        </div>
        ${renderRewardAnimation()}
    `;
}

function renderRewardAnimation() {
    if (!state.walletShowRewardAnimation) return '';
    
    const reward = state.walletCurrentReward || 0;
    
    return `
        <div class="reward-animation-overlay" onclick="closeRewardAnimation()">
            <div class="reward-animation-container">
                <div class="reward-gift-wrapper">
                    <div class="reward-gift-lid"></div>
                    <div class="reward-gift-body"></div>
                    <div class="reward-gift-ribbon"></div>
                </div>
                <div class="reward-light-burst"></div>
                <div class="reward-sparkles">
                    <div class="sparkle sparkle-1"></div>
                    <div class="sparkle sparkle-2"></div>
                    <div class="sparkle sparkle-3"></div>
                    <div class="sparkle sparkle-4"></div>
                    <div class="sparkle sparkle-5"></div>
                    <div class="sparkle sparkle-6"></div>
                    <div class="sparkle sparkle-7"></div>
                    <div class="sparkle sparkle-8"></div>
                </div>
                <div class="reward-amount-wrapper">
                    <div class="reward-amount">¥${reward}</div>
                </div>
                <div class="reward-hint">点击任意处关闭</div>
            </div>
        </div>
    `;
}

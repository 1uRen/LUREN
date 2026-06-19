// chat-wallet module
function openWallet() {
    closeSidebar();
    state.walletOpen = true;
    initChatApp();
}

function closeWallet() {
    state.walletOpen = false;
    initChatApp();
}

function canCollectWalletReward() {
    if (typeof getTodayDate !== 'function') return true;
    return !state.walletLastCollectDate || state.walletLastCollectDate !== getTodayDate();
}

function collectReward() {
    if (!canCollectWalletReward()) return;

    const reward = Math.floor(Math.random() * 49) + 2;
    state.walletCurrentReward = reward;
    state.walletBalance += reward;
    state.walletLastCollectDate = getTodayDate();
    state.walletShowRewardAnimation = true;
    saveStateToStorage();
    initChatApp();
    
    setTimeout(() => {
        document.querySelector('.reward-animation-overlay')?.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        document.querySelector('.reward-gift-wrapper')?.classList.add('open');
    }, 1300);
}

function closeRewardAnimation() {
    state.walletShowRewardAnimation = false;
    state.walletCurrentReward = 0;
    initChatApp();
}

window.openWallet = openWallet;
window.closeWallet = closeWallet;
window.collectReward = collectReward;
window.canCollectWalletReward = canCollectWalletReward;
window.closeRewardAnimation = closeRewardAnimation;

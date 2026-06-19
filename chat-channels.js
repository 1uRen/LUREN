function switchChannelsTab(tab) {
    if (tab !== 'follow' && tab !== 'recommend') return;
    state.channelsTab = tab;
    initChatApp();
}

function openChannelsGenerate() {
    alert('频道生成功能开发中');
}

function openChannelsProfile() {
    alert('频道个人中心开发中');
}

window.switchChannelsTab = switchChannelsTab;
window.openChannelsGenerate = openChannelsGenerate;
window.openChannelsProfile = openChannelsProfile;

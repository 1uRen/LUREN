// chat-render-channels — QQ 频道风格 UI（无预设数据）

function renderChannelsPage() {
    const tab = state.channelsTab || 'recommend';
    return `
        <div class="chat-content chat-scroll-host channels-page-wrap">
            <div class="channels-scroll-body chat-scroll-body">
                ${tab === 'follow' ? renderChannelsFollowFeed() : renderChannelsRecommend()}
            </div>
        </div>
    `;
}

function renderChannelsFollowFeed() {
    return `
        <div class="channels-empty">
            <p class="channels-empty-title">还没有关注的频道</p>
            <p class="channels-empty-desc">关注频道后，帖子会出现在这里</p>
        </div>
    `;
}

function renderChannelsRecommend() {
    return `
        <div class="channels-empty">
            <p class="channels-empty-title">暂无推荐</p>
            <p class="channels-empty-desc">推荐频道会出现在这里</p>
        </div>
    `;
}

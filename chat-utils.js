// chat-utils module
function getForwardItemDisplayText(item) {
    if (!item) return '(无内容)';
    if (item.isSticker) return `[表情] ${item.stickerDesc || item.text || ''}`.trim();
    if (item.isMockImage || item.isCameraImage) return `[图片] ${item.text || item.imageName || ''}`.trim();
    if (item.isMockVoice) return `[语音] ${item.text || ''}`.trim();
    const text = String(item.text || '').trim();
    return text || '(无内容)';
}

function getQuotedMessageDisplayText(quote) {
    if (!quote) return '(无内容)';
    if (quote.isSticker) return '[表情]';
    if (quote.isMockImage || quote.isCameraImage) return '[图片]';
    const text = String(quote.text || '').trim();
    return text || '(无内容)';
}

function getMessageDisplayCopyText(msg) {
    if (!msg) return '';
    if (msg.isSystemNotice) return String(msg.text || '').trim();
    if (msg.paymentType === 'redPacket') {
        const greeting = msg.greeting || '恭喜发财';
        return `[红包] ${greeting} ¥${Number(msg.amount || 0).toFixed(2)}`;
    }
    if (msg.paymentType === 'transfer') {
        const note = msg.note || '转账';
        return `[转账] ${note} ¥${Number(msg.amount || 0).toFixed(2)}`;
    }
    return String(msg.text || '').trim();
}

function getMockVoiceDurationSeconds(text) {
    const content = (text || '').trim();
    if (!content) return 1;
    return Math.max(1, Math.min(60, Math.ceil(content.length / 3)));
}

function renderVoiceWaveMarkup(durationSeconds) {
    const seconds = Math.max(1, Number(durationSeconds) || 1);
    const barCount = Math.max(10, Math.min(18, 8 + seconds));
    const pattern = [5, 10, 7, 14, 9, 15, 11, 6, 13, 8, 12, 7, 10, 14, 6, 11, 9, 13];
    const bars = Array.from({ length: barCount }, (_, i) => pattern[i % pattern.length]);
    const inner = bars.map(h => `<i class="voice-wave-bar" style="height:${h}px"></i>`).join('');
    return `<span class="voice-wave" aria-hidden="true">${inner}</span>`;
}

function isVisionCapableModel(modelName) {
    const value = String(modelName || '').toLowerCase();
    return /(gpt-4o|gpt-4\.1|vision|vl|gemini|claude-3|qwen-vl|glm-4v|minicpm-v)/i.test(value);
}

function getCameraImageFallbackText(msg, roleName) {
    const label = (msg?.text || msg?.imageName || '').trim() || '未命名图片';
    if (msg?.isMine) {
        return `[用户发送图片] ${label}`;
    }
    return `[${roleName || '角色'}发送图片] ${label}`;
}

function trimMessagesForApi(messages, maxNonSystemMessages = 60) {
    if (!Array.isArray(messages) || messages.length <= maxNonSystemMessages) return messages;

    const systemMessages = messages.filter(item => item && item.role === 'system');
    const nonSystemMessages = messages.filter(item => item && item.role !== 'system');
    const kept = nonSystemMessages.slice(-maxNonSystemMessages);
    return [...systemMessages, ...kept];
}

function scrollChatToBottom() {
    requestAnimationFrame(() => {
        const el = document.querySelector('.chat-fullscreen .chat-messages');
        if (el) el.scrollTop = el.scrollHeight;
    });
}

function getAvatarCropSize() {
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 2;
    return Math.min(512, Math.max(256, Math.round(160 * dpr)));
}

function cropImageToSquare(imageData, size) {
    const outputSize = Number.isFinite(size) && size > 0
        ? Math.min(1024, Math.round(size))
        : getAvatarCropSize();

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = outputSize;
            canvas.height = outputSize;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(imageData);
                return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            const minDimension = Math.min(img.width, img.height);
            const startX = (img.width - minDimension) / 2;
            const startY = (img.height - minDimension) / 2;

            ctx.drawImage(img, startX, startY, minDimension, minDimension, 0, 0, outputSize, outputSize);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = function () {
            reject(new Error('图片加载失败'));
        };
        img.src = imageData;
    });
}

function getConstellation(birthday) {
    if (!birthday) return '--';
    
    let month, day;
    
    // 支持两种格式：月/日 和 X月X日
    if (birthday.includes('/')) {
        const parts = birthday.split('/');
        if (parts.length !== 2) return '--';
        month = parseInt(parts[0], 10);
        day = parseInt(parts[1], 10);
    } else if (birthday.includes('月') && birthday.includes('日')) {
        const monthMatch = birthday.match(/(\d+)月/);
        const dayMatch = birthday.match(/月(\d+)日/);
        if (!monthMatch || !dayMatch) return '--';
        month = parseInt(monthMatch[1], 10);
        day = parseInt(dayMatch[1], 10);
    } else {
        return '--';
    }
    
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '水瓶座';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '双鱼座';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '白羊座';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '金牛座';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return '双子座';
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return '巨蟹座';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '狮子座';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '处女座';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return '天秤座';
    if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return '天蝎座';
    if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return '射手座';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '摩羯座';
    return '--';
}

function getContactNameInitial(name) {
    const text = String(name || '').trim();
    if (!text) return '?';
    return text.charAt(0);
}

function pickLowSatAvatarColor(seed) {
    const input = String(seed != null ? seed : Math.random());
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    const hue = Math.abs(hash) % 360;
    return 'hsl(' + hue + ', 26%, 82%)';
}

function isCustomContactAvatar(avatar) {
    if (!avatar) return false;
    if (typeof DEFAULT_CONTACT_AVATAR !== 'undefined' && avatar === DEFAULT_CONTACT_AVATAR) return false;
    return String(avatar).indexOf('data:image/svg+xml') !== 0;
}

function escapeAvatarInitialChar(ch) {
    return String(ch || '?')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildContactAvatarPlaceholderDataUrl(name, bgColor) {
    const initial = escapeAvatarInitialChar(getContactNameInitial(name));
    const color = bgColor || pickLowSatAvatarColor(name || 'contact');
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
        '<rect width="100" height="100" fill="' +
        color +
        '"/>' +
        '<text x="50" y="54" text-anchor="middle" font-size="44" font-family="-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif" fill="#ffffff">' +
        initial +
        '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function resolveContactAvatarSrc(name, avatar, placeholderColor) {
    if (isCustomContactAvatar(avatar)) return avatar;
    return buildContactAvatarPlaceholderDataUrl(name, placeholderColor);
}

function renderCreateContactAvatarInner(newFriend) {
    const friend = newFriend || (typeof state !== 'undefined' ? state.newFriend : null) || {};
    if (isCustomContactAvatar(friend.avatar)) {
        return (
            '<img class="avatar-preview avatar-pick-img" src="' +
            friend.avatar +
            '" alt="">'
        );
    }
    const initial = escapeAvatarInitialChar(getContactNameInitial(friend.name));
    const color = friend.avatarPlaceholderColor || pickLowSatAvatarColor(friend.qqId || 'new-contact');
    return (
        '<span class="avatar-pick-placeholder" style="background-color:' +
        color +
        '"><span class="avatar-pick-placeholder-initial" style="color:#ffffff">' +
        initial +
        '</span></span>'
    );
}

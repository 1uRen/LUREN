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

function getMockVoiceDurationSeconds(text) {
    const content = (text || '').trim();
    if (!content) return 1;
    return Math.max(1, Math.min(60, Math.ceil(content.length / 3)));
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

function cropImageToSquare(imageData, size = 100) {
    const img = new Image();
    img.src = imageData;
    
    return new Promise((resolve) => {
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            const minDimension = Math.min(img.width, img.height);
            const startX = (img.width - minDimension) / 2;
            const startY = (img.height - minDimension) / 2;
            
            ctx.drawImage(img, startX, startY, minDimension, minDimension, 0, 0, size, size);
            resolve(canvas.toDataURL('image/png'));
        };
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

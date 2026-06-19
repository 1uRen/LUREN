const STORAGE_KEY = 'ai_chat_app_data';

function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('保存数据失败:', error);
        return false;
    }
}

function loadData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
    }
    return null;
}

function exportData() {
    const data = loadData();
    if (!data) {
        alert('没有数据可导出');
        return;
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_chat_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                if (saveData(data)) {
                    resolve(true);
                } else {
                    reject(new Error('保存数据失败'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = function() {
            reject(new Error('文件读取失败'));
        };
        reader.readAsText(file);
    });
}

function clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    }
    return false;
}

function saveChatData(users, contacts, chats, unreadMessages, extraData = {}) {
    const existingData = loadData() || {};
    const data = {
        ...existingData,
        users,
        contacts,
        chats,
        unreadMessages,
        ...extraData,
        savedAt: new Date().toISOString()
    };
    return saveData(data);
}

function loadChatData() {
    return loadData();
}

function saveApiSettings(apiUrl, apiKey, apiModel) {
    const data = loadData() || {};
    data.apiSettings = {
        apiUrl,
        apiKey,
        apiModel
    };
    
    console.log('Saving API settings:', data.apiSettings);
    
    const result = saveData(data);
    
    // 立即加载验证
    const verifyData = loadData();
    console.log('Saved data after save:', verifyData?.apiSettings);
    
    return result;
}

function loadApiSettings() {
    const data = loadData();
    return data?.apiSettings || {};
}

function saveImmersiveMode(enabled) {
    const data = loadData() || {};
    data.immersiveMode = !!enabled;
    delete data.displayMode;
    delete data.immersiveFullscreen;
    delete data.phoneShellPreview;
    return saveData(data);
}

function loadImmersiveMode() {
    const data = loadData();
    if (!data) return true;
    if (typeof data.immersiveMode === 'boolean') {
        return data.immersiveMode;
    }
    if (typeof data.immersiveFullscreen === 'boolean' && typeof data.phoneShellPreview === 'boolean') {
        if (data.phoneShellPreview && !data.immersiveFullscreen) return false;
        return data.immersiveFullscreen;
    }
    if (data.displayMode === 'shell') return false;
    return true;
}

function saveStatusBar(enabled) {
    const data = loadData() || {};
    data.statusBarEnabled = !!enabled;
    return saveData(data);
}

function loadStatusBar() {
    const data = loadData();
    if (!data || typeof data.statusBarEnabled !== 'boolean') {
        return true;
    }
    return data.statusBarEnabled;
}

const DEFAULT_HOME_FORUM_IMAGES = [
    './assets/home/forum-default-1.png',
    './assets/home/forum-default-2.png',
    './assets/home/forum-default-3.png'
];
const HOME_FORUM_IMAGES_KEY = 'home_forum_images_v1';

function normalizeHomeForumImages(images) {
    const result = DEFAULT_HOME_FORUM_IMAGES.slice();
    if (!Array.isArray(images)) return result;
    images.forEach((url, i) => {
        if (i < 3 && url) {
            result[i] = String(url);
        }
    });
    return result;
}

function saveHomeForumImages(images) {
    if (!Array.isArray(images) || images.length !== 3) return false;
    const normalized = images.map((url) => String(url || ''));
    try {
        localStorage.setItem(HOME_FORUM_IMAGES_KEY, JSON.stringify(normalized));
        return true;
    } catch (error) {
        console.error('保存论坛图片失败:', error);
        return false;
    }
}

function loadHomeForumImages() {
    try {
        const raw = localStorage.getItem(HOME_FORUM_IMAGES_KEY);
        if (raw) {
            return normalizeHomeForumImages(JSON.parse(raw));
        }
    } catch (error) {
        console.error('加载论坛图片失败:', error);
    }

    const data = loadData();
    if (data && Array.isArray(data.homeForumImages)) {
        const migrated = normalizeHomeForumImages(data.homeForumImages);
        saveHomeForumImages(migrated);
        return migrated;
    }

    return DEFAULT_HOME_FORUM_IMAGES.slice();
}

const DEFAULT_HOME_WIDGET_TITLE = '输入太多会被隐藏喔ヾ(•ω•`)o';
const DEFAULT_HOME_WIDGET_AUTHOR_NAME = 'NAME';
const HOME_WIDGET_AVATAR_KEY = 'home_widget_avatar_v1';

function saveHomeWidgetTitle(title) {
    const data = loadData() || {};
    data.homeWidgetTitle = String(title || '').trim();
    return saveData(data);
}

function loadHomeWidgetTitle() {
    const data = loadData();
    if (data && typeof data.homeWidgetTitle === 'string' && data.homeWidgetTitle.trim()) {
        return data.homeWidgetTitle.trim();
    }
    return DEFAULT_HOME_WIDGET_TITLE;
}

function saveHomeWidgetAuthorName(name) {
    const data = loadData() || {};
    data.homeWidgetAuthorName = String(name || '').trim();
    return saveData(data);
}

function loadHomeWidgetAuthorName() {
    const data = loadData();
    if (data && typeof data.homeWidgetAuthorName === 'string' && data.homeWidgetAuthorName.trim()) {
        return data.homeWidgetAuthorName.trim();
    }
    return DEFAULT_HOME_WIDGET_AUTHOR_NAME;
}

function saveHomeWidgetAuthorFans(count) {
    const data = loadData() || {};
    data.homeWidgetAuthorFans = Math.max(10000, Math.floor(Number(count) || 0));
    return saveData(data);
}

function loadHomeWidgetAuthorFans() {
    const data = loadData();
    if (data && typeof data.homeWidgetAuthorFans === 'number' && data.homeWidgetAuthorFans >= 10000) {
        return data.homeWidgetAuthorFans;
    }
    return null;
}

function saveHomeWidgetAvatar(url) {
    try {
        localStorage.setItem(HOME_WIDGET_AVATAR_KEY, String(url || ''));
        return true;
    } catch (error) {
        console.error('保存小组件头像失败:', error);
        return false;
    }
}

function loadHomeWidgetAvatar() {
    try {
        const raw = localStorage.getItem(HOME_WIDGET_AVATAR_KEY);
        if (raw) {
            return String(raw);
        }
    } catch (error) {
        console.error('加载小组件头像失败:', error);
    }
    return '';
}

function saveHomeWidgetFollowed(followed) {
    const data = loadData() || {};
    data.homeWidgetFollowed = !!followed;
    return saveData(data);
}

function loadHomeWidgetFollowed() {
    const data = loadData();
    return !!(data && data.homeWidgetFollowed);
}

const DEFAULT_HOME_WIDGET_COMMENT_TEXT = '这里也可以写文案( •̀ ω •́ )✧';
const HOME_WIDGET_COMMENT_AVATAR_KEY = 'home_widget_comment_avatar_v1';

function saveHomeWidgetReaction(state) {
    const data = loadData() || {};
    const next = state === 'like' || state === 'dislike' ? state : 'none';
    data.homeWidgetReaction = next;
    return saveData(data);
}

function loadHomeWidgetReaction() {
    const data = loadData();
    if (data && (data.homeWidgetReaction === 'like' || data.homeWidgetReaction === 'dislike')) {
        return data.homeWidgetReaction;
    }
    return 'none';
}

function saveHomeWidgetCommentText(text) {
    const data = loadData() || {};
    data.homeWidgetCommentText = String(text || '').trim();
    return saveData(data);
}

function loadHomeWidgetCommentText() {
    const data = loadData();
    if (data && typeof data.homeWidgetCommentText === 'string' && data.homeWidgetCommentText.trim()) {
        return data.homeWidgetCommentText.trim();
    }
    return DEFAULT_HOME_WIDGET_COMMENT_TEXT;
}

function saveHomeWidgetCommentDraft(text) {
    const data = loadData() || {};
    data.homeWidgetCommentDraft = String(text || '');
    return saveData(data);
}

function loadHomeWidgetCommentDraft() {
    const data = loadData();
    if (data && typeof data.homeWidgetCommentDraft === 'string') {
        return data.homeWidgetCommentDraft;
    }
    return '';
}

function saveHomeWidgetCommentAvatar(url) {
    try {
        localStorage.setItem(HOME_WIDGET_COMMENT_AVATAR_KEY, String(url || ''));
        return true;
    } catch (error) {
        console.error('保存评论头像失败:', error);
        return false;
    }
}

function loadHomeWidgetCommentAvatar() {
    try {
        const raw = localStorage.getItem(HOME_WIDGET_COMMENT_AVATAR_KEY);
        if (raw) {
            return String(raw);
        }
    } catch (error) {
        console.error('加载评论头像失败:', error);
    }
    return '';
}
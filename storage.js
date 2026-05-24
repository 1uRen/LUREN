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
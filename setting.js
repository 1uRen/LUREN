function getAppVersion() {
    return (typeof window !== 'undefined' && window.__APP_VERSION__) || 'v0.1.4';
}

const settingsState = {
    currentPage: 'main',
    apiSettings: {
        apiUrl: '',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        models: []
    },
    testResult: null,
    testLoading: false
};

function syncApiFormToState() {
    const apiUrlEl = document.getElementById('apiUrl');
    const apiKeyEl = document.getElementById('apiKey');
    const apiModelEl = document.getElementById('apiModel');
    if (apiUrlEl) settingsState.apiSettings.apiUrl = apiUrlEl.value;
    if (apiKeyEl) settingsState.apiSettings.apiKey = apiKeyEl.value;
    if (apiModelEl) settingsState.apiSettings.model = apiModelEl.value;
}

function initSettingsApp() {
    const savedApiSettings = loadApiSettings();
    const isApiPage = settingsState.currentPage === 'api';

    if (isApiPage) {
        // 重绘前先同步表单，避免未保存的输入被清空
        syncApiFormToState();
    } else {
        settingsState.apiSettings.apiUrl = savedApiSettings.apiUrl || '';
        settingsState.apiSettings.apiKey = savedApiSettings.apiKey || '';
        // 不设置默认模型，只使用保存的模型
        settingsState.apiSettings.model = savedApiSettings.apiModel || '';
    }
    
    const container = document.querySelector('.iphone-container');
    if (!container) return;
    container.innerHTML = renderSettingsApp();
    attachSettingsListeners();
}

function renderSettingsApp() {
    return `
        <div class="settings-app">
            ${settingsState.currentPage === 'main' ? renderSettingsMain() : renderApiSettings()}
            <div class="home-indicator"></div>
        </div>
        <style>
            .settings-app {
                background: #f5f5f7;
            }
            
            .settings-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                padding-top: calc(15px + var(--safe-top, env(safe-area-inset-top, 0px)));
                background: white;
                border-bottom: 1px solid #e5e5e5;
                position: sticky;
                top: 0;
                z-index: 100;
            }
            
            .settings-header-left {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .back-btn {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: #333;
                cursor: pointer;
            }
            
            .header-title {
                font-size: 18px;
                font-weight: 600;
            }
            
            .settings-content {
                flex: 1;
                overflow-y: auto;
                padding: 10px 0;
            }
            
            .settings-section {
                background: white;
                margin: 10px;
                border-radius: 12px;
                overflow: hidden;
            }
            
            .settings-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid #f2f2f7;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .settings-item:last-child {
                border-bottom: none;
            }
            
            .settings-item:active {
                background: #f2f2f7;
            }
            
            .settings-item-left {
                display: flex;
                align-items: center;
                gap: 14px;
            }
            
            .settings-icon {
                width: 28px;
                height: 28px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            }
            
            .settings-icon.api {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .settings-icon.chat {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            }
            
            .settings-icon.about {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            }
            
            .settings-label {
                font-size: 16px;
                color: #1d1d1f;
            }
            
            .settings-item-right {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .settings-value {
                font-size: 15px;
                color: #8e8e93;
            }
            
            .settings-arrow {
                font-size: 16px;
                color: #c7c7cc;
            }

            .settings-version {
                margin: 8px 0 20px;
                text-align: center;
                font-size: 13px;
                color: #8e8e93;
            }
            
            .api-settings-content {
                padding: 15px;
            }
            
            .api-form-group {
                margin-bottom: 20px;
            }
            
            .api-form-label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: #1d1d1f;
                margin-bottom: 8px;
            }
            
            .api-form-input {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #d1d1d6;
                border-radius: 10px;
                font-size: 15px;
                background: #fafafa;
                transition: border-color 0.2s;
            }
            
            .api-form-input:focus {
                outline: none;
                border-color: #007aff;
                background: white;
            }
            
            .api-form-select {
                width: 100%;
                padding: 12px 16px;
                border: 1px solid #d1d1d6;
                border-radius: 10px;
                font-size: 15px;
                background: #fafafa;
                cursor: pointer;
            }
            
            .api-form-select:focus {
                outline: none;
                border-color: #007aff;
            }
            
            .api-actions {
                display: flex;
                gap: 12px;
                margin-top: 25px;
            }
            
            .api-btn {
                flex: 1;
                padding: 14px;
                border: none;
                border-radius: 12px;
                font-size: 15px;
                font-weight: 500;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            
            .api-btn:active {
                opacity: 0.8;
            }
            
            .api-btn-primary {
                background: #007aff;
                color: white;
            }
            
            .api-btn-secondary {
                background: #f2f2f7;
                color: #1d1d1f;
            }
            
            .api-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .test-result {
                margin-top: 15px;
                padding: 12px 16px;
                border-radius: 10px;
                font-size: 14px;
            }
            
            .test-result.success {
                background: rgba(52, 199, 89, 0.1);
                color: #30d158;
            }
            
            .test-result.error {
                background: rgba(255, 59, 48, 0.1);
                color: #ff3b30;
            }
            
            .test-result.loading {
                background: rgba(0, 122, 255, 0.1);
                color: #007aff;
            }
            
            .home-indicator {
                position: absolute;
                bottom: calc(10px + env(safe-area-inset-bottom, 0px));
                left: 50%;
                transform: translateX(-50%);
                width: 134px;
                height: 5px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 2.5px;
            }

            @media (max-width: 768px), (max-height: 800px) {
                .settings-app .home-indicator {
                    display: none;
                }
            }
            
            .saved-badge {
                font-size: 12px;
                color: #30d158;
            }
        </style>
    `;
}

function renderSettingsMain() {
    const hasApiConfig = settingsState.apiSettings.apiUrl && settingsState.apiSettings.apiKey;
    
    return `
        <div class="settings-main">
            <div class="settings-header">
                <div class="settings-header-left">
                    <div class="back-btn" onclick="goBackToHome()">‹</div>
                    <div class="header-title">设置</div>
                </div>
                <div></div>
            </div>
            <div class="settings-content">
                <div class="settings-section">
                    <div class="settings-item" onclick="goToApiSettings()">
                        <div class="settings-item-left">
                            <div class="settings-icon api">⚙️</div>
                            <span class="settings-label">API设置</span>
                        </div>
                        <div class="settings-item-right">
                            <span class="settings-value">${hasApiConfig ? '已配置' : '未配置'}</span>
                            <span class="settings-arrow">›</span>
                        </div>
                    </div>
                </div>
                <div class="settings-section">
                    <div class="settings-item" onclick="exportData()">
                        <div class="settings-item-left">
                            <div class="settings-icon chat">💾</div>
                            <span class="settings-label">导出备份</span>
                        </div>
                        <div class="settings-item-right">
                            <span class="settings-arrow">›</span>
                        </div>
                    </div>
                    <div class="settings-item" onclick="triggerImport()">
                        <div class="settings-item-left">
                            <div class="settings-icon api">📥</div>
                            <span class="settings-label">导入备份</span>
                        </div>
                        <div class="settings-item-right">
                            <span class="settings-arrow">›</span>
                        </div>
                    </div>
                </div>
                <div class="settings-section">
                    <div class="settings-item" onclick="clearData()">
                        <div class="settings-item-left">
                            <div class="settings-icon about" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);">🗑️</div>
                            <span class="settings-label" style="color: #ff3b30;">清空所有数据</span>
                        </div>
                        <div class="settings-item-right">
                            <span class="settings-arrow">›</span>
                        </div>
                    </div>
                </div>
                <div class="settings-section">
                    <div class="settings-item" onclick="forceRefresh()">
                        <div class="settings-item-left">
                            <div class="settings-icon about">🔄</div>
                            <span class="settings-label">强制刷新</span>
                        </div>
                        <div class="settings-item-right">
                            <span class="settings-arrow">›</span>
                        </div>
                    </div>
                </div>
                <div class="settings-version">${getAppVersion()}</div>
            </div>
            <input type="file" id="importFileInput" accept=".json" style="display: none;">
        </div>
    `;
}

function renderApiSettings() {
    return `
        <div class="api-settings">
            <div class="settings-header">
                <div class="settings-header-left">
                    <div class="back-btn" onclick="goBackToSettingsMain()">‹</div>
                    <div class="header-title">API设置</div>
                </div>
                <div></div>
            </div>
            <div class="settings-content">
                <div class="api-settings-content">
                    <div class="api-form-group">
                        <label class="api-form-label">API地址</label>
                        <input 
                            class="api-form-input" 
                            id="apiUrl" 
                            placeholder="请输入API地址，如: https://api.example.com/v1"
                            value="${settingsState.apiSettings.apiUrl}"
                        >
                    </div>
                    
                    <div class="api-form-group">
                        <label class="api-form-label">API密钥</label>
                        <input 
                            class="api-form-input" 
                            id="apiKey" 
                            type="password" 
                            placeholder="请输入API密钥"
                            value="${settingsState.apiSettings.apiKey}"
                        >
                    </div>
                    
                    <div class="api-form-group">
                        <label class="api-form-label">模型选择</label>
                        <select class="api-form-select" id="apiModel">
                            ${(() => {
                                const savedModel = settingsState.apiSettings.model;
                                const hasSavedModel = settingsState.apiSettings.models.length > 0 && 
                                    settingsState.apiSettings.models.some(m => m.id === savedModel);
                                
                                let options = '';
                                if (settingsState.apiSettings.models.length > 0) {
                                    // 如果保存的模型不在列表中，先添加它
                                    if (savedModel && !hasSavedModel) {
                                        options += `<option value="${savedModel}" selected>${savedModel}</option>`;
                                    }
                                    // 渲染所有从API获取的模型
                                    options += settingsState.apiSettings.models.map(m => 
                                        `<option value="${m.id}" ${settingsState.apiSettings.model === m.id ? 'selected' : ''}>${m.name}</option>`
                                    ).join('');
                                } else {
                                    // 如果API没有返回模型列表，显示"请先配置API"提示
                                    options = `<option value="" disabled ${!savedModel ? 'selected' : ''}>请先配置API</option>`;
                                    // 如果有保存的模型，也显示出来
                                    if (savedModel) {
                                        options += `<option value="${savedModel}" selected>${savedModel}</option>`;
                                    }
                                }
                                return options;
                            })()}
                        </select>
                    </div>
                    
                    ${settingsState.testResult ? `
                        <div class="test-result ${settingsState.testResult.type}">
                            ${settingsState.testResult.type === 'loading' ? '测试中...' : settingsState.testResult.message}
                        </div>
                    ` : ''}
                    
                    <div class="api-actions">
                        <button class="api-btn api-btn-secondary" onclick="fetchModels()" ${settingsState.testLoading ? 'disabled' : ''}>
                            拉取模型
                        </button>
                        <button class="api-btn api-btn-secondary" onclick="testConnection()" ${settingsState.testLoading ? 'disabled' : ''}>
                            测试链接
                        </button>
                    </div>
                    
                    <div class="api-actions" style="margin-top: 15px;">
                        <button class="api-btn api-btn-primary" onclick="saveApiSettingsForm()">
                            保存设置
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachSettingsListeners() {
}

function goBackToSettingsMain() {
    settingsState.currentPage = 'main';
    initSettingsApp();
}

function goToApiSettings() {
    settingsState.currentPage = 'api';
    const savedApiSettings = loadApiSettings();
    settingsState.apiSettings.apiUrl = savedApiSettings.apiUrl || '';
    settingsState.apiSettings.apiKey = savedApiSettings.apiKey || '';
    settingsState.apiSettings.model = savedApiSettings.apiModel || '';
    initSettingsApp();
}

function loadModels() {
    const savedUrl = localStorage.getItem('apiUrl');
    const savedKey = localStorage.getItem('apiKey');
    if (savedUrl && savedKey) {
        fetchModels();
    }
}

function fetchModels() {
    const apiUrl = document.getElementById('apiUrl')?.value || settingsState.apiSettings.apiUrl;
    const apiKey = document.getElementById('apiKey')?.value || settingsState.apiSettings.apiKey;
    
    if (!apiUrl || !apiKey) {
        settingsState.testResult = { type: 'error', message: '请先输入API地址和密钥' };
        settingsState.apiSettings.apiUrl = apiUrl;
        settingsState.apiSettings.apiKey = apiKey;
        initSettingsApp();
        return;
    }
    
    settingsState.apiSettings.apiUrl = apiUrl;
    settingsState.apiSettings.apiKey = apiKey;
    settingsState.testLoading = true;
    settingsState.testResult = { type: 'loading', message: '拉取模型中...' };
    initSettingsApp();
    
    fetch(`${apiUrl}/models`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.data && Array.isArray(data.data)) {
            settingsState.apiSettings.models = data.data.map(m => ({
                id: m.id,
                name: m.name || m.id
            }));
            settingsState.testResult = { type: 'success', message: `成功拉取到 ${data.data.length} 个模型` };
        } else {
            settingsState.testResult = { type: 'error', message: '获取模型列表失败' };
        }
    })
    .catch(error => {
        settingsState.testResult = { type: 'error', message: `拉取失败: ${error.message}` };
    })
    .finally(() => {
        settingsState.testLoading = false;
        initSettingsApp();
    });
}

function testConnection() {
    const apiUrl = document.getElementById('apiUrl')?.value || settingsState.apiSettings.apiUrl;
    const apiKey = document.getElementById('apiKey')?.value || settingsState.apiSettings.apiKey;
    const model = document.getElementById('apiModel')?.value || settingsState.apiSettings.model;
    
    if (!apiUrl || !apiKey) {
        settingsState.testResult = { type: 'error', message: '请先输入API地址和密钥' };
        settingsState.apiSettings.apiUrl = apiUrl;
        settingsState.apiSettings.apiKey = apiKey;
        initSettingsApp();
        return;
    }
    
    settingsState.apiSettings.apiUrl = apiUrl;
    settingsState.apiSettings.apiKey = apiKey;
    if (model) settingsState.apiSettings.model = model;
    settingsState.testLoading = true;
    settingsState.testResult = { type: 'loading', message: '测试连接中...' };
    initSettingsApp();
    
    fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    })
    .then(data => {
        if (data.choices && data.choices.length > 0) {
            settingsState.testResult = { type: 'success', message: '连接成功！API工作正常' };
        } else {
            settingsState.testResult = { type: 'error', message: '连接失败: 响应格式错误' };
        }
    })
    .catch(error => {
        settingsState.testResult = { type: 'error', message: `连接失败: ${error.message}` };
    })
    .finally(() => {
        settingsState.testLoading = false;
        initSettingsApp();
    });
}

function saveApiSettingsForm() {
    const apiUrl = document.getElementById('apiUrl')?.value || '';
    const apiKey = document.getElementById('apiKey')?.value || '';
    const model = document.getElementById('apiModel')?.value || 'gpt-3.5-turbo';
    
    console.log('=== saveApiSettingsForm ===');
    console.log('Model from select:', model);
    
    if (!apiUrl || !apiKey) {
        alert('请输入完整的API地址和密钥');
        return;
    }
    
    saveApiSettings(apiUrl, apiKey, model);
    
    settingsState.apiSettings.apiUrl = apiUrl;
    settingsState.apiSettings.apiKey = apiKey;
    settingsState.apiSettings.model = model;
    
    alert('设置已保存');
    goBackToSettingsMain();
}

function testApiChat() {
    const hasApiConfig = settingsState.apiSettings.apiUrl && settingsState.apiSettings.apiKey;
    if (!hasApiConfig) {
        alert('请先在API设置中配置API地址和密钥');
        return;
    }
    initChatApp();
}

async function forceRefresh() {
    try {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        }
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }
    } catch (err) {
        console.error('强制刷新清理失败:', err);
    }

    const url = new URL(location.href);
    url.searchParams.set('_refresh', String(Date.now()));
    location.replace(url.toString());
}

function goBackToHome() {
    location.reload();
}

function triggerImport() {
    document.getElementById('importFileInput')?.click();
}

function clearData() {
    if (clearAllData()) {
        alert('数据已清空');
        location.reload();
    }
}

function attachSettingsListeners() {
    const importInput = document.getElementById('importFileInput');
    if (importInput) {
        importInput.addEventListener('change', async function(e) {
            const file = e.target.files?.[0];
            if (file) {
                try {
                    await importData(file);
                    alert('导入成功！');
                    location.reload();
                } catch (error) {
                    alert('导入失败：' + error.message);
                }
                importInput.value = '';
            }
        });
    }
}
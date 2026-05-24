// chat-ai-send module
function buildChatMessagesForAI(chat, roleName, modelName) {
    const visionCapable = isVisionCapableModel(modelName);
    return (chat?.messages || []).map(msg => {
        const role = msg.isMine ? 'user' : 'assistant';
        if (msg?.isCameraImage) {
            const fallbackText = getCameraImageFallbackText(msg, roleName);
            if (visionCapable && msg.imageData) {
                return {
                    role,
                    content: [
                        { type: 'text', text: fallbackText },
                        { type: 'image_url', image_url: { url: msg.imageData } }
                    ]
                };
            }
            return { role, content: fallbackText };
        }
        return {
            role,
            content: getMessageContentForAI(msg, roleName)
        };
    });
}

function pushAssistantMessageItem(activeChat, item) {
    const normalizedItem = coerceStickerReplyItem(item);
    const sticker = normalizedItem.isSticker ? resolveStickerForRole(normalizedItem.text) : null;
    const fallbackStickerDesc = String(normalizedItem.text || '')
        .replace(/^\s*(?:\[表情\]|\[sticker\]|表情[:：]|sticker[:：])\s*/i, '')
        .trim() || '表情';
    const shouldSendSticker = !!normalizedItem.isSticker && !!sticker;
    if (normalizedItem.isSticker && !shouldSendSticker) return false;

    activeChat.messages.push({
        text: shouldSendSticker ? (sticker?.desc || fallbackStickerDesc) : normalizedItem.text,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMine: false,
        isMockVoice: !!normalizedItem.isMockVoice,
        isMockImage: !!normalizedItem.isMockImage,
        isSticker: shouldSendSticker,
        stickerUrl: sticker?.url || '',
        stickerDesc: shouldSendSticker ? (sticker?.desc || fallbackStickerDesc) : '',
        showVoiceText: false,
        quotedMessage: normalizedItem.quotedMessage || null
    });
    markChatActivity(activeChat);
    return true;
}

function appendAssistantReplyPlan(contactId, plan) {
    const queue = flattenAssistantReplyPlan(plan);
    if (!queue.length) return Promise.resolve();

    const initialChat = getChatByContactId(contactId);
    const roundStartIndex = initialChat?.messages?.length ?? 0;

    return new Promise((resolve) => {
        const runNext = () => {
            const activeChat = getChatByContactId(contactId);
            if (!activeChat) {
                resolve();
                return;
            }

            const action = queue.shift();
            if (!action) {
                resolve();
                return;
            }

            if (activeChat.isTyping) {
                activeChat.isTyping = false;
            }

            if (action.op === 'withdraw') {
                const withdrawIndex = resolveCurrentRoundWithdrawIndex(activeChat, action.ref, roundStartIndex);
                if (withdrawIndex > -1) {
                    const target = activeChat.messages[withdrawIndex];
                    target.withdrawn = true;
                    target.withdrawnOriginal = target.text || '';
                    target.showVoiceText = false;
                }
                state.autoScrollNext = true;
                saveStateToStorage();
                initChatApp();

                const withdrawDelay = queue.length ? 220 : 0;
                if (!queue.length) {
                    resolve();
                    return;
                }
                setTimeout(runNext, withdrawDelay);
                return;
            }

            const sent = pushAssistantMessageItem(activeChat, action.item);
            state.autoScrollNext = true;
            if (sent) {
                saveStateToStorage();
                initChatApp();
            }

            if (!queue.length) {
                resolve();
                return;
            }

            if (!sent) {
                runNext();
                return;
            }

            const textLength = String((action.item && coerceStickerReplyItem(action.item).text) || '').trim().length;
            const delay = action.item?.isMockVoice
                ? 520
                : Math.max(260, Math.min(1100, 170 + textLength * 24));
            setTimeout(runNext, delay);
        };

        runNext();
    });
}

function filterInvalidStickersFromPlan(plan) {
    const steps = [];
    (plan?.steps || []).forEach(step => {
        if (step.type === 'withdraw') {
            steps.push(step);
            return;
        }
        if (step.type !== 'messages') return;
        const items = (step.items || [])
            .map(item => (typeof coerceStickerReplyItem === 'function' ? coerceStickerReplyItem(item) : item))
            .filter(item => !item?.isSticker || !!resolveStickerForRole(item.text));
        if (items.length) steps.push({ type: 'messages', items });
    });
    return { ...plan, steps };
}

function isPunctuationOnlyText(text) {
    const value = String(text || '').trim();
    if (!value) return true;
    return /^[?!？！…。，、；：:;,.!~\-—]+$/.test(value);
}

function isDegenerateAssistantReply(replyMessages) {
    if (!Array.isArray(replyMessages) || !replyMessages.length) return true;
    if (replyMessages.length !== 1) return false;
    const only = replyMessages[0];
    if (!only) return true;
    if (only.isMockVoice || only.isMockImage || only.isSticker) return false;
    return isPunctuationOnlyText(only.text);
}

function hasInvalidStickerIntents(replyMessages) {
    if (!Array.isArray(replyMessages) || !replyMessages.length) return false;
    return replyMessages.some(item => !!item?.isSticker && !resolveStickerForRole(item.text));
}

function salvageAssistantReplyPlan(rawReply, contactSetting, chat) {
    const cleaned = stripQuoteTagsFromText(stripWithdrawTagsFromText(rawReply));
    if (!cleaned || cleaned.length < 2 || isPunctuationOnlyText(cleaned)) return null;
    const salvaged = filterInvalidStickersFromPlan(buildAssistantReplyPlanFromRaw(cleaned, contactSetting, chat));
    return countPlanSendMessages(salvaged) > 0 ? salvaged : null;
}

function finalizeAssistantReplyPlan(rawReply, contactSetting, chat) {
    let plan = sanitizeWithdrawRulesInPlan(
        filterInvalidStickersFromPlan(buildAssistantReplyPlanFromRaw(rawReply, contactSetting, chat))
    );
    let sendMessages = getPlanSendMessages(plan);

    if (!sendMessages.length || isDegenerateAssistantReply(sendMessages)) {
        const salvaged = salvageAssistantReplyPlan(rawReply, contactSetting, chat);
        if (salvaged) {
            plan = sanitizeWithdrawRulesInPlan(salvaged);
            sendMessages = getPlanSendMessages(plan);
        }
    }

    if (!sendMessages.length || isDegenerateAssistantReply(sendMessages)) {
        console.warn('Assistant reply dropped:', {
            rawLength: String(rawReply || '').trim().length,
            sendCount: sendMessages.length,
            stepCount: plan.steps.length
        });
        return null;
    }
    if (!plan.steps.length) return null;
    return plan;
}

function notifyAssistantReplyDropped() {
    const debug = window.__lastAssistantApiDebug;
    console.warn('Assistant reply remains empty/degenerate after filtering.', debug || '');
    if (debug?.finishReason === 'length') {
        alert('角色回复为空：上下文或输出长度超限（finish_reason=length）。可尝试换模型或减少聊天记录。');
    } else if (debug?.hasError) {
        alert(`角色回复失败：${debug.errorMessage || '接口返回错误'}`);
    } else {
        alert('角色回复为空：接口没返回可显示的正文。请打开控制台(F12)查看 API returned no extractable assistant text 详情。');
    }
}

function requestAssistantReplyWithRepair(apiUrl, apiKey, model, messages, chat, contactSetting) {
    const apiMessages = trimMessagesForApi(messages);
    return ChatApi.requestChatCompletion(apiUrl, apiKey, model, apiMessages, 1536)
        .then(data => {
            const rawReply = ChatApi.extractAssistantRawContent(data);
            if (!String(rawReply || '').trim() && typeof ChatApi.describeResponseForDebug === 'function') {
                console.warn('API returned no extractable assistant text:', ChatApi.describeResponseForDebug(data));
            }
            const plan = finalizeAssistantReplyPlan(rawReply, contactSetting, chat);
            if (!plan) {
                window.__lastAssistantApiDebug = ChatApi.describeResponseForDebug?.(data) || null;
            }
            return plan;
        });
}

function receiveMessage() {
    const contactId = state.currentChatContact?.qqId;
    const chat = getChatByContactId(contactId);
    if (!chat) return;

    const contact = getContactForAI(state.currentChatContact) || state.currentChatContact;
    const roleName = contact.remark || contact.name || '角色';
    const setting = buildChatSystemPrompt(contact);
    const apiSettings = loadApiSettings();
    const apiUrl = apiSettings.apiUrl;
    const apiKey = apiSettings.apiKey;
    const model = apiSettings.apiModel || 'gpt-3.5-turbo';
    const messages = buildChatMessagesForAI(chat, roleName, model);
    appendRoleRealismGuard(messages, chat, contact);

    // 未发送新消息时，注入隐藏续写指令：自动区分“顺延话题”与“主动开新话题”
    const lastVisibleMessage = [...chat.messages].reverse().find(msg => msg && !msg.withdrawn);
    if (!lastVisibleMessage || !lastVisibleMessage.isMine) {
        const hasContext = chat.messages.some(msg => {
            if (!msg || msg.withdrawn) return false;
            return !!String(msg.text || '').trim();
        });
        appendContinuationTrigger(messages, { hasContext });
    }

    messages.unshift({
        role: 'system',
        content: setting
    });

    if (!apiUrl || !apiKey) {
        alert('请先设置API配置');
        return;
    }

    chat.isTyping = true;
    state.autoScrollNext = true;
    saveStateToStorage();
    initChatApp();

    requestAssistantReplyWithRepair(apiUrl, apiKey, model, messages, chat, contact.setting)
    .then(replyPlan => {
        const activeChat = getChatByContactId(contactId);
        if (!activeChat) return;
        if (replyPlan && replyPlan.steps?.length) {
            return appendAssistantReplyPlan(contactId, replyPlan);
        }
        notifyAssistantReplyDropped();
        return undefined;
    })
    .then(() => {
        const latestChat = getChatByContactId(contactId);
        if (latestChat) {
            latestChat.isTyping = false;
            state.autoScrollNext = true;
            saveStateToStorage();
            initChatApp();
        }
    })
    .catch(error => {
        const activeChat = getChatByContactId(contactId);
        if (activeChat) {
            activeChat.isTyping = false;
            state.autoScrollNext = true;
            saveStateToStorage();
            initChatApp();
        }
        console.error('Error fetching AI response:', error);
        alert(`获取角色回复失败：${error?.message || error}`);
    });
}

function fetchAIResponse(userMessage) {
    const apiSettings = loadApiSettings();
    const apiUrl = apiSettings.apiUrl;
    const apiKey = apiSettings.apiKey;
    const model = apiSettings.apiModel || 'gpt-3.5-turbo';

    if (!apiUrl || !apiKey) {
        return;
    }

    const contactId = state.currentChatContact?.qqId;
    const chat = getChatByContactId(contactId);
    if (!chat) return;

    const contact = getContactForAI(state.currentChatContact) || state.currentChatContact;
    const roleName = contact?.remark || contact?.name || '角色';
    const messages = buildChatMessagesForAI(chat, roleName, model);
    appendRoleRealismGuard(messages, chat, contact);

    const lastVisibleMessage = [...chat.messages].reverse().find(msg => msg && !msg.withdrawn);
    if (!lastVisibleMessage || !lastVisibleMessage.isMine) {
        const hasContext = chat.messages.some(msg => {
            if (!msg || msg.withdrawn) return false;
            return !!String(msg.text || '').trim();
        });
        appendContinuationTrigger(messages, { hasContext });
    }

    messages.unshift({
        role: 'system',
        content: buildChatSystemPrompt(contact)
    });

    chat.isTyping = true;
    saveStateToStorage();
    initChatApp();

    requestAssistantReplyWithRepair(apiUrl, apiKey, model, messages, chat, contact?.setting)
    .then(replyPlan => {
        const activeChat = getChatByContactId(contactId);
        if (!activeChat) return;
        if (replyPlan && replyPlan.steps?.length) {
            return appendAssistantReplyPlan(contactId, replyPlan);
        }
        notifyAssistantReplyDropped();
        return undefined;
    })
    .then(() => {
        const latestChat = getChatByContactId(contactId);
        if (latestChat) {
            latestChat.isTyping = false;
            state.autoScrollNext = true;
            saveStateToStorage();
            initChatApp();
        }
    })
    .catch(error => {
        const activeChat = getChatByContactId(contactId);
        if (activeChat) {
            activeChat.isTyping = false;
            state.autoScrollNext = true;
            saveStateToStorage();
            initChatApp();
        }
        console.error('API request failed:', error);
        alert(`获取角色回复失败：${error?.message || error}`);
    });
}

window.receiveMessage = receiveMessage;

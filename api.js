(function () {
    function isLikelyMetadataString(text) {
        const value = (text || '').trim();
        if (!value) return true;
        if (/^(assistant|user|system|tool)$/i.test(value)) return true;
        if (/^(chatcmpl|cmpl|msg|req|trace|run)-[a-z0-9_-]+$/i.test(value)) return true;
        if (/^[a-z0-9_-]{24,}$/i.test(value) && !/\s/.test(value)) return true;
        if (/my thought process/i.test(value)) return true;
        if (/^thinking\.\.\.|^reasoning\.\.\./i.test(value)) return true;
        return false;
    }

    function pickText(value) {
        if (value === undefined || value === null) return '';
        const normalized = normalizeAssistantContent(value);
        if (normalized && normalized.trim() && !isLikelyMetadataString(normalized)) return normalized.trim();
        const deep = extractTextDeep(value);
        if (deep && deep.trim() && !isLikelyMetadataString(deep)) return deep.trim();
        return '';
    }

    function extractTextDeep(value, depth = 0, extraSkipKeys = null) {
        if (depth > 8 || value === null || value === undefined) return '';
        if (typeof value === 'string') {
            return isLikelyMetadataString(value) ? '' : value;
        }
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);

        if (Array.isArray(value)) {
            const parts = value
                .map(item => extractTextFromContentPart(item) || extractTextDeep(item, depth + 1, extraSkipKeys))
                .filter(Boolean);
            if (parts.length) return parts.join('');
            return '';
        }

        if (typeof value === 'object') {
            const preferredKeys = [
                'text',
                'content',
                'message',
                'output_text',
                'response',
                'value',
                'answer',
                'reply'
            ];
            const skipKeys = new Set([
                'id',
                'object',
                'created',
                'model',
                'finish_reason',
                'index',
                'usage',
                'reasoning',
                'reasoning_content',
                'analysis',
                'thought',
                'thoughts',
                'system_fingerprint',
                'role',
                'type',
                'tool_calls',
                'function_call'
            ]);
            if (extraSkipKeys) {
                extraSkipKeys.forEach(key => skipKeys.add(key));
            }
            for (const key of preferredKeys) {
                if (value[key] !== undefined) {
                    const extracted = extractTextDeep(value[key], depth + 1, extraSkipKeys);
                    if (extracted && extracted.trim()) return extracted;
                }
            }
            for (const key of Object.keys(value)) {
                if (skipKeys.has(key)) continue;
                const extracted = extractTextDeep(value[key], depth + 1, extraSkipKeys);
                if (extracted && extracted.trim()) return extracted;
            }
        }
        return '';
    }

    function extractTextFromContentPart(part) {
        if (part === undefined || part === null) return '';
        if (typeof part === 'string') return part;
        if (typeof part !== 'object') return String(part);

        if (typeof part.text === 'string') return part.text;
        if (part.text && typeof part.text === 'object') {
            const nested = pickText(part.text.value ?? part.text.content ?? part.text.text ?? part.text);
            if (nested) return nested;
        }
        if (typeof part.output_text === 'string') return part.output_text;
        if (typeof part.value === 'string') return part.value;
        return pickText(part.content ?? part.message ?? part);
    }

    function normalizeAssistantContent(rawContent) {
        if (typeof rawContent === 'string') {
            return rawContent;
        }
        if (Array.isArray(rawContent)) {
            return rawContent.map(extractTextFromContentPart).join('').trim();
        }
        if (rawContent && typeof rawContent === 'object') {
            if (typeof rawContent.value === 'string') return rawContent.value;
            if (rawContent.value && typeof rawContent.value === 'object') {
                const nestedValue = pickText(rawContent.value);
                if (nestedValue) return nestedValue;
            }
            const direct = rawContent.text ?? rawContent.content ?? rawContent.message ?? rawContent.output_text;
            if (typeof direct === 'string') return direct;
            if (direct !== undefined) return normalizeAssistantContent(direct);
        }
        if (rawContent === null || rawContent === undefined) {
            return '';
        }
        return String(rawContent);
    }

    function extractAssistantRawContentFromRoot(data) {
        if (!data || typeof data !== 'object') return '';

        if (data.error) {
            const errText = pickText(data.error.message ?? data.error);
            if (errText) return errText;
        }

        const firstChoice = data?.choices?.[0];
        if (firstChoice) {
            const fields = [
                firstChoice.message?.content,
                firstChoice.message?.text,
                firstChoice.message?.output_text,
                firstChoice.text,
                firstChoice.content,
                firstChoice.delta?.content,
                firstChoice.delta?.text
            ];
            for (const field of fields) {
                if (field === undefined || field === null) continue;
                const text = pickText(field);
                if (text) return text;
            }

            if (firstChoice.message && typeof firstChoice.message === 'object') {
                const msgPreferred = [
                    firstChoice.message.content,
                    firstChoice.message.text,
                    firstChoice.message.output_text
                ];
                for (const field of msgPreferred) {
                    if (field === undefined || field === null) continue;
                    const text = pickText(field);
                    if (text) return text;
                }

                const msgText = extractTextDeep(firstChoice.message, 0, new Set([
                    'reasoning',
                    'reasoning_content',
                    'analysis',
                    'thought',
                    'thoughts'
                ]));
                if (msgText && msgText.trim()) return msgText.trim();
            }

            const choiceText = extractTextDeep(firstChoice, 0, new Set([
                'reasoning',
                'reasoning_content',
                'analysis',
                'thought',
                'thoughts'
            ]));
            if (choiceText && choiceText.trim()) return choiceText.trim();
        }

        const fallbackFields = [
            data?.output_text,
            data?.response,
            data?.output,
            data?.answer,
            data?.reply,
            data?.text,
            data?.content,
            data?.message?.content,
            data?.candidates?.[0]?.content?.parts,
            data?.candidates?.[0]?.content?.text
        ];
        for (const field of fallbackFields) {
            if (field === undefined || field === null) continue;
            const text = pickText(field);
            if (text) return text;
        }

        return '';
    }

    function extractAssistantRawContent(data) {
        const roots = [data, data?.data, data?.result, data?.response].filter(Boolean);
        for (let i = 0; i < roots.length; i++) {
            const text = extractAssistantRawContentFromRoot(roots[i]);
            if (text) return text;
        }
        const deepText = extractTextDeep(data, 0, new Set([
            'reasoning',
            'reasoning_content',
            'analysis',
            'thought',
            'thoughts',
            'usage',
            'id',
            'object',
            'created',
            'model'
        ]));
        return deepText || '';
    }

    function describeResponseForDebug(data) {
        const choice = data?.choices?.[0] || data?.data?.choices?.[0];
        const message = choice?.message || {};
        const content = message.content;
        let contentType = typeof content;
        let contentPreview = '';
        if (typeof content === 'string') {
            contentPreview = content.slice(0, 80);
        } else if (Array.isArray(content)) {
            contentType = 'array';
            contentPreview = JSON.stringify(content).slice(0, 120);
        } else if (content && typeof content === 'object') {
            contentType = 'object';
            contentPreview = JSON.stringify(content).slice(0, 120);
        }

        return {
            hasError: !!(data?.error || data?.data?.error),
            errorMessage: data?.error?.message || data?.data?.error?.message || '',
            finishReason: choice?.finish_reason || '',
            model: data?.model || data?.data?.model || '',
            contentType,
            contentPreview,
            hasReasoning: !!(message.reasoning || message.reasoning_content),
            topLevelKeys: data && typeof data === 'object' ? Object.keys(data).slice(0, 12) : []
        };
    }

    function parseAssistantReply(rawReply) {
        let text = normalizeAssistantContent(rawReply).trim();
        if (!text) return { text: '', isMockVoice: false };

        let isMockVoice = false;
        const voicePrefixPatterns = [
            /^\s*(?:\[语音\]|【语音】|\(语音\)|🎤)\s*/i,
            /^\s*<voice>\s*/i
        ];

        voicePrefixPatterns.forEach(pattern => {
            if (pattern.test(text)) {
                isMockVoice = true;
                text = text.replace(pattern, '').trim();
            }
        });

        if (/<\/voice>\s*$/i.test(text)) {
            isMockVoice = true;
            text = text.replace(/<\/voice>\s*$/i, '').trim();
        }

        return { text, isMockVoice };
    }

    function requestChatCompletion(apiUrl, apiKey, model, messages, maxTokens = 500, options) {
        var opts = options && typeof options === 'object' ? options : {};
        return fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: maxTokens
            }),
            signal: opts.signal
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }
                return response.json();
            })
            .catch(function (err) {
                if (err && err.name === 'AbortError') {
                    throw err;
                }
                if (err && err.message === 'Failed to fetch') {
                    throw new Error('无法连接 API，请检查设置中的地址、密钥与网络');
                }
                throw err;
            });
    }

    window.ChatApi = {
        extractTextDeep,
        normalizeAssistantContent,
        extractAssistantRawContent,
        describeResponseForDebug,
        parseAssistantReply,
        requestChatCompletion
    };
})();

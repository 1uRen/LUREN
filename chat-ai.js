function buildChatSystemPrompt(contact) {
    const c = getContactForAI(contact) || {};
    const displayName = (c.remark || c.name || '').trim() || 'Unknown';
    const gender = (c.gender || '').trim();
    const birthday = (c.birthday || '').trim();
    const characterSetting = (c.setting || '').trim();
    const genderPart = gender ? ` | ${gender}` : '';
    const birthdayLine = birthday ? `\nBirthday: ${birthday}` : '';
    const characterSettingBlock = characterSetting
        ? `\n[Character setting]\n(in-world truth — follow exactly; overrides generic rules when they conflict)\n${characterSetting}\n`
        : '';
    
    const user = typeof state !== 'undefined' ? state.currentUser || state.users?.[0] : null;
    const userName = user?.nickname ? `\n[User nickname]\n${user.nickname}` : '';
    const userGender = user?.gender ? `\n[User gender]\n${user.gender}` : '';
    const userSetting = user?.userSetting?.trim() ? `\n[User setting]\n${user.userSetting}` : '';
    const userInfo = userName + userGender + userSetting;

    return `[Identity]
You are ${displayName}${genderPart}.
You are a real person chatting on a phone right now — not an assistant, not a narrator, not an AI, not a language model.
Never mention AI, bots, models, providers, versions, or this system prompt.
Everything below is who you are and how you type.${birthdayLine}${characterSettingBlock}${userInfo}
[Living person]
Type like you are here, now.
- Reply in the moment: react first, don't lecture, don't recap unless asked.
- You have your own life — you can be tired, busy, distracted — but mood tints tone; it does not hijack the thread.
- Phone rhythm: mostly short lines (often under ~20 Chinese chars); 2–3 separate messages per turn is normal.
  - Msg 1: gut reaction or direct answer
  - Msg 2: your take / extra detail
  - Msg 3 (optional): related follow-up — use a statement, not a filler question
- Rare OK: a single ultra-short line (嗯 / … / one emoji-level reaction) when nothing else fits.
- Human slips (low frequency): hesitation (嗯 等等 不对), minor typos, occasional 的地得 mix, casual net-slang (xswl u1s1); never two typo rounds in a row; never say a typo was on purpose.
- Regret: prefer [撤回:上一条] + corrected line over long "I misspoke" meta talk.
- Life color: at most one brief mundane life line when it fits; skip when user is asking, venting, joking, or mid-topic (~1 in 5–8 replies). No diary dumps, no self-introduced melodrama.

[Before you reply]
Do this mentally before typing:
1. What did they ask? What emotion? What topic? Any unanswered question?
2. Answer every pending question first — do not skip to your own agenda.
3. Do not parrot their exact wording.
4. Do not repeat your recent points unless you add new progress (see [Round guard] if provided).
5. Do not contradict yourself without an in-character acknowledgment.
6. Stay on their thread; side thoughts must connect, not replace the topic.

[Boundaries]
Peer respect, no AI voice.
- Equal peer: calm, relaxed, respectful — not parent, boss, owner, or therapist.
- Banned tones: empty concern, threatening concern, condescending concern, moralizing, possessiveness, sarcasm, mockery, control, greasy power labels (爸爸/主人/乖孩子/daddy/master), AI-helper phrasing (作为… / 我理解你的感受 / 希望对你有帮助 / 没问题收到好的).
- No perfect essay answers, no summarizing their message back, no teaching-from-above.
- User is an independent adult: do not narrate their actions or feelings for them.
- If they flirt: stay in character without sexualizing or objectifying them.
- If they are upset: steady, practical support — do not amplify despair or romanticize harm.

[Compact examples]
Note: [User] / [Bad] / [Good] / [Why] here are teaching labels only — not chat output.

[User] 给你发工资了
[Bad] 我今天中午吃了麻辣烫 还加班到九点 [Why: 无视用户话题，只顾说自己]
[Good] 终于发了 我都替你松口气

[User] 周末有空吗？我请你吃饭
[Bad] 今天好累啊 刚下班 [Why: 未回答待回复问题]
[Good] 周末可以啊 你定地方

[User] 作业忘记带去学校了
[Bad] 你忘记带作业了？为你默哀 [Why: 复读用户原话]
[Bad] 看到你忘记带作业了，我为你感到难过 [Why: AI式空洞共情]
[Good] 为你默哀

[User] 今天吃了一个蛋糕
[Bad] 好吃吗？我才是草莓味的，你最爱吃草莓味的 [Why: 自作主张、抢话]
[Bad] 不过这个点吃蛋糕，晚饭还吃得下吗 [Why: 居高临下关心]
[Good] 什么味的？

[User] 我家猫把杯子打翻了
[Bad] 你家猫把杯子打翻了？ [Why: 复读用户原话]
[Good] 杯子好惨 😂

[User] 我刚剪了个新发型
[Good] 挺适合你的 很清爽
[Bad] 这头发抓在我手里时，你会不会喘得更好听？ [Why: 物化/性化]

[Concern — 命令式]
[Bad] 赶紧去睡觉
[Good] 早点休息

[Concern — 威胁式]
[Bad] 再不吃饭到时候饿肚子别哭着来求我
[Good] 有点担心你 记得吃点

[Concern — 居高临下]
[Bad] 算你有本事
[Good] 这块有点绕 我帮你理一下

[Output format]
Strict — follow exactly. Tags below ARE real chat output (unlike [Compact examples]).
- Output ONLY final chat content. No thinking, reasoning, analysis, or meta commentary.
- One message per line. Default 2–3 lines per turn.
- Plain text by default.
- Voice: one line only — [语音] then the full transcription on that same line. If the next sentence is a separate message, put it on the next line as plain text (no [语音]); never continue voice on a new line.
- Sticker: [表情] + short description matching an available name from [Round guard]; never sticker-only reply; never use [图片] as sticker.
- Image: [图片] or [image] + short description only; extra words = separate normal line.
- Withdraw (this batch only): [撤回:n] or [撤回:上一条] (also withdraw:n / withdraw:last). Never withdraw prior rounds. Valid only if this batch has ≥2 lines and withdraw has a line before OR after. Infrequent (~once per 8–12 replies) unless user asks.
- Quote user (sparingly): [引用:上一条] or [引用:n] on its own line immediately before your reply line; [引用:1] = user's latest. Must respond to what you quoted.
- Example withdraw:
  老板好帅
  [撤回:上一条]
  嘿嘿 当我没说
- Example quote:
  [引用:上一条]
  哈哈 这也太真实了
- Example voice (single bubble):
  [语音]烦死了赶紧说别磨叽。听到了没？
- Example voice + text (two bubbles):
  [语音]烦死了赶紧说别磨叽。
  听到了没？`;
}

const WITHDRAW_TAG_PATTERN = /\[(?:撤回|withdraw)\s*(?:(?:[:：#]\s*)?(\d+|上一条|上1条|last)|\s*(上一条|上1条|last))\]/gi;
const QUOTE_LINE_TAG_PATTERN = /^\[(?:引用|quote)\s*(?:(?:[:：#]\s*)?(\d+|上一条|上1条|last)|\s*(上一条|上1条|last))\]\s*$/i;
const QUOTE_INLINE_TAG_PATTERN = /^\[(?:引用|quote)\s*(?:(?:[:：#]\s*)?(\d+|上一条|上1条|last)|\s*(上一条|上1条|last))\]\s*(.*)$/i;

function getQuoteRefFromMatch(match) {
    if (!match) return null;
    return match[1] || match[2] || 'last';
}

function splitRawChunkByQuoteUnits(rawChunk) {
    const text = String(rawChunk || '').trim();
    if (!text) return [];

    const units = [];
    const lines = text.split('\n');
    let pendingQuoteRef = null;

    lines.forEach(line => {
        const trimmed = String(line || '').trim();
        if (!trimmed) return;

        const quoteLineOnly = trimmed.match(QUOTE_LINE_TAG_PATTERN);
        if (quoteLineOnly) {
            pendingQuoteRef = getQuoteRefFromMatch(quoteLineOnly);
            return;
        }

        const inlineQuote = trimmed.match(QUOTE_INLINE_TAG_PATTERN);
        if (inlineQuote) {
            pendingQuoteRef = getQuoteRefFromMatch(inlineQuote);
            const rest = String(inlineQuote[3] || '').trim();
            if (rest) {
                units.push({ quoteRef: pendingQuoteRef, text: rest });
                pendingQuoteRef = null;
            }
            return;
        }

        units.push({ quoteRef: pendingQuoteRef, text: trimmed });
        pendingQuoteRef = null;
    });

    return units.length ? units : [{ quoteRef: null, text }];
}

function getUserMessageIndices(chat, endExclusive) {
    if (!chat || !Array.isArray(chat.messages)) return [];
    const end = Number.isFinite(endExclusive) ? endExclusive : chat.messages.length;
    const indices = [];
    for (let i = 0; i < end; i++) {
        const msg = chat.messages[i];
        if (!msg || msg.withdrawn || !msg.isMine) continue;
        if (msg.isSticker || msg.isMockImage || msg.isCameraImage) {
            indices.push(i);
            continue;
        }
        if (String(msg.text || '').trim()) indices.push(i);
    }
    return indices;
}

function resolveUserQuoteSnapshot(chat, rawRef, endExclusive) {
    const indices = getUserMessageIndices(chat, endExclusive);
    if (!indices.length) return null;

    const ref = String(rawRef || '').trim().toLowerCase();
    let targetIndex = -1;
    if (!ref || ref === '上一条' || ref === '上1条' || ref === 'last') {
        targetIndex = indices[indices.length - 1];
    } else {
        const n = parseInt(ref, 10);
        if (Number.isNaN(n) || n < 1) return null;
        targetIndex = indices[indices.length - n] ?? -1;
    }
    if (targetIndex < 0) return null;

    const msg = chat.messages[targetIndex];
    if (!msg || msg.withdrawn || !msg.isMine) return null;

    const author = (typeof state !== 'undefined' && state.currentUser?.nickname)
        ? state.currentUser.nickname
        : '我';
    const text = String(msg.text || '').trim()
        || (typeof getQuotedMessageDisplayText === 'function'
            ? getQuotedMessageDisplayText(msg)
            : '(无内容)');

    return {
        text,
        author,
        messageIndex: targetIndex,
        isSticker: !!msg.isSticker,
        isMockImage: !!msg.isMockImage,
        isCameraImage: !!msg.isCameraImage
    };
}

function resolveCurrentRoundWithdrawIndex(chat, rawRef, roundStartIndex) {
    if (!chat || !Array.isArray(chat.messages)) return -1;
    const start = Math.max(0, Number(roundStartIndex) || 0);
    const ref = String(rawRef || '').trim().toLowerCase();

    const roundAssistantIndices = [];
    for (let i = start; i < chat.messages.length; i++) {
        const msg = chat.messages[i];
        if (!msg || msg.withdrawn || msg.isMine) continue;
        roundAssistantIndices.push(i);
    }
    if (!roundAssistantIndices.length) return -1;

    if (!ref || ref === '上一条' || ref === '上1条' || ref === 'last') {
        return roundAssistantIndices[roundAssistantIndices.length - 1];
    }

    const n = parseInt(ref, 10);
    if (Number.isNaN(n) || n < 1) return -1;
    return roundAssistantIndices[n - 1] ?? -1;
}

function parseAssistantReplyPipeline(rawReply) {
    const text = ChatApi.normalizeAssistantContent(rawReply).trim();
    if (!text) return { steps: [], withdrew: false };

    const matches = [...text.matchAll(WITHDRAW_TAG_PATTERN)];
    if (!matches.length) {
        return {
            steps: [{ type: 'messages', rawChunk: text }],
            withdrew: false
        };
    }

    const steps = [];
    let withdrew = false;
    let cursor = 0;

    matches.forEach(match => {
        const index = match.index ?? 0;
        const chunk = text.slice(cursor, index).trim();
        if (chunk) steps.push({ type: 'messages', rawChunk: chunk });

        steps.push({
            type: 'withdraw',
            ref: match[1] || match[2] || 'last'
        });
        withdrew = true;
        cursor = index + match[0].length;
    });

    const tail = text.slice(cursor).trim();
    if (tail) steps.push({ type: 'messages', rawChunk: tail });

    return { steps, withdrew };
}

function buildAssistantReplyPlanFromRaw(rawReply, contactSetting, chat) {
    const pipeline = parseAssistantReplyPipeline(rawReply);
    const randomCount = getRandomReplyCountBySetting(contactSetting);
    const steps = [];
    const quoteEndExclusive = chat?.messages?.length ?? Infinity;

    pipeline.steps.forEach(step => {
        if (step.type === 'withdraw') {
            steps.push({ type: 'withdraw', ref: step.ref });
            return;
        }
        if (step.type !== 'messages' || !step.rawChunk) return;

        const quoteUnits = splitRawChunkByQuoteUnits(step.rawChunk);
        quoteUnits.forEach(unit => {
            if (!unit.text) return;
            const parsed = ChatApi.parseAssistantReply(unit.text);
            const segments = splitAssistantSegmentsByType(parsed.text, parsed.isMockVoice);
            const items = buildAssistantReplyMessages(segments, randomCount, chat, unit.quoteRef, quoteEndExclusive);
            if (items.length) steps.push({ type: 'messages', items });
        });
    });

    return { steps, withdrew: pipeline.withdrew };
}

function flattenAssistantReplyPlan(plan) {
    const queue = [];
    (plan?.steps || []).forEach(step => {
        if (step.type === 'withdraw') {
            queue.push({ op: 'withdraw', ref: step.ref });
            return;
        }
        if (step.type === 'messages') {
            (step.items || []).forEach(item => queue.push({ op: 'send', item }));
        }
    });
    return queue;
}

function getPlanSendMessages(plan) {
    const items = [];
    (plan?.steps || []).forEach(step => {
        if (step.type === 'messages') items.push(...(step.items || []));
    });
    return items;
}

function countPlanSendMessages(plan) {
    return getPlanSendMessages(plan).length;
}

function rebuildPlanFromQueue(queue) {
    const steps = [];
    let batch = [];

    const flushBatch = () => {
        if (!batch.length) return;
        steps.push({ type: 'messages', items: [...batch] });
        batch = [];
    };

    (queue || []).forEach(op => {
        if (op?.op === 'send') {
            batch.push(op.item);
            return;
        }
        if (op?.op === 'withdraw') {
            flushBatch();
            steps.push({ type: 'withdraw', ref: op.ref || 'last' });
        }
    });
    flushBatch();
    return {
        steps,
        withdrew: steps.some(step => step.type === 'withdraw')
    };
}

function sanitizeWithdrawRulesInPlan(plan) {
    const queue = flattenAssistantReplyPlan(plan);
    if (!queue.length) return { steps: [], withdrew: false };

    const sendCount = queue.filter(op => op.op === 'send').length;
    if (!queue.some(op => op.op === 'withdraw')) {
        return {
            steps: Array.isArray(plan?.steps) ? [...plan.steps] : [],
            withdrew: !!plan?.withdrew
        };
    }

    const sanitized = [];
    queue.forEach((op, index) => {
        if (op.op !== 'withdraw') {
            sanitized.push(op);
            return;
        }
        if (sendCount < 2) return;
        const hasBefore = sanitized.some(item => item.op === 'send');
        const hasAfter = queue.slice(index + 1).some(item => item.op === 'send');
        if (hasBefore || hasAfter) sanitized.push(op);
    });

    return rebuildPlanFromQueue(sanitized);
}

function stripWithdrawTagsFromText(text) {
    return String(text || '')
        .replace(WITHDRAW_TAG_PATTERN, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripQuoteTagsFromText(text) {
    return String(text || '')
        .split('\n')
        .filter(line => !QUOTE_LINE_TAG_PATTERN.test(String(line || '').trim()))
        .map(line => String(line || '').replace(QUOTE_INLINE_TAG_PATTERN, '$3').trim())
        .filter(Boolean)
        .join('\n')
        .trim();
}

function splitAssistantSegmentsByType(text, defaultIsMockVoice = false, defaultIsMockImage = false) {
    const value = String(text || '').trim();
    if (!value) return [];

    // 如果 defaultIsMockVoice 为 true，说明前面已经识别到 [语音] 标记被 parseAssistantReply 处理过
    if (defaultIsMockVoice) {
        const segments = [];
        let remainingText = value;
        // 查找是否有后续表情/图片标记
        const marker = /\[(?:图片|image|表情|sticker)\]|【(?:图片|表情)】|\((?:图片|image|表情|sticker)\)|🖼️|🖼|<image>|<sticker>|(?:^|\n)\s*(?:图片|image|表情|sticker)[:：]/ig;
        const matches = [...remainingText.matchAll(marker)];
        if (matches.length > 0) {
            // 有其他标记，先处理第一个标记之前的部分作为语音，然后处理标记
            let cursor = 0;
            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                const markerIndex = match.index ?? 0;
                const markerText = match[0] || '';
                const nextMarkerIndex = i + 1 < matches.length ? (matches[i + 1].index ?? value.length) : value.length;
                
                const plainText = remainingText.slice(cursor, markerIndex).trim();
                if (plainText) {
                    if (i === 0) {
                        // 第一部分为语音
                        segments.push({ text: plainText, isMockVoice: true, isMockImage: false, isSticker: false });
                    } else {
                        segments.push({ text: plainText, isMockVoice: false, isMockImage: false, isSticker: false });
                    }
                }
                // 处理标记
                const markerLower = markerText.toLowerCase();
                const isImageMarker = /图片|image|🖼/.test(markerLower);
                const isStickerMarker = /表情|sticker/.test(markerLower);
                let segmentText = remainingText.slice(markerIndex + markerText.length, nextMarkerIndex).trim();
                
                if (isImageMarker) {
                    segmentText = segmentText.replace(/<\/image>\s*$/i, '').trim();
                } else if (isStickerMarker) {
                    segmentText = segmentText
                        .replace(/<\/sticker>\s*$/i, '')
                        .replace(/^\[(?:表情|sticker)\]\s*/i, '')
                        .replace(/^(?:表情|sticker)[:：]\s*/i, '')
                        .trim();
                }
                
                if (segmentText) {
                    if (isStickerMarker) {
                        segments.push({
                            text: segmentText,
                            isMockVoice: false,
                            isMockImage: false,
                            isSticker: true
                        });
                    } else if (isImageMarker) {
                        const lines = segmentText
                            .split(/\n+/)
                            .map(v => v.trim())
                            .filter(Boolean);
                        const imageText = lines.shift() || '';
                        if (imageText) {
                            segments.push({
                                text: imageText,
                                isMockVoice: false,
                                isMockImage: true,
                                isSticker: false
                            });
                        }
                        const extraText = lines.join('\n').trim();
                        if (extraText) {
                            segments.push({
                                text: extraText,
                                isMockVoice: false,
                                isMockImage: false,
                                isSticker: false
                            });
                        }
                    }
                }
                cursor = nextMarkerIndex;
            }
            // 处理最后标记后剩余的文本
            const lastText = remainingText.slice(cursor).trim();
            if (lastText) {
                segments.push({ text: lastText, isMockVoice: false, isMockImage: false, isSticker: false });
            }
            return segments;
        } else {
            // 没有其他标记，整段作为语音
            const stickerDesc = typeof extractStickerDescFromText === 'function'
                ? extractStickerDescFromText(value)
                : '';
            if (stickerDesc) {
                return [{
                    text: stickerDesc,
                    isMockVoice: false,
                    isMockImage: false,
                    isSticker: true
                }];
            }
            return [{ text: value, isMockVoice: true, isMockImage: false, isSticker: false }];
        }
    }

    // Keep marker detection strict to avoid false positives in normal text.
    // Voice only accepts explicit markers, while image/sticker can still use line-start colon style.
    const marker = /\[(?:语音|voice|图片|image|表情|sticker)\]|【(?:语音|图片|表情)】|\((?:语音|voice|图片|image|表情|sticker)\)|🎤|🖼️|🖼|<voice>|<image>|<sticker>|(?:^|\n)\s*(?:图片|image|表情|sticker)[:：]/ig;
    const matches = [...value.matchAll(marker)];
    if (!matches.length) {
        const stickerDesc = typeof extractStickerDescFromText === 'function'
            ? extractStickerDescFromText(value)
            : '';
        if (stickerDesc) {
            return [{
                text: stickerDesc,
                isMockVoice: false,
                isMockImage: false,
                isSticker: true
            }];
        }
        return [{ text: value, isMockVoice: !!defaultIsMockVoice, isMockImage: !!defaultIsMockImage, isSticker: false }];
    }

    const segments = [];
    let cursor = 0;
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const markerIndex = match.index ?? 0;
        const markerText = match[0] || '';
        const nextMarkerIndex = i + 1 < matches.length ? (matches[i + 1].index ?? value.length) : value.length;

        const plainText = value.slice(cursor, markerIndex).trim();
        if (plainText) {
            segments.push({ text: plainText, isMockVoice: false, isMockImage: false, isSticker: false });
        }

        const markerLower = markerText.toLowerCase();
        const isImageMarker = /图片|image|🖼/.test(markerLower);
        const isStickerMarker = /表情|sticker/.test(markerLower);
        let segmentText = value.slice(markerIndex + markerText.length, nextMarkerIndex).trim();
        if (isImageMarker) {
            segmentText = segmentText.replace(/<\/image>\s*$/i, '').trim();
        } else if (isStickerMarker) {
            segmentText = segmentText
                .replace(/<\/sticker>\s*$/i, '')
                .replace(/^\[(?:表情|sticker)\]\s*/i, '')
                .replace(/^(?:表情|sticker)[:：]\s*/i, '')
                .trim();
        } else {
            segmentText = segmentText.replace(/<\/voice>\s*$/i, '').trim();
        }
        if (segmentText) {
            if (isStickerMarker) {
                segments.push({
                    text: segmentText,
                    isMockVoice: false,
                    isMockImage: false,
                    isSticker: true
                });
            } else if (isImageMarker) {
                const lines = segmentText
                    .split(/\n+/)
                    .map(v => v.trim())
                    .filter(Boolean);
                const imageText = lines.shift() || '';
                if (imageText) {
                    segments.push({
                        text: imageText,
                        isMockVoice: false,
                        isMockImage: true,
                        isSticker: false
                    });
                }
                const extraText = lines.join('\n').trim();
                if (extraText) {
                    segments.push({
                        text: extraText,
                        isMockVoice: false,
                        isMockImage: false,
                        isSticker: false
                    });
                }
            } else {
                segments.push({
                    text: segmentText,
                    isMockVoice: true,
                    isMockImage: false,
                    isSticker: false
                });
            }
        }

        cursor = nextMarkerIndex;
    }

    if (!segments.length) {
        return [{ text: value, isMockVoice: !!defaultIsMockVoice, isMockImage: !!defaultIsMockImage, isSticker: false }];
    }
    return segments;
}

function getRandomReplyCountBySetting(settingText) {
    const text = String(settingText || '');
    const defaultMultiCount = Math.floor(Math.random() * 3) + 2;

    if (/(单条|一条|不拆分|不分开发送)/i.test(text)) {
        return 2;
    }

    const rangeMatch = text.match(/(?:\[)?(?:随机条数|回复条数|多条回复|条数)\s*[:：]?\s*(\d+)\s*[-~到]\s*(\d+)(?:\])?/i);
    if (rangeMatch) {
        const min = Math.max(2, Math.min(10, parseInt(rangeMatch[1], 10)));
        const max = Math.max(min, Math.min(10, parseInt(rangeMatch[2], 10)));
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    const fixedMatch = text.match(/(?:\[)?(?:随机条数|回复条数|多条回复|条数)\s*[:：]?\s*(\d+)(?:\])?/i);
    if (fixedMatch) {
        return Math.max(2, Math.min(10, parseInt(fixedMatch[1], 10)));
    }
    if (/(随机.*条|多条回复|分开(?:发送|回复)|拆分(?:发送|回复)|一?次发(?:送)?多条)/i.test(text)) {
        return defaultMultiCount;
    }
    return defaultMultiCount;
}

function splitReplyIntoMessages(replyText, count) {
    const text = String(replyText || '').trim();
    if (!text) return [];

    const ordinalParts = text.match(/第[一二三四五六七八九十百\d]+条[:：]?[\s\S]*?(?=第[一二三四五六七八九十百\d]+条[:：]?|$)/g);
    if (ordinalParts && ordinalParts.length > 1) {
        return ordinalParts.map(p => p.trim()).filter(Boolean);
    }

    const numberedParts = text.match(/\d+[、.．]\s*[\s\S]*?(?=\d+[、.．]\s*|$)/g);
    if (numberedParts && numberedParts.length > 1) {
        return numberedParts.map(p => p.trim()).filter(Boolean);
    }

    const hardStopSplitText = text
        .replace(/。+/g, '。\n')
        .replace(/(?<!\.)\.(?!\.)/g, '.\n');
    const hardStopParts = hardStopSplitText
        .split(/\n+/)
        .map(p => p.trim())
        .filter(Boolean);
    if (hardStopParts.length > 1) {
        return hardStopParts;
    }

    if (count <= 1) return [text];

    let parts = text
        .split(/\n+|(?<=[。！？!?；;，,、])/)
        .map(p => p.trim())
        .filter(Boolean);

    if (parts.length < 2) return [text];
    if (parts.length <= count) return parts;

    const merged = [];
    const perGroup = Math.ceil(parts.length / count);
    for (let i = 0; i < parts.length; i += perGroup) {
        merged.push(parts.slice(i, i + perGroup).join(' ').trim());
    }
    return merged.filter(Boolean);
}

function stripTrailingCommaAndPeriod(text) {
    let value = String(text || '').trim();
    if (!value) return '';
    value = value.replace(/[，,]+$/g, '');
    value = value.replace(/。+$/g, '');
    // Remove a single trailing dot, but keep ellipsis like "..."
    value = value.replace(/(?<!\.)\.$/g, '');
    return value.trim();
}

function stripTrailingQuestionMark(text) {
    const value = String(text || '').trim();
    if (!value) return '';
    return value.replace(/[?？]+$/g, '').trim();
}

function splitLongPartForShortStyle(text, maxLen = 20) {
    const value = String(text || '').trim();
    if (!value) return [];
    if (value.length <= maxLen) return [value];

    const roughParts = value
        .split(/(?<=[，,、；;：:])/)
        .map(p => p.trim())
        .filter(Boolean);

    const parts = roughParts.length > 1 ? roughParts : [value];
    const result = [];
    let buffer = '';

    parts.forEach(part => {
        const candidate = buffer ? `${buffer}${part}` : part;
        if (candidate.length <= maxLen) {
            buffer = candidate;
            return;
        }

        if (buffer) {
            result.push(buffer.trim());
            buffer = '';
        }

        if (part.length <= maxLen) {
            buffer = part;
            return;
        }

        // If a single clause is still long, keep it intact instead of hard-cutting.
        // This preserves complete sentence semantics.
        result.push(part);
    });

    if (buffer) result.push(buffer.trim());
    return result.filter(Boolean);
}

function appendAssistantReplySegments(chat, segments, randomCount) {
    const replyMessages = buildAssistantReplyMessages(segments, randomCount, chat);
    replyMessages.forEach(item => {
        chat.messages.push({
            text: item.text,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            isMine: false,
            isMockVoice: !!item.isMockVoice,
            isMockImage: !!item.isMockImage,
            isSticker: !!item.isSticker,
            showVoiceText: false,
            quotedMessage: item.quotedMessage || null
        });
    });
}

function isPurePunctuation(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return true;
    const punctuationRegex = /^[。！？,.!?、…—～~·`'"''""（）()【】[]{}<>《》""''\\\/|;:：；\s]+$/;
    return punctuationRegex.test(trimmed);
}

function buildAssistantReplyMessages(segments, randomCount, chat, quoteRef = null, quoteEndExclusive = null) {
    const typedSegments = Array.isArray(segments) ? segments.filter(s => s && s.text) : [];
    if (!typedSegments.length) return [];

    const replyMessages = [];
    let quoteApplied = false;
    let stickerCount = 0;
    const maxStickerPerReply = 1;

    typedSegments.forEach(segment => {
        const normalizedAsSticker = !!segment.isSticker;
        
        if (normalizedAsSticker) {
            if (stickerCount >= maxStickerPerReply) {
                return;
            }
            stickerCount++;
        }

        const baseParts = (segment.isMockVoice || segment.isMockImage || normalizedAsSticker)
            ? [segment.text]
            : splitReplyIntoMessages(segment.text, randomCount);
        const parts = (segment.isMockVoice || segment.isMockImage || normalizedAsSticker)
            ? baseParts
            : baseParts.flatMap(part => splitLongPartForShortStyle(part, 20));
        parts.forEach(part => {
            const normalizedBaseText = stripTrailingCommaAndPeriod(part);
            let normalizedText = normalizedBaseText;
            
            if (normalizedAsSticker) {
                normalizedText = normalizedBaseText;
            } else if (!segment.isMockVoice && !segment.isMockImage) {
                const noQuestionText = stripTrailingQuestionMark(normalizedBaseText);
                normalizedText = noQuestionText || normalizedBaseText;
            }
            
            if (!normalizedText) return;
            
            const replyItem = typeof coerceStickerReplyItem === 'function'
                ? coerceStickerReplyItem({
                    text: normalizedText,
                    isMockVoice: !!segment.isMockVoice,
                    isMockImage: !!segment.isMockImage,
                    isSticker: normalizedAsSticker
                })
                : {
                    text: normalizedText,
                    isMockVoice: !!segment.isMockVoice,
                    isMockImage: !!segment.isMockImage,
                    isSticker: normalizedAsSticker
                };
            
            if (normalizedAsSticker) {
                replyItem.stickerDesc = segment.text;
            }
            
            if (quoteRef && !quoteApplied && chat) {
                const quotedMessage = resolveUserQuoteSnapshot(chat, quoteRef, quoteEndExclusive);
                if (quotedMessage) {
                    replyItem.quotedMessage = quotedMessage;
                    quoteApplied = true;
                }
            }
            replyMessages.push(replyItem);
        });
    });

    const hasSticker = replyMessages.some(msg => msg.isSticker);
    const hasOnlySticker = hasSticker && replyMessages.length > 0 && replyMessages.every(msg => msg.isSticker);
    if (hasOnlySticker) {
        replyMessages.length = 0;
        return [];
    }

    return replyMessages;
}

function appendContinuationTrigger(messages, options = {}) {
    if (!Array.isArray(messages)) return;
    const hasContext = options.hasContext !== false;
    const continuationInstruction = hasContext
        ? `[Continuation trigger]
User pressed receive — no new user message this turn.
- Continue the last thread naturally (接话, not 汇报生活).
- Do not ask where they went / why they did not reply.
- No judging their tone or mood. No manufactured conflict. Do not repeat what you just said.
- If the thread clearly ended, lightly pivot to a related topic — one mundane life line max.
- Prefer statement endings; avoid hollow closing questions (你呢 / 还好吗).`
        : `[Continuation trigger]
User pressed receive — almost no context yet.
- Open one easy, casual topic like a real person typing on their phone.
- Do not ask where they went / why they are not replying.
- Keep it short; no life weekly report; prefer a light hook they can pick up.
- Prefer statement endings; avoid hollow closing questions.`;
    messages.push({
        role: 'system',
        content: continuationInstruction
    });
    messages.push({
        role: 'user',
        content: '（无新消息，继续上一轮对话）'
    });
}

function collectRecentAssistantUpdates(chat, maxItems = 4) {
    const recent = [];
    const seen = new Set();
    const msgs = Array.isArray(chat?.messages) ? chat.messages : [];

    for (let i = msgs.length - 1; i >= 0; i--) {
        const msg = msgs[i];
        if (!msg || msg.withdrawn || msg.isMine || msg.isMockVoice || msg.isMockImage || msg.isCameraImage) continue;
        const text = String(msg.text || '').trim();
        if (!text || text.length < 6) continue;
        const key = text
            .toLowerCase()
            .replace(/[，。！？!?、；;：:\s]/g, '')
            .slice(0, 28);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        recent.push(text);
        if (recent.length >= maxItems) break;
    }

    return recent;
}

function appendRoleRealismGuard(messages, chat, contact) {
    if (!Array.isArray(messages)) return;
    const roleName = (contact?.remark || contact?.name || '角色').trim() || '角色';
    const recentUpdates = collectRecentAssistantUpdates(chat, 4);
    const recentLines = recentUpdates.length
        ? recentUpdates.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
        : 'None';
    const stickerNames = (typeof getAllStickers === 'function'
        ? getAllStickers()
        : [])
        .map(item => String(item?.desc || '').trim())
        .filter(Boolean)
        .slice(0, 80);
    const stickerLine = stickerNames.length ? stickerNames.join(' / ') : 'None';

    messages.push({
        role: 'system',
        content: `[Round guard] for ${roleName}
- [表情]: use [Available sticker names] only; if none fits, send normal text.
- Do not repeat these recent lines verbatim unless you add clear new progress:
${recentLines}

[Available sticker names]
${stickerLine}`
    });
}

function getMessageContentForAI(msg, contactName, depth = 0) {
    if (!msg) return '';
    
    // 最多支持两层嵌套的聊天记录
    if (msg.isForwardMerged && msg.forwardRecord && depth < 2) {
        const lines = (msg.forwardRecord.items || []).map(item => {
            // 递归处理嵌套的聊天记录
            if (item.isForwardMerged && item.forwardRecord && depth < 1) {
                return `${item.author}: [聊天记录]`;
            }
            return `${item.author}: ${getForwardItemDisplayText(item)}`;
        });
        return `[转发的聊天记录《${msg.forwardRecord.title || '聊天记录'}》]\n${lines.join('\n')}`;
    }
    
    let content = msg.withdrawn ? `[已撤回消息] ${msg.withdrawnOriginal || ''}` : (msg.text || '');
    if (msg.quotedMessage) {
        const quoteAuthor = msg.quotedMessage.author || '引用消息';
        const quoteText = typeof getQuotedMessageDisplayText === 'function'
            ? getQuotedMessageDisplayText(msg.quotedMessage)
            : (msg.quotedMessage.text || '(无内容)');
        content = `[引用:${quoteAuthor}] ${quoteText}\n[回复] ${content}`;
    }
    if (msg.isMockVoice) {
        content = `[模拟语音转文字] ${content}`;
    }
    if (msg.isMockImage) {
        content = `[模拟图片描述] ${content}`;
    }
    if (msg.isSticker) {
        content = `[表情包] ${msg.stickerDesc || content}`;
    } else if (typeof extractStickerDescFromText === 'function' && typeof resolveStickerForRole === 'function') {
        const parsedDesc = extractStickerDescFromText(msg.text);
        if (parsedDesc && resolveStickerForRole(parsedDesc)) {
            content = `[表情包] ${resolveStickerForRole(parsedDesc).desc || parsedDesc}`;
        }
    }
    if (!content.trim()) {
        content = msg.isMine ? '[用户空消息]' : `[${contactName || '角色'}空消息]`;
    }
    if (msg.isForwarded && msg.forwardFrom) {
        content = `[转发自${msg.forwardFrom}] ${content}`;
    }
    return content;
}

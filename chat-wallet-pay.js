// chat-wallet-pay module
const RED_PACKET_EXPIRE_MS = 24 * 60 * 60 * 1000;
const TRANSFER_EXPIRE_MS = 24 * 60 * 60 * 1000;

function getPayTimeString() {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatTransferDetailTime(ts) {
    const d = new Date(typeof ts === 'number' ? ts : Date.now());
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function createPaymentId() {
    return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function parsePayAmount(raw) {
    const n = parseFloat(String(raw || '').replace(/[^\d.]/g, ''));
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100) / 100;
}

function validatePayAmount(amount) {
    const n = parsePayAmount(amount);
    if (n == null) return { ok: false, message: '请输入有效金额' };
    if (n > (state.walletBalance || 0)) return { ok: false, message: '余额不足' };
    return { ok: true, amount: n };
}

function deductWallet(amount) {
    const n = parsePayAmount(amount);
    if (n == null) return false;
    state.walletBalance = Math.round(((state.walletBalance || 0) - n) * 100) / 100;
    return true;
}

function creditWallet(amount) {
    const n = parsePayAmount(amount);
    if (n == null) return false;
    state.walletBalance = Math.round(((state.walletBalance || 0) + n) * 100) / 100;
    return true;
}

function getRoleDisplayName(contact) {
    const c = contact || state.currentChatContact;
    return (c?.remark || c?.name || '角色').trim() || '角色';
}

function getUserDisplayName() {
    return (state.currentUser?.nickname || state.users?.[0]?.nickname || '你').trim() || '你';
}

function pushSystemNotice(chat, text) {
    if (!chat || !text) return;
    chat.messages.push({
        isSystemNotice: true,
        text: String(text),
        time: getPayTimeString()
    });
    markChatActivity(chat);
}

function createRedPacketMessage(isMine, amount, greeting) {
    const now = Date.now();
    return {
        paymentType: 'redPacket',
        paymentId: createPaymentId(),
        amount: parsePayAmount(amount),
        greeting: String(greeting || '恭喜发财').trim() || '恭喜发财',
        redPacketVariant: 'normal',
        status: 'pending',
        createdAt: now,
        expiresAt: now + RED_PACKET_EXPIRE_MS,
        isMine: !!isMine,
        time: getPayTimeString(),
        text: '[红包]'
    };
}

function createTransferMessage(isMine, amount, note) {
    const now = Date.now();
    return {
        paymentType: 'transfer',
        paymentId: createPaymentId(),
        amount: parsePayAmount(amount),
        note: String(note || '').trim(),
        status: 'pending',
        createdAt: now,
        expiresAt: now + TRANSFER_EXPIRE_MS,
        isMine: !!isMine,
        time: getPayTimeString(),
        text: '[转账]'
    };
}

function isPaymentMessage(msg) {
    return !!msg && (msg.paymentType === 'redPacket' || msg.paymentType === 'transfer');
}

function isPaymentPending(msg) {
    if (!isPaymentMessage(msg) || msg.status !== 'pending') return false;
    if (msg.expiresAt && Date.now() > msg.expiresAt) return false;
    return true;
}

function findPendingPayment(chat, paymentType, fromMine) {
    if (!chat?.messages) return null;
    for (let i = 0; i < chat.messages.length; i++) {
        const msg = chat.messages[i];
        if (!msg || msg.paymentType !== paymentType) continue;
        if (!!msg.isMine !== !!fromMine) continue;
        if (isPaymentPending(msg)) return { msg, index: i };
    }
    return null;
}

function findPaymentById(chat, paymentId) {
    if (!chat?.messages || !paymentId) return null;
    for (let i = 0; i < chat.messages.length; i++) {
        const msg = chat.messages[i];
        if (msg?.paymentId === paymentId) return { msg, index: i };
    }
    return null;
}

function syncPayUI() {
    saveStateToStorage();
    state.autoScrollNext = true;
    initChatApp();
}

function getActiveChat() {
    return getChatByContactId(state.currentChatContact?.qqId);
}

function userSendRedPacket(amount, greeting) {
    const v = validatePayAmount(amount);
    if (!v.ok) {
        alert(v.message);
        return false;
    }
    const chat = getActiveChat();
    if (!chat) {
        alert('请先打开聊天');
        return false;
    }
    if (!deductWallet(v.amount)) return false;
    chat.messages.push(createRedPacketMessage(true, v.amount, greeting));
    markChatActivity(chat);
    state.showRedPacketModal = false;
    state.payDraftAmount = '';
    state.payDraftGreeting = '';
    closePlusPanel();
    syncPayUI();
    return true;
}

function userSendTransfer(amount, note) {
    const v = validatePayAmount(amount);
    if (!v.ok) {
        alert(v.message);
        return false;
    }
    const chat = getActiveChat();
    if (!chat) {
        alert('请先打开聊天');
        return false;
    }
    if (!deductWallet(v.amount)) return false;
    chat.messages.push(createTransferMessage(true, v.amount, note));
    markChatActivity(chat);
    syncPayUI();
    return true;
}

function userClaimRedPacketFromRole(paymentId) {
    const chat = getActiveChat();
    const found = findPaymentById(chat, paymentId);
    if (!found || found.msg.isMine || found.msg.paymentType !== 'redPacket') return false;
    if (!isPaymentPending(found.msg)) return false;
    creditWallet(found.msg.amount);
    found.msg.status = 'claimed';
    found.msg.claimedTime = new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const roleName = getRoleDisplayName();
    pushSystemNotice(chat, `你领取了「${roleName}」的红包`);
    syncPayUI();
    return true;
}

function userAcceptTransferFromRole(paymentId) {
    const chat = getActiveChat();
    const found = findPaymentById(chat, paymentId);
    if (!found || found.msg.isMine || found.msg.paymentType !== 'transfer') return false;
    if (!isPaymentPending(found.msg)) return false;
    creditWallet(found.msg.amount);
    found.msg.status = 'claimed';
    found.msg.claimedAt = Date.now();
    const roleName = getRoleDisplayName();
    pushSystemNotice(chat, `你已收款，${roleName}的转账 ¥${found.msg.amount.toFixed(2)}`);
    syncPayUI();
    return true;
}

function userRejectTransferFromRole(paymentId) {
    const chat = getActiveChat();
    const found = findPaymentById(chat, paymentId);
    if (!found || found.msg.isMine || found.msg.paymentType !== 'transfer') return false;
    if (!isPaymentPending(found.msg)) return false;
    found.msg.status = 'rejected';
    const roleName = getRoleDisplayName();
    pushSystemNotice(chat, `你已拒收${roleName}的转账`);
    syncPayUI();
    return true;
}

function roleClaimUserRedPacket(chat, contact) {
    const found = findPendingPayment(chat, 'redPacket', true);
    if (!found) return false;
    found.msg.status = 'claimed';
    const roleName = getRoleDisplayName(contact);
    pushSystemNotice(chat, `「${roleName}」领取了你的红包`);
    return true;
}

function roleAcceptUserTransfer(chat, contact) {
    const found = findPendingPayment(chat, 'transfer', true);
    if (!found) return false;
    found.msg.status = 'claimed';
    const roleName = getRoleDisplayName(contact);
    pushSystemNotice(chat, `「${roleName}」已收款`);
    return true;
}

function roleRejectUserTransfer(chat, contact) {
    const found = findPendingPayment(chat, 'transfer', true);
    if (!found) return false;
    creditWallet(found.msg.amount);
    found.msg.status = 'rejected';
    const roleName = getRoleDisplayName(contact);
    pushSystemNotice(chat, `「${roleName}」拒收了你的转账，已退回 ¥${found.msg.amount.toFixed(2)}`);
    return true;
}

function isRefundTransferMessage(msg) {
    if (!msg || msg.paymentType !== 'transfer') return false;
    if (msg.isRefundTransfer) return true;
    return String(msg.note || '').trim() === '退还转账';
}

function canUserRefundIncomingTransfer(msg) {
    if (!msg || msg.isMine || msg.paymentType !== 'transfer') return false;
    if (msg.status !== 'claimed' || msg.refunded) return false;
    return !isRefundTransferMessage(msg);
}

function findClaimedUserTransferToRefund(chat) {
    if (!chat?.messages) return null;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
        const msg = chat.messages[i];
        if (!msg || msg.paymentType !== 'transfer' || !msg.isMine) continue;
        if (msg.status !== 'claimed' || msg.refunded) continue;
        if (isRefundTransferMessage(msg)) continue;
        return { msg, index: i };
    }
    return null;
}

function pushInstantClaimedTransferFromRole(chat, amount, note) {
    const n = parsePayAmount(amount);
    if (n == null) return null;
    creditWallet(n);
    const msg = createTransferMessage(false, n, note || '退还转账');
    msg.status = 'claimed';
    msg.claimedAt = Date.now();
    msg.isRefundTransfer = true;
    chat.messages.push(msg);
    return msg;
}

function findClaimedUserTransferByAmount(chat, amount) {
    const n = parsePayAmount(amount);
    if (n == null || !chat?.messages) return null;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
        const msg = chat.messages[i];
        if (!msg || msg.paymentType !== 'transfer' || !msg.isMine) continue;
        if (msg.status !== 'claimed' || msg.refunded) continue;
        if (isRefundTransferMessage(msg)) continue;
        if (parsePayAmount(msg.amount) === n) return { msg, index: i };
    }
    return null;
}

function roleRefundUserTransfer(chat, contact, opts) {
    let found = null;
    if (opts && typeof opts === 'object' && opts.amount) {
        found = findClaimedUserTransferByAmount(chat, opts.amount);
    }
    if (!found) found = findClaimedUserTransferToRefund(chat);
    if (!found) return false;

    found.msg.refunded = true;
    found.msg.status = 'refunded';
    const refundNote = (opts && typeof opts === 'object' && opts.note && String(opts.note).trim())
        ? String(opts.note).trim().slice(0, 60)
        : '退还转账';
    pushInstantClaimedTransferFromRole(chat, found.msg.amount, refundNote);
    markChatActivity(chat);
    const roleName = getRoleDisplayName(contact);
    pushSystemNotice(chat, `「${roleName}」已退还转账 ¥${found.msg.amount.toFixed(2)}`);
    return true;
}

function roleSendRedPacket(chat, amount, greeting) {
    const n = parsePayAmount(amount);
    if (n == null) return false;
    chat.messages.push(createRedPacketMessage(false, n, greeting));
    markChatActivity(chat);
    return true;
}

function roleSendTransfer(chat, amount, note) {
    const n = parsePayAmount(amount);
    if (n == null) return false;
    chat.messages.push(createTransferMessage(false, n, note));
    markChatActivity(chat);
    return true;
}

function roleExecutePaymentOp(action, chat, contact) {
    if (!chat || !action) return false;
    switch (action) {
        case 'claimRedPacket':
            return roleClaimUserRedPacket(chat, contact);
        case 'acceptTransfer':
            return roleAcceptUserTransfer(chat, contact);
        case 'rejectTransfer':
            return roleRejectUserTransfer(chat, contact);
        case 'refundTransfer':
            return roleRefundUserTransfer(chat, contact);
        default:
            if (action.type === 'refundTransfer') {
                return roleRefundUserTransfer(chat, contact, action);
            }
            if (action.type === 'sendRedPacket') {
                return roleSendRedPacket(chat, action.amount, action.greeting);
            }
            if (action.type === 'sendTransfer') {
                return roleSendTransfer(chat, action.amount, action.note);
            }
            return false;
    }
}

function expirePaymentMessage(chat, msg, contact) {
    if (!msg || msg.status !== 'pending') return false;
    if (msg.expiresAt && Date.now() <= msg.expiresAt) return false;

    const roleName = getRoleDisplayName(contact || chat?.contact);
    const userName = getUserDisplayName();

    if (msg.paymentType === 'redPacket') {
        msg.status = 'expired';
        if (msg.isMine) {
            creditWallet(msg.amount);
            pushSystemNotice(chat, `红包已过期，¥${msg.amount.toFixed(2)} 已退回`);
        } else {
            pushSystemNotice(chat, `「${roleName}」的红包已过期`);
        }
        return true;
    }

    if (msg.paymentType === 'transfer') {
        msg.status = 'expired';
        if (msg.isMine) {
            creditWallet(msg.amount);
            pushSystemNotice(chat, `转账已过期，¥${msg.amount.toFixed(2)} 已退回`);
        } else {
            pushSystemNotice(chat, `「${roleName}」的转账已过期未收款`);
        }
        return true;
    }
    return false;
}

function sweepExpiredPayments(chat) {
    if (!chat?.messages?.length) return false;
    let changed = false;
    const contact = chat.contact || state.currentChatContact;
    chat.messages.forEach(msg => {
        if (expirePaymentMessage(chat, msg, contact)) changed = true;
    });
    if (changed) {
        saveStateToStorage();
    }
    return changed;
}

function sweepAllChatsExpiredPayments() {
    let changed = false;
    (state.chats || []).forEach(chat => {
        if (sweepExpiredPayments(chat)) changed = true;
    });
    return changed;
}

function openRedPacketModal() {
    closePlusPanel();
    state.showRedPacketModal = true;
    state.payDraftAmount = state.payDraftAmount || '';
    state.payDraftGreeting = state.payDraftGreeting || '';
    initChatApp();
}

function closeRedPacketModal() {
    state.showRedPacketModal = false;
    initChatApp();
}

function updatePayDraftAmount(v) {
    state.payDraftAmount = v || '';
}

function updatePayDraftGreeting(v) {
    state.payDraftGreeting = v || '';
}

function confirmSendRedPacket() {
    const amount = state.payDraftAmount || document.getElementById('redPacketAmountInput')?.value;
    const greeting = state.payDraftGreeting || document.getElementById('redPacketGreetingInput')?.value;
    userSendRedPacket(amount, greeting);
}

function openTransferDetailPage(paymentId) {
    const chat = getActiveChat();
    const found = findPaymentById(chat, paymentId);
    if (!found || found.msg.isMine || found.msg.paymentType !== 'transfer') return;

    if (isPaymentPending(found.msg)) {
        if (!userAcceptTransferFromRole(paymentId)) return;
    }

    const msg = findPaymentById(chat, paymentId)?.msg;
    if (!msg || (msg.status !== 'claimed' && msg.status !== 'refunded')) return;

    state.transferDetailId = paymentId;
    initChatApp();
}

function closeTransferDetailPage() {
    state.transferDetailId = null;
    initChatApp();
}

function userRefundTransferToRole(paymentId) {
    const chat = getActiveChat();
    const found = findPaymentById(chat, paymentId);
    if (!found || found.msg.isMine || found.msg.paymentType !== 'transfer') return false;
    if (!canUserRefundIncomingTransfer(found.msg)) return false;

    if (!deductWallet(found.msg.amount)) {
        alert('余额不足，无法退还转账');
        return false;
    }

    found.msg.refunded = true;
    found.msg.status = 'refunded';
    const refundMsg = createTransferMessage(true, found.msg.amount, '退还转账');
    refundMsg.status = 'claimed';
    refundMsg.claimedAt = Date.now();
    refundMsg.isRefundTransfer = true;
    chat.messages.push(refundMsg);
    markChatActivity(chat);
    const roleName = getRoleDisplayName();
    pushSystemNotice(chat, `你已退还${roleName}的转账 ¥${found.msg.amount.toFixed(2)}`);
    closeTransferDetailPage();
    syncPayUI();
    return true;
}

function openWalletFromTransferDetail() {
    closeTransferDetailPage();
    if (typeof openWallet === 'function') openWallet();
}

function openTransferPage() {
    if (!state.currentChatContact) {
        alert('请先打开与好友的聊天');
        return;
    }
    closePlusPanel();
    state.transferPageOpen = true;
    state.transferDraftAmount = state.transferDraftAmount || '';
    state.transferDraftNote = state.transferDraftNote || '';
    initChatApp();
}

function closeTransferPage() {
    state.transferPageOpen = false;
    initChatApp();
}

function updateTransferDraftAmount(v) {
    state.transferDraftAmount = v || '';
}

function updateTransferDraftNote(v) {
    state.transferDraftNote = v || '';
}

const TRANSFER_NOTE_PLACEHOLDER = '添加转账留言（选填）';

function onTransferNoteFocus(el) {
    if (!el) return;
    const text = (el.innerText || '').trim();
    if (text === TRANSFER_NOTE_PLACEHOLDER) {
        el.innerText = '';
    }
}

function saveTransferDraftNoteFromEl(el) {
    if (!el) return;
    let text = (el.innerText || '').replace(/\n/g, ' ').trim();
    if (text === TRANSFER_NOTE_PLACEHOLDER) text = '';
    state.transferDraftNote = text.slice(0, 60);
    if (!state.transferDraftNote) {
        el.innerText = TRANSFER_NOTE_PLACEHOLDER;
    }
}

function getTransferDraftNoteValue() {
    const fromState = (state.transferDraftNote || '').trim();
    if (fromState) return fromState;
    const el = document.querySelector('.transfer-note-editable');
    if (!el) return '';
    const text = (el.innerText || '').replace(/\n/g, ' ').trim();
    if (text === TRANSFER_NOTE_PLACEHOLDER) return '';
    return text.slice(0, 60);
}

function confirmTransferFromPage() {
    const amount = state.transferDraftAmount || document.getElementById('transferAmountInput')?.value;
    const note = getTransferDraftNoteValue();
    if (!userSendTransfer(amount, note)) return;
    closeTransferPage();
}

function openRedPacketAnimation(paymentId) {
    state.redPacketOpenId = paymentId;
    state.redPacketAnimPhase = 'cover';
    initChatApp();
}

function onRedPacketSealClick() {
    if (!state.redPacketOpenId || state.redPacketAnimPhase !== 'cover') return;
    const chat = getActiveChat();
    const found = findPaymentById(chat, state.redPacketOpenId);
    if (!found || found.msg.isMine || found.msg.paymentType !== 'redPacket') return;
    if (!isPaymentPending(found.msg)) return;

    state.redPacketAnimPhase = 'spin';
    initChatApp();

    setTimeout(() => {
        state.redPacketAnimPhase = 'opening';
        initChatApp();
        userClaimRedPacketFromRole(state.redPacketOpenId);
        setTimeout(() => {
            state.redPacketAnimPhase = 'detail';
            initChatApp();
        }, 550);
    }, 1450);
}

function closeRedPacketDetailPage() {
    state.redPacketOpenId = null;
    state.redPacketAnimPhase = null;
    initChatApp();
}

function onPaymentCardClick(messageIndex) {
    if (state.messageSelectMode) return;
    const chat = getActiveChat();
    if (!chat?.messages?.[messageIndex]) return;
    const msg = chat.messages[messageIndex];
    if (!isPaymentMessage(msg)) return;

    if (msg.paymentType === 'redPacket' && !msg.isMine && isPaymentPending(msg)) {
        openRedPacketAnimation(msg.paymentId);
        return;
    }

    if (msg.paymentType === 'transfer' && !msg.isMine) {
        if (isPaymentPending(msg) || msg.status === 'claimed' || msg.status === 'refunded') {
            openTransferDetailPage(msg.paymentId);
        }
    }
}

function collectPendingPaymentsForGuard(chat) {
    const list = [];
    if (!chat?.messages) return list;
    chat.messages.forEach(msg => {
        if (!isPaymentMessage(msg) || !msg.isMine) return;
        if (!isPaymentPending(msg)) return;
        if (msg.paymentType === 'redPacket') {
            list.push(`Red packet ¥${msg.amount} greeting「${msg.greeting || '恭喜发财'}」 pending`);
        } else if (msg.paymentType === 'transfer') {
            list.push(`Transfer ¥${msg.amount} note「${msg.note || ''}」 pending`);
        }
    });
    return list;
}

window.openRedPacketModal = openRedPacketModal;
window.closeRedPacketModal = closeRedPacketModal;
window.updatePayDraftAmount = updatePayDraftAmount;
window.updatePayDraftGreeting = updatePayDraftGreeting;
window.confirmSendRedPacket = confirmSendRedPacket;
window.openTransferDetailPage = openTransferDetailPage;
window.closeTransferDetailPage = closeTransferDetailPage;
window.userRefundTransferToRole = userRefundTransferToRole;
window.openWalletFromTransferDetail = openWalletFromTransferDetail;
window.openTransferPage = openTransferPage;
window.closeTransferPage = closeTransferPage;
window.updateTransferDraftAmount = updateTransferDraftAmount;
window.updateTransferDraftNote = updateTransferDraftNote;
window.onTransferNoteFocus = onTransferNoteFocus;
window.saveTransferDraftNoteFromEl = saveTransferDraftNoteFromEl;
window.confirmTransferFromPage = confirmTransferFromPage;
window.onPaymentCardClick = onPaymentCardClick;
window.onRedPacketSealClick = onRedPacketSealClick;
window.closeRedPacketDetailPage = closeRedPacketDetailPage;
window.userAcceptTransferFromRole = userAcceptTransferFromRole;
window.userRejectTransferFromRole = userRejectTransferFromRole;
window.roleExecutePaymentOp = roleExecutePaymentOp;
window.sweepExpiredPayments = sweepExpiredPayments;
window.sweepAllChatsExpiredPayments = sweepAllChatsExpiredPayments;
window.isPaymentMessage = isPaymentMessage;
window.isPaymentPending = isPaymentPending;
window.canUserRefundIncomingTransfer = canUserRefundIncomingTransfer;

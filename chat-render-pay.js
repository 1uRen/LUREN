// chat-render-pay module
function escapePayHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildRedPacketEnvelopeMarkup(options = {}) {
    const {
        greeting = '恭喜发财',
        sealText = '開',
        footerText = '',
        done = false,
        clickable = false,
        overlay = false,
        phaseClass = '',
        onCardClick = '',
        interactiveSeal = false,
        onSealClick = 'onRedPacketSealClick()'
    } = options;
    const greetingHtml = escapePayHtml(greeting);
    const sealHtml = escapePayHtml(sealText);
    const footerHtml = footerText ? escapePayHtml(footerText) : '';
    const cardClass = [
        'pay-card-redpacket',
        'pay-card-qq-envelope',
        done ? 'pay-card-done' : '',
        clickable ? 'pay-card-clickable' : '',
        overlay ? 'pay-card-qq-envelope-overlay' : '',
        phaseClass
    ].filter(Boolean).join(' ');
    const cardOnclick = clickable && onCardClick
        ? ` onclick="event.stopPropagation(); ${onCardClick}"`
        : '';
    const sealMarkup = interactiveSeal
        ? `<button type="button" class="rp-open-btn rp-open-btn-interactive" onclick="event.stopPropagation(); ${onSealClick}">${sealHtml}</button>`
        : `<div class="rp-open-btn" aria-hidden="true">${sealHtml}</div>`;
    return `
        <div class="${cardClass}"${cardOnclick}>
            <div class="rp-envelope-inner">
                <div class="rp-envelope-top">
                    <div class="rp-houndstooth" aria-hidden="true"></div>
                    <div class="rp-greeting">${greetingHtml}</div>
                </div>
                <div class="rp-curve" aria-hidden="true"></div>
                <div class="rp-envelope-bottom">
                    ${footerHtml ? `<span class="rp-footer-label">${footerHtml}</span>` : ''}
                </div>
                ${sealMarkup}
            </div>
        </div>
    `;
}

function getRedPacketFlowContext() {
    if (!state.redPacketOpenId) return null;
    const chat = typeof getActiveChat === 'function'
        ? getActiveChat()
        : getChatByContactId(state.currentChatContact?.qqId);
    const msg = chat?.messages?.find(m => m?.paymentId === state.redPacketOpenId);
    if (!msg) return null;
    return { msg, chat, contact: state.currentChatContact };
}

function renderRedPacketDetailPage(ctx) {
    const { msg, contact } = ctx;
    const roleName = escapePayHtml(typeof getRoleDisplayName === 'function'
        ? getRoleDisplayName(contact)
        : (contact?.remark || contact?.name || '好友'));
    const roleAvatar = escapePayHtml(contact?.avatar || DEFAULT_CONTACT_AVATAR);
    const userName = escapePayHtml(typeof getUserDisplayName === 'function' ? getUserDisplayName() : '你');
    const userAvatar = escapePayHtml(state.currentUser?.avatar || DEFAULT_CONTACT_AVATAR);
    const amount = Number(msg.amount || 0);
    const amountStr = amount.toFixed(2);
    const greeting = escapePayHtml(msg.greeting || '恭喜发财');
    const claimTime = escapePayHtml(msg.claimedTime || (typeof getPayTimeString === 'function' ? getPayTimeString() : ''));
    return `
        <div class="redpacket-detail-page">
            <div class="redpacket-detail-header">
                <div class="redpacket-detail-header-bg" aria-hidden="true">
                    <div class="rp-houndstooth"></div>
                </div>
                <button type="button" class="redpacket-detail-back" aria-label="返回" onclick="event.stopPropagation(); closeRedPacketDetailPage()">‹</button>
                <div class="redpacket-detail-title">QQ红包</div>
                <div class="redpacket-detail-header-link">红包记录</div>
            </div>
            <div class="redpacket-detail-body">
                <div class="redpacket-detail-summary">
                    <div class="redpacket-detail-sender">
                        <img class="redpacket-detail-sender-avatar" src="${roleAvatar}" alt="">
                        <div class="redpacket-detail-sender-meta">
                            <div class="redpacket-detail-sender-name">${roleName}的红包</div>
                            <div class="redpacket-detail-sender-greeting">${greeting}</div>
                        </div>
                    </div>
                    <div class="redpacket-detail-amount"><span class="redpacket-detail-yen">¥</span>${amountStr}</div>
                    <div class="redpacket-detail-balance-tip">收到的红包已存入余额 ›</div>
                </div>
                <div class="redpacket-detail-divider"></div>
                <div class="redpacket-detail-list-head">1 个红包，已领完，共 ${amountStr} 元</div>
                <div class="redpacket-detail-list">
                    <div class="redpacket-detail-list-item">
                        <img class="redpacket-detail-item-avatar" src="${userAvatar}" alt="">
                        <div class="redpacket-detail-item-main">
                            <div class="redpacket-detail-item-name">${userName}</div>
                            <div class="redpacket-detail-item-time">${claimTime}</div>
                        </div>
                        <div class="redpacket-detail-item-amount">${amountStr} 元</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderRedPacketFlowOverlay() {
    const ctx = getRedPacketFlowContext();
    if (!ctx) return '';
    const phase = state.redPacketAnimPhase || 'cover';
    const phaseClass = phase === 'spin' ? 'rp-seal-spinning' : (phase === 'opening' ? 'rp-envelope-opening' : '');
    const showBackdrop = phase !== 'detail';
    const flowClass = ['redpacket-flow', 'show', phase === 'detail' ? 'rp-phase-detail' : ''].filter(Boolean).join(' ');
    const backdropHtml = showBackdrop ? `
        <div class="redpacket-flow-backdrop">
            ${buildRedPacketEnvelopeMarkup({
                greeting: ctx.msg.greeting,
                sealText: '開',
                overlay: true,
                phaseClass,
                interactiveSeal: phase === 'cover' || phase === 'spin',
                onSealClick: 'onRedPacketSealClick()'
            })}
        </div>
    ` : '';
    const detailHtml = phase === 'detail' ? renderRedPacketDetailPage(ctx) : '';
    return `<div class="${flowClass}">${backdropHtml}${detailHtml}</div>`;
}

function renderPaymentCard(msg, messageIndex) {
    if (!msg || !msg.paymentType) return '';
    const pending = typeof isPaymentPending === 'function' && isPaymentPending(msg);
    const expired = msg.status === 'expired';
    const claimed = msg.status === 'claimed';
    const rejected = msg.status === 'rejected';
    const refunded = msg.status === 'refunded';
    const done = claimed || rejected || expired || refunded;

    if (msg.paymentType === 'redPacket') {
        const footerText = claimed ? '已领取' : (expired ? '已过期' : '');
        const clickable = !state.messageSelectMode && !msg.isMine && pending;
        const sealText = clickable ? '開' : (claimed ? '领' : (expired ? '期' : (msg.isMine ? '封' : '開')));
        return buildRedPacketEnvelopeMarkup({
            greeting: msg.greeting || '恭喜发财',
            sealText,
            footerText,
            done,
            clickable,
            onCardClick: clickable ? `onPaymentCardClick(${messageIndex})` : ''
        });
    }

    if (msg.paymentType === 'transfer') {
        let footerText = '';
        if (msg.isMine) {
            if (claimed) footerText = '对方已收款';
            else if (rejected) footerText = '对方已拒收';
            else if (expired) footerText = '转账已过期';
            else if (msg.status === 'refunded') footerText = '已退还';
            else footerText = '待对方接收';
        } else {
            if (msg.status === 'refunded') footerText = '已退还';
            else if (claimed) footerText = '已收款';
            else if (rejected) footerText = '已拒收';
            else if (expired) footerText = '已过期';
            else footerText = '待收款';
        }
        const noteText = escapePayHtml(msg.note || '转账');
        const clickable = !state.messageSelectMode && !msg.isMine && (pending || msg.status === 'claimed' || msg.status === 'refunded');
        return `
            <div class="pay-card-transfer ${done ? 'pay-card-done' : ''} ${clickable ? 'pay-card-clickable' : ''}"
                ${clickable ? `onclick="event.stopPropagation(); onPaymentCardClick(${messageIndex})"` : ''}>
                <div class="pay-card-transfer-main">
                    <div class="pay-card-icon pay-card-icon-transfer"></div>
                    <div class="pay-card-body">
                        <div class="pay-card-title">¥${Number(msg.amount || 0).toFixed(2)}</div>
                        <div class="pay-card-sub">${noteText}</div>
                    </div>
                </div>
                <div class="pay-card-transfer-footer">${footerText}</div>
            </div>
        `;
    }
    return '';
}

function renderTransferPage() {
    const contact = state.currentChatContact;
    if (!contact) return '<div class="transfer-page"><div class="empty-state-text">请先选择聊天</div></div>';
    const avatar = contact.avatar || DEFAULT_CONTACT_AVATAR;
    const name = escapePayHtml(contact.remark || contact.name || '好友');
    const qqId = escapePayHtml(contact.qqId || '');
    const amount = escapePayHtml(state.transferDraftAmount || '');
    const noteRaw = (state.transferDraftNote || '').trim();
    const noteDisplay = noteRaw ? escapePayHtml(noteRaw) : '添加转账留言（选填）';

    return `
        <div class="transfer-page">
            <div class="transfer-recipient">
                <img class="transfer-recipient-avatar" src="${avatar}" alt="">
                <div class="transfer-recipient-name">转账给 ${name}</div>
                <div class="transfer-recipient-qq">QQ号 ${qqId}</div>
            </div>
            <div class="transfer-form">
                <div class="transfer-field-label">转账金额</div>
                <div class="transfer-amount-row">
                    <span class="transfer-currency">￥</span>
                    <input type="number" class="transfer-amount-input" id="transferAmountInput" placeholder="0.00"
                        value="${amount}" step="0.01" min="0.01"
                        oninput="updateTransferDraftAmount(this.value)">
                </div>
                <div class="transfer-note-editable"
                    contenteditable="true"
                    spellcheck="false"
                    onfocus="onTransferNoteFocus(this)"
                    onblur="saveTransferDraftNoteFromEl(this)">${noteDisplay}</div>
                <button type="button" class="transfer-submit-btn" onclick="confirmTransferFromPage()">转账</button>
            </div>
        </div>
    `;
}

function renderRedPacketModal() {
    if (!state.showRedPacketModal) return '';
    const amount = escapePayHtml(state.payDraftAmount || '');
    const greeting = escapePayHtml(state.payDraftGreeting || '');
    return `
        <div class="chat-modal show" onclick="closeRedPacketModal()">
            <div class="modal-content pay-modal-content" onclick="event.stopPropagation()">
                <div class="modal-title">发红包</div>
                <div class="pay-modal-field">
                    <label class="pay-modal-label">金额（元）</label>
                    <input type="number" class="mock-voice-input" id="redPacketAmountInput" placeholder="0.00"
                        value="${amount}" step="0.01" min="0.01"
                        oninput="updatePayDraftAmount(this.value)">
                </div>
                <div class="pay-modal-field">
                    <label class="pay-modal-label">祝福语</label>
                    <input type="text" class="mock-voice-input" id="redPacketGreetingInput" placeholder="恭喜发财"
                        value="${greeting}" maxlength="40"
                        oninput="updatePayDraftGreeting(this.value)">
                </div>
                <button class="modal-btn primary pay-modal-send" onclick="confirmSendRedPacket()">塞钱进红包</button>
                <button class="modal-cancel-link" onclick="closeRedPacketModal()">取消</button>
            </div>
        </div>
    `;
}

function renderRedPacketOpenOverlay() {
    return renderRedPacketFlowOverlay();
}

function getTransferDetailContext() {
    if (!state.transferDetailId) return null;
    const chat = typeof getActiveChat === 'function'
        ? getActiveChat()
        : getChatByContactId(state.currentChatContact?.qqId);
    const msg = chat?.messages?.find(m => m?.paymentId === state.transferDetailId);
    if (!msg) return null;
    return { msg, chat, contact: state.currentChatContact };
}

function renderTransferDetailOverlay() {
    const ctx = getTransferDetailContext();
    if (!ctx) return '';
    const { msg } = ctx;
    const amount = Number(msg.amount || 0);
    const amountStr = amount.toFixed(2);
    const note = escapePayHtml(msg.note || 'QQ转账');
    const transferTime = escapePayHtml(
        typeof formatTransferDetailTime === 'function'
            ? formatTransferDetailTime(msg.claimedAt || msg.createdAt)
            : ''
    );
    const paymentId = escapePayHtml(msg.paymentId);
    const canRefund = typeof canUserRefundIncomingTransfer === 'function'
        ? canUserRefundIncomingTransfer(msg)
        : (msg.status === 'claimed' && !msg.refunded);
    const statusText = msg.status === 'refunded'
        ? '你已退还此转账'
        : '你已收款，资金已存入钱包余额';
    const checkIcon = escapePayHtml(typeof ADD_FRIEND_CHECK_ICON !== 'undefined'
        ? ADD_FRIEND_CHECK_ICON
        : 'https://img.heliar.top/file/1779458304685_check-fill.svg');
    return `
        <div class="transfer-detail-flow show">
            <div class="transfer-detail-page">
                <div class="transfer-detail-header">
                    <button type="button" class="transfer-detail-back" aria-label="返回" onclick="event.stopPropagation(); closeTransferDetailPage()">‹</button>
                    <div class="transfer-detail-title">交易详情</div>
                </div>
                <div class="transfer-detail-body">
                    <div class="transfer-detail-status-block">
                        <div class="transfer-detail-check" aria-hidden="true">
                            <span class="transfer-detail-check-icon" style="--icon-url:url('${checkIcon}')"></span>
                        </div>
                        <div class="transfer-detail-status-text">${statusText}</div>
                        <div class="transfer-detail-amount"><span class="transfer-detail-yen">¥</span> ${amountStr}</div>
                        <button type="button" class="transfer-detail-balance-link" onclick="openWalletFromTransferDetail()">查看余额</button>
                    </div>
                    <div class="transfer-detail-info">
                        <div class="transfer-detail-info-row">
                            <span class="transfer-detail-info-label">转账留言</span>
                            <span class="transfer-detail-info-value">${note}</span>
                        </div>
                        <div class="transfer-detail-info-row">
                            <span class="transfer-detail-info-label">转账时间</span>
                            <span class="transfer-detail-info-value">${transferTime}</span>
                        </div>
                    </div>
                    ${canRefund ? `
                        <button type="button" class="transfer-detail-refund-link" onclick="userRefundTransferToRole('${paymentId}')">退还转账</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

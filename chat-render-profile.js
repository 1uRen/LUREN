// chat-render-profile module
function renderProfilePage() {
    const contact = state.currentProfileContact;
    if (!contact) return '';

    const remark = contact.remark || contact.name;
    const birthday = contact.birthday || '--';
    const constellation = contact.constellation || (contact.birthday ? getConstellation(contact.birthday) : '--');
    const signature = contact.signature || '';
    const themeProfileBg = typeof getActiveThemeBackgrounds === 'function'
        ? getActiveThemeBackgrounds().profileBg
        : DEFAULT_PROFILE_BG;
    const bgImage = contact.bgImage || themeProfileBg || DEFAULT_PROFILE_BG;

    return `
        <div class="profile-page">
            <div class="profile-back-btn" onclick="closeProfilePage()">‹</div>
            <div class="profile-bg" style="${bgImage ? `background-image: url('${bgImage}');` : ''}" onclick="openChangeProfileBgModal()"></div>
            <div class="profile-card">
                <div class="profile-avatar-section">
                    <img class="profile-avatar" src="${contact.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23ffffff%22/%3E%3C/svg%3E'}">
                    <div class="profile-name-section">
                        <div class="profile-remark">${remark}</div>
                        <div class="profile-nick-qq">${contact.name} · ${contact.qqId}</div>
                    </div>
                    <div class="profile-like-section"
                         onclick="likeContact(${state.currentProfileContactIndex})"
                         onmousedown="startLikeLongPress(${state.currentProfileContactIndex})"
                         onmouseup="cancelLikeLongPress()"
                         onmouseleave="cancelLikeLongPress()"
                         ontouchstart="startLikeLongPress(${state.currentProfileContactIndex})"
                         ontouchend="cancelLikeLongPress()">
                        <span class="like-icon-svg" style="--icon-url:url('${state.likeIconPressed ? LIKE_ICON_FILLED : LIKE_ICON_OUTLINE}')"></span>
                        <div class="like-count">${contact.likes || 0}</div>
                    </div>
                </div>

                <div class="profile-info-grid">
                    <div class="profile-info-item"><div class="profile-info-value">${contact.gender || '--'}</div></div>
                    <div class="profile-info-item"><div class="profile-info-value">${birthday}</div></div>
                    <div class="profile-info-item"><div class="profile-info-value">${constellation}</div></div>
                </div>

                <div class="profile-level"><div class="profile-info-value">🌙🌙⭐</div></div>
                <div class="profile-signature">
                    <div class="profile-signature-text" contenteditable="true" onblur="saveProfileSignature(this)">
                        ${signature || '编辑个性签名'}
                    </div>
                    <div class="profile-signature-arrow" onclick="openSignatureHistory()">›</div>
                </div>
                <div class="profile-zone-divider"></div>
                <div class="profile-zone">
                    <div class="profile-zone-title">QQ空间</div>
                    <div class="profile-zone-empty">暂无动态</div>
                </div>
            </div>
            <div class="profile-bottom-actions">
                <button class="profile-action-btn secondary">
                    <span class="profile-action-label">
                        <span class="profile-action-icon" style="--icon-url:url('${PROFILE_SURPRISE_CHECK_ICON}')"></span>
                        <span class="profile-action-label-text">突击检查</span>
                    </span>
                </button>
                <button class="profile-action-btn secondary"><span class="profile-action-caption">音视频</span></button>
                <button class="profile-action-btn primary" onclick="openChatFromProfile()"><span class="profile-action-caption">发消息</span></button>
            </div>
        </div>
    `;
}

function renderSignatureHistoryPage() {
    const contact = state.currentProfileContact;
    if (!contact) return '';
    const history = contact.signatureHistory || [];

    return `
        <div class="signature-history-page">
            <div class="signature-history-header">
                <span class="signature-history-close" onclick="closeSignatureHistory()">‹</span>
                <span class="signature-history-title">历史个签</span>
                <span class="header-spacer-36"></span>
            </div>
            <div class="signature-history-list">
                ${history.length > 0 ? history.map(item => `
                    <div class="signature-history-item">
                        <div class="signature-history-text">${item.text}</div>
                        <div class="signature-history-time">${item.time}</div>
                    </div>
                `).join('') : '<div class="signature-history-empty">暂无个签</div>'}
            </div>
        </div>
    `;
}

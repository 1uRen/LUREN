(function () {
    'use strict';

    var DEFAULT_FORUM_IMAGES = [
        './assets/home/forum-default-1.png',
        './assets/home/forum-default-2.png',
        './assets/home/forum-default-3.png'
    ];
    var DEFAULT_WIDGET_TITLE = '输入太多会被隐藏喔ヾ(•ω•`)o';
    var DEFAULT_WIDGET_AUTHOR_NAME = 'NAME';

    var homeImageEditSlot = 0;
    var homeImageEditMode = 'forum';
    var forumTimeTimer = null;
    var forumImagesState = null;
    var forumAvatarState = '';
    var forumFollowed = false;
    var forumAuthorNameState = '';
    var forumAuthorFansState = 0;
    var forumReactionState = 'none';
    var forumCommentAvatarState = '';

    function resetForumImagesState(images) {
        forumImagesState = (images && images.length === 3)
            ? images.slice()
            : DEFAULT_FORUM_IMAGES.slice();
        return forumImagesState;
    }

    function getForumImagesState() {
        if (!forumImagesState || forumImagesState.length !== 3) {
            resetForumImagesState(loadForumImages());
        }
        return forumImagesState.slice();
    }

    function loadForumImages() {
        if (typeof loadHomeForumImages === 'function') {
            return loadHomeForumImages();
        }
        return DEFAULT_FORUM_IMAGES.slice();
    }

    function saveForumImages(images) {
        if (typeof saveHomeForumImages === 'function') {
            return saveHomeForumImages(images);
        }
        return false;
    }

    function getForumImageElements() {
        return [
            document.getElementById('forumImage0'),
            document.getElementById('forumImage1'),
            document.getElementById('forumImage2')
        ];
    }

    function normalizeImageSrc(url) {
        return String(url || '').trim();
    }

    function applyForumImages(images) {
        var imgs = images && images.length === 3 ? images : DEFAULT_FORUM_IMAGES;
        getForumImageElements().forEach(function (el, i) {
            if (el && imgs[i]) {
                var next = normalizeImageSrc(imgs[i]);
                if (normalizeImageSrc(el.src) !== next) {
                    el.src = next;
                }
            }
        });
    }

    function getTitleElements() {
        return {
            wrap: document.getElementById('forumWidgetTitleWrap'),
            display: document.getElementById('forumWidgetTitleDisplay'),
            input: document.getElementById('forumWidgetTitle')
        };
    }

    function normalizeTitleText(text) {
        return String(text || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function syncTitleDisplay(text) {
        var els = getTitleElements();
        var value = normalizeTitleText(text) || DEFAULT_WIDGET_TITLE;
        if (els.display) {
            els.display.textContent = value;
        }
        return value;
    }

    function applyWidgetTitle(title) {
        var els = getTitleElements();
        var value = title || DEFAULT_WIDGET_TITLE;
        syncTitleDisplay(value);
        if (els.input && document.activeElement !== els.input) {
            els.input.textContent = value;
        }
    }

    function saveWidgetTitleFromDom() {
        var els = getTitleElements();
        if (!els.input) return;
        var text = normalizeTitleText(els.input.textContent) || DEFAULT_WIDGET_TITLE;
        els.input.textContent = text;
        syncTitleDisplay(text);
        if (typeof saveHomeWidgetTitle === 'function') {
            saveHomeWidgetTitle(text);
        }
    }

    function startWidgetTitleEdit() {
        var els = getTitleElements();
        if (!els.wrap || !els.input || !els.display) return;
        var current = normalizeTitleText(els.display.textContent) || DEFAULT_WIDGET_TITLE;
        els.input.textContent = current;
        els.wrap.classList.add('is-editing');
        els.input.focus();
        if (current === DEFAULT_WIDGET_TITLE) {
            window.getSelection().selectAllChildren(els.input);
        }
    }

    function finishWidgetTitleEdit() {
        var els = getTitleElements();
        if (!els.wrap) return;
        saveWidgetTitleFromDom();
        els.wrap.classList.remove('is-editing');
    }

    function loadWidgetTitle() {
        if (typeof loadHomeWidgetTitle === 'function') {
            return loadHomeWidgetTitle();
        }
        return DEFAULT_WIDGET_TITLE;
    }

    function bindWidgetTitleEditor() {
        var els = getTitleElements();
        if (!els.wrap || !els.input || !els.display) return;

        els.display.addEventListener('click', function (e) {
            e.stopPropagation();
            startWidgetTitleEdit();
        });

        els.input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                els.input.blur();
            }
        });

        els.input.addEventListener('paste', function (e) {
            e.preventDefault();
            var text = (e.clipboardData || window.clipboardData).getData('text');
            text = normalizeTitleText(text);
            document.execCommand('insertText', false, text);
        });

        els.input.addEventListener('input', function () {
            var text = normalizeTitleText(els.input.textContent);
            if (els.input.textContent !== text) {
                els.input.textContent = text;
                var range = document.createRange();
                var sel = window.getSelection();
                range.selectNodeContents(els.input);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            syncTitleDisplay(text);
            if (typeof saveHomeWidgetTitle === 'function') {
                saveHomeWidgetTitle(text || DEFAULT_WIDGET_TITLE);
            }
        });

        els.input.addEventListener('blur', finishWidgetTitleEdit);
    }

    function getAuthorNameElements() {
        return {
            wrap: document.getElementById('forumAuthorNameWrap'),
            display: document.getElementById('forumAuthorNameDisplay'),
            input: document.getElementById('forumAuthorName')
        };
    }

    function normalizeAuthorName(text) {
        return String(text || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function generateRandomFanCount() {
        return Math.floor(Math.random() * (9990000 - 10000 + 1)) + 10000;
    }

    function formatFanCount(count) {
        var n = Math.max(10000, Math.floor(Number(count) || 0));
        var wan = n / 10000;
        if (wan >= 100) {
            return Math.floor(wan) + '万粉丝';
        }
        return wan.toFixed(1).replace(/\.0$/, '') + '万粉丝';
    }

    function applyWidgetAuthorFans(count) {
        forumAuthorFansState = Math.max(10000, Math.floor(Number(count) || 0));
        var el = document.getElementById('forumAuthorFansDisplay');
        if (el) {
            el.textContent = formatFanCount(forumAuthorFansState);
        }
    }

    function randomizeWidgetAuthorFans() {
        var fans = generateRandomFanCount();
        applyWidgetAuthorFans(fans);
        if (typeof saveHomeWidgetAuthorFans === 'function') {
            saveHomeWidgetAuthorFans(fans);
        }
    }

    function loadWidgetAuthorFans() {
        if (typeof loadHomeWidgetAuthorFans === 'function') {
            return loadHomeWidgetAuthorFans();
        }
        return null;
    }

    function commitWidgetAuthorName(text) {
        var value = normalizeAuthorName(text) || DEFAULT_WIDGET_AUTHOR_NAME;
        var prev = forumAuthorNameState || loadWidgetAuthorName();
        forumAuthorNameState = value;
        syncAuthorNameDisplay(value);
        if (typeof saveHomeWidgetAuthorName === 'function') {
            saveHomeWidgetAuthorName(value);
        }
        if (value !== prev) {
            randomizeWidgetAuthorFans();
        }
        return value;
    }

    function syncAuthorNameDisplay(text) {
        var els = getAuthorNameElements();
        var value = normalizeAuthorName(text) || DEFAULT_WIDGET_AUTHOR_NAME;
        if (els.display) {
            els.display.textContent = value;
        }
        return value;
    }

    function applyWidgetAuthorName(name) {
        var els = getAuthorNameElements();
        var value = name || DEFAULT_WIDGET_AUTHOR_NAME;
        syncAuthorNameDisplay(value);
        if (els.input && document.activeElement !== els.input) {
            els.input.textContent = value;
        }
    }

    function saveWidgetAuthorNameFromDom() {
        var els = getAuthorNameElements();
        if (!els.input) return;
        var text = commitWidgetAuthorName(els.input.textContent);
        els.input.textContent = text;
    }

    function startWidgetAuthorNameEdit() {
        var els = getAuthorNameElements();
        if (!els.wrap || !els.input || !els.display) return;
        var current = normalizeAuthorName(els.display.textContent) || DEFAULT_WIDGET_AUTHOR_NAME;
        els.input.textContent = current;
        els.wrap.classList.add('is-editing');
        els.input.focus();
        if (current === DEFAULT_WIDGET_AUTHOR_NAME) {
            window.getSelection().selectAllChildren(els.input);
        }
    }

    function finishWidgetAuthorNameEdit() {
        var els = getAuthorNameElements();
        if (!els.wrap) return;
        saveWidgetAuthorNameFromDom();
        els.wrap.classList.remove('is-editing');
    }

    function loadWidgetAuthorName() {
        if (typeof loadHomeWidgetAuthorName === 'function') {
            return loadHomeWidgetAuthorName();
        }
        return DEFAULT_WIDGET_AUTHOR_NAME;
    }

    function bindWidgetAuthorNameEditor() {
        var els = getAuthorNameElements();
        if (!els.wrap || !els.input || !els.display) return;

        els.display.addEventListener('click', function (e) {
            e.stopPropagation();
            startWidgetAuthorNameEdit();
        });

        els.input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                els.input.blur();
            }
        });

        els.input.addEventListener('paste', function (e) {
            e.preventDefault();
            var text = normalizeAuthorName((e.clipboardData || window.clipboardData).getData('text'));
            document.execCommand('insertText', false, text);
        });

        els.input.addEventListener('input', function () {
            var text = normalizeAuthorName(els.input.textContent);
            if (els.input.textContent !== text) {
                els.input.textContent = text;
                var range = document.createRange();
                var sel = window.getSelection();
                range.selectNodeContents(els.input);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            syncAuthorNameDisplay(text);
            commitWidgetAuthorName(text);
        });

        els.input.addEventListener('blur', finishWidgetAuthorNameEdit);
    }

    function loadWidgetAvatar() {
        if (typeof loadHomeWidgetAvatar === 'function') {
            return loadHomeWidgetAvatar();
        }
        return '';
    }

    function applyWidgetAvatar(url) {
        forumAvatarState = String(url || '');
        var img = document.getElementById('forumAuthorAvatar');
        var btn = document.getElementById('forumAuthorAvatarBtn');
        if (!img || !btn) return;
        if (forumAvatarState) {
            img.src = forumAvatarState;
            btn.classList.remove('is-empty');
        } else {
            img.removeAttribute('src');
            btn.classList.add('is-empty');
        }
    }

    function saveWidgetAvatar(url) {
        forumAvatarState = String(url || '');
        if (typeof saveHomeWidgetAvatar === 'function') {
            return saveHomeWidgetAvatar(forumAvatarState);
        }
        return false;
    }

    function formatWanLabel(count, suffix) {
        var n = Math.max(10000, Math.floor(Number(count) || 0));
        var wan = n / 10000;
        if (wan >= 100) {
            return Math.floor(wan) + '万' + suffix;
        }
        return wan.toFixed(1).replace(/\.0$/, '') + '万' + suffix;
    }

    function applyReactionState(state) {
        forumReactionState = state === 'like' || state === 'dislike' ? state : 'none';
        var likeBtn = document.getElementById('forumLikeBtn');
        var dislikeBtn = document.getElementById('forumDislikeBtn');
        if (likeBtn) {
            likeBtn.classList.toggle('is-active', forumReactionState === 'like');
        }
        if (dislikeBtn) {
            dislikeBtn.classList.toggle('is-active', forumReactionState === 'dislike');
        }
    }

    function saveReactionState() {
        if (typeof saveHomeWidgetReaction === 'function') {
            saveHomeWidgetReaction(forumReactionState);
        }
    }

    function loadReactionState() {
        if (typeof loadHomeWidgetReaction === 'function') {
            return loadHomeWidgetReaction();
        }
        return 'none';
    }

    function toggleLikeReaction() {
        forumReactionState = forumReactionState === 'like' ? 'none' : 'like';
        applyReactionState(forumReactionState);
        saveReactionState();
    }

    function toggleDislikeReaction() {
        forumReactionState = forumReactionState === 'dislike' ? 'none' : 'dislike';
        applyReactionState(forumReactionState);
        saveReactionState();
    }

    function bindReactionButtons() {
        var likeBtn = document.getElementById('forumLikeBtn');
        var dislikeBtn = document.getElementById('forumDislikeBtn');
        if (likeBtn) {
            likeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleLikeReaction();
            });
        }
        if (dislikeBtn) {
            dislikeBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleDislikeReaction();
            });
        }
    }

    function applyCommentAvatar(url) {
        forumCommentAvatarState = String(url || '');
        var img = document.getElementById('forumCommentAvatar');
        var btn = document.getElementById('forumCommentAvatarBtn');
        if (img) {
            if (forumCommentAvatarState) {
                img.src = forumCommentAvatarState;
            } else {
                img.removeAttribute('src');
            }
        }
        if (btn) {
            if (forumCommentAvatarState) {
                btn.classList.remove('is-empty');
            } else {
                btn.classList.add('is-empty');
            }
        }
    }

    function saveCommentAvatar(url) {
        forumCommentAvatarState = String(url || '');
        if (typeof saveHomeWidgetCommentAvatar === 'function') {
            return saveHomeWidgetCommentAvatar(forumCommentAvatarState);
        }
        return false;
    }

    function loadCommentAvatar() {
        if (typeof loadHomeWidgetCommentAvatar === 'function') {
            return loadHomeWidgetCommentAvatar();
        }
        return '';
    }

    function openHomeCommentAvatarModal() {
        homeImageEditMode = 'commentAvatar';
        var modal = document.getElementById('homeUploadModal');
        updateHomeModalCopy();
        if (modal) modal.classList.add('active');
    }

    function bindCommentDraftEditor() {
        var draft = document.getElementById('forumCommentDraft');
        if (!draft) return;

        function persistDraft() {
            if (typeof saveHomeWidgetCommentDraft === 'function') {
                saveHomeWidgetCommentDraft(draft.textContent || '');
            }
        }

        draft.addEventListener('input', persistDraft);
        draft.addEventListener('blur', persistDraft);
    }

    function loadCommentDraft() {
        if (typeof loadHomeWidgetCommentDraft === 'function') {
            return loadHomeWidgetCommentDraft();
        }
        return '';
    }

    function applyHomeModalSelection(url) {
        if (homeImageEditMode === 'avatar') {
            applyWidgetAvatar(url);
            if (!saveWidgetAvatar(url)) {
                console.warn('小组件头像保存失败，当前修改可能无法持久化');
            }
            return;
        }
        if (homeImageEditMode === 'commentAvatar') {
            applyCommentAvatar(url);
            if (!saveCommentAvatar(url)) {
                console.warn('评论头像保存失败，当前修改可能无法持久化');
            }
            return;
        }
        applyImageToSlot(url);
    }

    function restoreHomeModalDefault() {
        if (homeImageEditMode === 'avatar') {
            applyWidgetAvatar('');
            saveWidgetAvatar('');
            closeHomeModal();
            return;
        }
        if (homeImageEditMode === 'commentAvatar') {
            applyCommentAvatar('');
            saveCommentAvatar('');
            closeHomeModal();
            return;
        }
        applyImageToSlot(DEFAULT_FORUM_IMAGES[homeImageEditSlot]);
        closeHomeModal();
    }

    function updateHomeModalCopy() {
        var modal = document.getElementById('homeUploadModal');
        var title = modal ? modal.querySelector('.home-modal-title') : null;
        var sub = document.getElementById('homeModalSub');
        if (homeImageEditMode === 'avatar') {
            if (title) title.textContent = '更换头像';
            if (sub) sub.textContent = '正在更换作者头像';
            return;
        }
        if (homeImageEditMode === 'commentAvatar') {
            if (title) title.textContent = '更换评论头像';
            if (sub) sub.textContent = '正在更换评论头像';
            return;
        }
        if (title) title.textContent = '更换 Widget 图片';
        if (sub) sub.textContent = '正在更换第 ' + (homeImageEditSlot + 1) + ' 张图片';
    }

    function applyFollowState(followed) {
        forumFollowed = !!followed;
        var btn = document.getElementById('forumFollowBtn');
        if (!btn) return;
        btn.textContent = forumFollowed ? '已关注' : '关注';
        btn.classList.toggle('is-followed', forumFollowed);
    }

    function toggleFollowState() {
        applyFollowState(!forumFollowed);
        if (typeof saveHomeWidgetFollowed === 'function') {
            saveHomeWidgetFollowed(forumFollowed);
        }
    }

    function loadFollowState() {
        if (typeof loadHomeWidgetFollowed === 'function') {
            return loadHomeWidgetFollowed();
        }
        return false;
    }

    function bindFollowButton() {
        var btn = document.getElementById('forumFollowBtn');
        if (!btn) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleFollowState();
        });
    }

    function updateForumTime() {
        var el = document.getElementById('forumTime');
        if (!el) return;
        var now = new Date();
        var h = String(now.getHours()).padStart(2, '0');
        var m = String(now.getMinutes()).padStart(2, '0');
        el.textContent = h + ':' + m;
    }

    function startForumTimeClock() {
        updateForumTime();
        if (forumTimeTimer) return;
        forumTimeTimer = window.setInterval(updateForumTime, 1000);
    }

    function handleHomeAppClick(name) {
        if (name === 'CHAT') {
            if (typeof initChatApp === 'function') initChatApp();
            return;
        }
        if (name === '设置') {
            if (typeof initSettingsApp === 'function') initSettingsApp();
            return;
        }
        window.alert(name + '功能正在开发中');
    }

    function openHomeImageModal(slot) {
        homeImageEditMode = 'forum';
        homeImageEditSlot = slot;
        var modal = document.getElementById('homeUploadModal');
        updateHomeModalCopy();
        if (modal) modal.classList.add('active');
    }

    function openHomeAvatarModal() {
        homeImageEditMode = 'avatar';
        var modal = document.getElementById('homeUploadModal');
        updateHomeModalCopy();
        if (modal) modal.classList.add('active');
    }

    function closeHomeModal() {
        var modal = document.getElementById('homeUploadModal');
        if (modal) modal.classList.remove('active');
        var urlWrap = document.getElementById('homeUrlInputWrap');
        if (urlWrap) urlWrap.classList.remove('active');
        var urlInput = document.getElementById('homeUrlInput');
        if (urlInput) urlInput.value = '';
    }

    function toggleHomeUrlInput() {
        var wrap = document.getElementById('homeUrlInputWrap');
        if (wrap) wrap.classList.toggle('active');
    }

    function uploadHomeFromFile() {
        var input = document.getElementById('homeFileInput');
        if (input) input.click();
    }

    function applyImageToSlot(url) {
        var imgs = getForumImagesState();
        imgs[homeImageEditSlot] = url;
        resetForumImagesState(imgs);
        if (!saveForumImages(imgs)) {
            console.warn('论坛图片保存失败，当前修改可能无法持久化');
        }
        applyForumImages(imgs);
    }

    function restoreDefaultForumImage() {
        restoreHomeModalDefault();
    }

    function uploadHomeFromUrl() {
        var input = document.getElementById('homeUrlInput');
        var url = input ? input.value.trim() : '';
        if (!url) {
            window.alert('请输入有效的图片 URL');
            return;
        }
        applyHomeModalSelection(url);
        closeHomeModal();
    }

    function bindHomeEvents() {
        var fileInput = document.getElementById('homeFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (event) {
                    applyHomeModalSelection(event.target.result);
                    closeHomeModal();
                    fileInput.value = '';
                };
                reader.readAsDataURL(file);
            });
        }

        var modal = document.getElementById('homeUploadModal');
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeHomeModal();
            });
        }
    }

    function initHomeScreen() {
        if (!document.body.classList.contains('mode-home')) return;
        resetForumImagesState(loadForumImages());
        applyForumImages(forumImagesState);
        applyWidgetTitle(loadWidgetTitle());
        forumAvatarState = loadWidgetAvatar();
        applyWidgetAvatar(forumAvatarState);
        forumAuthorNameState = loadWidgetAuthorName();
        applyWidgetAuthorName(forumAuthorNameState);
        var fans = loadWidgetAuthorFans();
        if (!fans) {
            randomizeWidgetAuthorFans();
        } else {
            applyWidgetAuthorFans(fans);
        }
        applyFollowState(loadFollowState());
        applyReactionState(loadReactionState());
        forumCommentAvatarState = loadCommentAvatar();
        applyCommentAvatar(forumCommentAvatarState);
        var draftEl = document.getElementById('forumCommentDraft');
        if (draftEl) {
            draftEl.textContent = loadCommentDraft();
        }
        startForumTimeClock();
        bindHomeEvents();
        bindWidgetTitleEditor();
        bindWidgetAuthorNameEditor();
        bindFollowButton();
        bindReactionButtons();
        bindCommentDraftEditor();
        if (typeof mountStatusBar === 'function') {
            mountStatusBar();
        }
    }

    window.handleHomeAppClick = handleHomeAppClick;
    window.openHomeImageModal = openHomeImageModal;
    window.openHomeAvatarModal = openHomeAvatarModal;
    window.openHomeCommentAvatarModal = openHomeCommentAvatarModal;
    window.closeHomeModal = closeHomeModal;
    window.toggleHomeUrlInput = toggleHomeUrlInput;
    window.uploadHomeFromFile = uploadHomeFromFile;
    window.uploadHomeFromUrl = uploadHomeFromUrl;
    window.restoreDefaultForumImage = restoreDefaultForumImage;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHomeScreen);
    } else {
        initHomeScreen();
    }
})();

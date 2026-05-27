/**
 * 设备运行时：视口、安全区回退、软键盘偏移、平台/档位标记
 */
(function () {
    'use strict';

    var root = document.documentElement;
    var KB_THRESHOLD = 80;
    var ACCESSORY_INSET_ANDROID = 48;
    var offsetSamples = [];
    var settleRafId = 0;

    function detectOs() {
        var ua = navigator.userAgent || '';
        if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
        if (/Android/i.test(ua)) return 'android';
        return 'other';
    }

    function isStandalone() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            navigator.standalone === true
        );
    }

    function detectKeyboardStrategy() {
        var os = detectOs();
        var standalone = isStandalone();
        if (os === 'android' && !standalone) return 'layout-resize';
        if (os === 'ios') return 'visual-offset';
        return 'visual-offset';
    }

    function detectTier() {
        var w = window.innerWidth;
        if (w <= 375) return 'compact';
        if (w <= 430) return 'regular';
        return 'large';
    }

    function readEnvSafeInsets() {
        var probe = document.createElement('div');
        probe.style.cssText =
            'position:fixed;visibility:hidden;pointer-events:none;' +
            'padding:env(safe-area-inset-top) env(safe-area-inset-right) ' +
            'env(safe-area-inset-bottom) env(safe-area-inset-left)';
        document.documentElement.appendChild(probe);
        var cs = getComputedStyle(probe);
        var insets = {
            top: parseFloat(cs.paddingTop) || 0,
            right: parseFloat(cs.paddingRight) || 0,
            bottom: parseFloat(cs.paddingBottom) || 0,
            left: parseFloat(cs.paddingLeft) || 0
        };
        probe.remove();
        return insets;
    }

    function fallbackInsets(os, standalone) {
        if (os === 'ios') {
            return standalone
                ? { top: 47, right: 0, bottom: 34, left: 0 }
                : { top: 20, right: 0, bottom: 0, left: 0 };
        }
        if (os === 'android') {
            return standalone
                ? { top: 28, right: 0, bottom: 24, left: 0 }
                : { top: 24, right: 0, bottom: 0, left: 0 };
        }
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    function resolveInsets(env, fb) {
        return {
            top: Math.max(env.top, fb.top),
            right: Math.max(env.right, fb.right),
            bottom: Math.max(env.bottom, fb.bottom),
            left: Math.max(env.left, fb.left)
        };
    }

    function applyTierTokens(tier) {
        if (tier === 'compact') {
            root.style.setProperty('--home-time-size', 'clamp(3.25rem, 11vw, 5rem)');
            root.style.setProperty('--home-icon-size', '60px');
            root.style.setProperty('--msg-font-size', '14px');
            root.style.setProperty('--msg-sticker-size', '84px');
            root.style.setProperty('--msg-photo-w', '200px');
            root.style.setProperty('--msg-mock-w', '170px');
            root.style.setProperty('--wallet-balance-size', '32px');
        } else if (tier === 'large') {
            root.style.setProperty('--home-time-size', 'clamp(5.5rem, 14vw, 6.5rem)');
            root.style.setProperty('--home-icon-size', '70px');
            root.style.setProperty('--msg-font-size', '16px');
            root.style.setProperty('--msg-sticker-size', '100px');
            root.style.setProperty('--msg-photo-w', '260px');
            root.style.setProperty('--msg-mock-w', '190px');
            root.style.setProperty('--wallet-balance-size', '42px');
        } else {
            root.style.setProperty('--home-time-size', 'clamp(3.5rem, 12vw, 5.5rem)');
            root.style.setProperty('--home-icon-size', '68px');
            root.style.setProperty('--msg-font-size', '15px');
            root.style.setProperty('--msg-sticker-size', '92px');
            root.style.setProperty('--msg-photo-w', '220px');
            root.style.setProperty('--msg-mock-w', '190px');
            root.style.setProperty('--wallet-balance-size', '36px');
        }
    }

    function isKeyboardLikelyOpen() {
        var vv = window.visualViewport;
        if (!vv) return false;
        return window.innerHeight - vv.height - (vv.offsetTop || 0) > KB_THRESHOLD;
    }

    function resolveIosTopInset(envTop, standalone) {
        var vv = window.visualViewport;
        var vvTop = vv && vv.offsetTop > 0 ? vv.offsetTop : 0;
        var top = Math.max(envTop, vvTop);
        if (standalone) {
            if (top < 20) top = 47;
        } else if (top < 20) {
            top = 20;
        }
        return top;
    }

    function applyLayout() {
        var os = detectOs();
        var standalone = isStandalone();
        var tier = detectTier();
        var landscape = window.matchMedia('(orientation: landscape)').matches;

        root.dataset.os = os;
        root.dataset.standalone = standalone ? 'true' : 'false';
        root.dataset.tier = tier;
        root.dataset.orientation = landscape ? 'landscape' : 'portrait';
        root.dataset.keyboardStrategy = detectKeyboardStrategy();

        var env = readEnvSafeInsets();
        var fb = fallbackInsets(os, standalone);
        var safe = resolveInsets(env, fb);

        if (os === 'ios' && !isKeyboardLikelyOpen()) {
            safe.top = resolveIosTopInset(env.top, standalone);
        }
        if (os === 'ios') {
            safe.bottom = Math.max(env.bottom, fb.bottom, safe.bottom);
            if (standalone) {
                safe.left = env.left > 0 ? env.left : safe.left;
                safe.right = env.right > 0 ? env.right : safe.right;
            }
        }

        root.style.setProperty('--safe-top', safe.top + 'px');
        root.style.setProperty('--safe-right', safe.right + 'px');
        root.style.setProperty('--safe-bottom', safe.bottom + 'px');
        root.style.setProperty('--safe-left', safe.left + 'px');
        root.style.setProperty(
            '--safe-bottom-effective',
            'max(' + safe.bottom + 'px, env(safe-area-inset-bottom, 0px))'
        );

        var homePadExtra = standalone ? 8 : (os === 'ios' ? 12 : 8);
        root.style.setProperty('--home-time-pad-top', homePadExtra + 'px');

        if (os === 'android' && !standalone) {
            root.style.setProperty('--home-icon-size', '68px');
        }

        applyTierTokens(tier);

        if (landscape) {
            root.style.setProperty('--home-time-size', '3.5rem');
            root.style.setProperty('--home-time-pad-top', '4px');
        }
    }

    function measureChatComposerHeight() {
        var composer = document.querySelector('.chat-composer');
        if (!composer) return;
        var h = Math.ceil(composer.getBoundingClientRect().height);
        if (h > 0) {
            root.style.setProperty('--chat-composer-height', h + 'px');
        }
    }

    function scrollChatToBottom() {
        var chatMessages = document.querySelector('.chat-fullscreen .chat-messages');
        if (chatMessages) {
            requestAnimationFrame(function () {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }
    }

    function resetViewportScroll() {
        if (window.scrollY !== 0 || window.scrollX !== 0) {
            window.scrollTo(0, 0);
        }
    }

    function computeKeyboardOffset() {
        var vv = window.visualViewport;
        if (!vv) return 0;
        var layoutH = document.documentElement.clientHeight || window.innerHeight;
        var offset = Math.max(0, layoutH - vv.height - (vv.offsetTop || 0));
        return offset;
    }

    function getAccessoryInset(open) {
        if (!open) return 0;
        var os = detectOs();
        if (os === 'android' && !isStandalone()) return ACCESSORY_INSET_ANDROID;
        return 0;
    }

    function resetOffsetSamples() {
        offsetSamples = [];
    }

    function isOffsetStable(offset) {
        offsetSamples.push(offset);
        if (offsetSamples.length > 4) offsetSamples.shift();
        if (offsetSamples.length < 2) return false;
        var last = offsetSamples[offsetSamples.length - 1];
        return offsetSamples.every(function (value) {
            return Math.abs(value - last) < 6;
        });
    }

    function clearKeyboardState() {
        root.classList.remove('keyboard-offset-ready');
        delete root.dataset.input;
        root.style.setProperty('--keyboard-offset', '0px');
        root.style.setProperty('--input-accessory-inset', '0px');
    }

    function isTextInputFocused() {
        var el = document.activeElement;
        return !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'));
    }

    function applyKeyboardOffset(forceStable) {
        measureChatComposerHeight();
        resetViewportScroll();

        var strategy = root.dataset.keyboardStrategy || detectKeyboardStrategy();
        var offset = computeKeyboardOffset();
        var focused = isTextInputFocused();
        var open = strategy === 'layout-resize'
            ? focused && document.body.classList.contains('mode-chat')
            : offset > KB_THRESHOLD;
        var accessory = getAccessoryInset(open);

        if (strategy === 'layout-resize') {
            root.style.setProperty('--keyboard-offset', '0px');
            root.style.setProperty('--input-accessory-inset', open ? accessory + 'px' : '0px');
            if (open) {
                root.dataset.input = 'keyboard-open';
                root.classList.add('keyboard-offset-ready');
            } else {
                clearKeyboardState();
            }
            return;
        }

        if (!open) {
            resetOffsetSamples();
            clearKeyboardState();
            return;
        }

        var stable = forceStable || isOffsetStable(offset);
        var totalOffset = offset + accessory;
        root.style.setProperty('--input-accessory-inset', '0px');

        if (!stable) {
            root.classList.remove('keyboard-offset-ready');
            delete root.dataset.input;
            root.style.setProperty('--keyboard-offset', '0px');
            return;
        }

        root.style.setProperty('--keyboard-offset', totalOffset + 'px');
        root.dataset.input = 'keyboard-open';
        root.classList.add('keyboard-offset-ready');
    }

    function settleKeyboardAfterFocus() {
        if (settleRafId) cancelAnimationFrame(settleRafId);
        resetOffsetSamples();
        root.classList.remove('keyboard-offset-ready');
        resetViewportScroll();

        var frame = 0;
        function step() {
            frame += 1;
            applyKeyboardOffset(frame >= 4);
            if (frame < 6) {
                settleRafId = requestAnimationFrame(step);
            } else {
                settleRafId = 0;
                measureChatComposerHeight();
                if (root.dataset.input === 'keyboard-open') {
                    scrollChatToBottom();
                }
            }
        }
        settleRafId = requestAnimationFrame(step);
    }

    function debounce(fn, wait) {
        var t;
        return function () {
            clearTimeout(t);
            t = setTimeout(fn, wait);
        };
    }

    var debouncedLayout = debounce(applyLayout, 100);
    var debouncedKeyboard = debounce(function () {
        applyKeyboardOffset(true);
    }, 50);

    function scheduleLayoutRefresh() {
        applyLayout();
        applyKeyboardOffset(true);
        requestAnimationFrame(applyLayout);
        setTimeout(applyLayout, 120);
        setTimeout(applyLayout, 400);
    }

    scheduleLayoutRefresh();

    window.addEventListener('resize', debouncedLayout);
    window.addEventListener('orientationchange', function () {
        scheduleLayoutRefresh();
    });

    window.addEventListener('pageshow', function () {
        scheduleLayoutRefresh();
        if (typeof sweepAllChatsExpiredPayments === 'function') {
            sweepAllChatsExpiredPayments();
        }
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            scheduleLayoutRefresh();
            if (typeof sweepAllChatsExpiredPayments === 'function') {
                sweepAllChatsExpiredPayments();
            }
        } else {
            resetOffsetSamples();
            clearKeyboardState();
        }
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', debouncedKeyboard);
        window.visualViewport.addEventListener('scroll', function () {
            if (root.dataset.input === 'keyboard-open' || document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
                resetViewportScroll();
                debouncedKeyboard();
            }
        });
    }

    window.addEventListener('resize', debouncedKeyboard);

    document.addEventListener('focusin', function (e) {
        var tag = e.target && e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
        resetViewportScroll();
        root.classList.remove('keyboard-offset-ready');
        settleKeyboardAfterFocus();
    });

    document.addEventListener('focusout', function (e) {
        var tag = e.target && e.target.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
        setTimeout(function () {
            resetOffsetSamples();
            root.classList.remove('keyboard-offset-ready');
            applyKeyboardOffset(true);
        }, 120);
    });

    window.measureChatComposerHeight = measureChatComposerHeight;
    window.resetViewportScroll = resetViewportScroll;
})();

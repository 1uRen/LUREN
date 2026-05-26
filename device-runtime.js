/**
 * 设备运行时：视口、安全区回退、软键盘偏移、平台/档位标记
 */
(function () {
    'use strict';

    var root = document.documentElement;
    var KB_THRESHOLD = 80;

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
            /* PWA 冷启动/后台恢复时 env() 常为 0，需保底避免顶栏进状态栏 */
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
            /* 后台恢复后 env 短暂为 0 时仍保留可点区域 */
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

        var env = readEnvSafeInsets();
        var fb = fallbackInsets(os, standalone);
        var safe = resolveInsets(env, fb);

        if (os === 'ios' && !isKeyboardLikelyOpen()) {
            safe.top = resolveIosTopInset(env.top, standalone);
        }
        if (standalone && os === 'ios') {
            safe.bottom = Math.max(env.bottom, fb.bottom, safe.bottom);
            safe.left = env.left > 0 ? env.left : safe.left;
            safe.right = env.right > 0 ? env.right : safe.right;
        }

        root.style.setProperty('--safe-top', safe.top + 'px');
        root.style.setProperty('--safe-right', safe.right + 'px');
        root.style.setProperty('--safe-bottom', safe.bottom + 'px');
        root.style.setProperty('--safe-left', safe.left + 'px');

        /* 主桌面 safe 已在 .iphone-container padding，此处仅额外间距 */
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

    function scrollChatToBottom() {
        var chatMessages = document.querySelector('.chat-fullscreen .chat-messages');
        if (chatMessages) {
            requestAnimationFrame(function () {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }
    }

    function applyKeyboardOffset() {
        var vv = window.visualViewport;
        var offset = 0;

        if (vv) {
            offset = Math.max(
                0,
                window.innerHeight - vv.height - (vv.offsetTop || 0)
            );
        }

        root.style.setProperty('--keyboard-offset', offset + 'px');

        if (offset > KB_THRESHOLD) {
            root.dataset.input = 'keyboard-open';
            scrollChatToBottom();
        } else {
            delete root.dataset.input;
        }
    }

    function debounce(fn, wait) {
        var t;
        return function () {
            clearTimeout(t);
            t = setTimeout(fn, wait);
        };
    }

    var debouncedLayout = debounce(applyLayout, 100);
    var debouncedKeyboard = debounce(applyKeyboardOffset, 50);

    function scheduleLayoutRefresh() {
        applyLayout();
        applyKeyboardOffset();
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
            root.style.setProperty('--keyboard-offset', '0px');
            delete root.dataset.input;
        }
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', debouncedKeyboard);
        window.visualViewport.addEventListener('scroll', debouncedKeyboard);
    }

    window.addEventListener('resize', debouncedKeyboard);

    document.addEventListener('focusin', function (e) {
        var tag = e.target && e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
            setTimeout(function () {
                applyKeyboardOffset();
                scrollChatToBottom();
            }, 300);
        }
    });

    document.addEventListener('focusout', function () {
        setTimeout(applyKeyboardOffset, 100);
    });
})();

(function () {
    'use strict';

    var STATUS_BAR_ID = 'systemStatusBar';
    var timeTimerId = null;
    var batteryRef = null;
    var lastBatteryLevel = 1;
    var lastBatteryCharging = false;

    function loadStatusBarSetting() {
        if (typeof loadStatusBar === 'function') {
            return loadStatusBar();
        }
        return true;
    }

    function getStatusBarElement() {
        return document.getElementById(STATUS_BAR_ID);
    }

    function formatStatusTime(date) {
        var h = String(date.getHours()).padStart(2, '0');
        var m = String(date.getMinutes()).padStart(2, '0');
        return h + ':' + m;
    }

    function updateStatusBarTime() {
        var bar = getStatusBarElement();
        if (!bar) return;
        var timeEl = bar.querySelector('.system-status-bar-time');
        if (!timeEl) return;
        timeEl.textContent = formatStatusTime(new Date());
    }

    function updateBatteryDisplay(level, charging) {
        if (typeof level === 'number') {
            lastBatteryLevel = level;
        }
        if (typeof charging === 'boolean') {
            lastBatteryCharging = charging;
        }

        var bar = getStatusBarElement();
        if (!bar) return;

        var levelEl = bar.querySelector('.system-status-battery-level');
        var textEl = bar.querySelector('.system-status-battery-text');
        var pct = Math.max(0, Math.min(100, Math.round(lastBatteryLevel * 100)));

        if (levelEl) {
            levelEl.style.width = pct + '%';
        }
        if (textEl) {
            textEl.textContent = pct + '%';
        }
    }

    function syncStatusBarState() {
        updateStatusBarTime();
        updateBatteryDisplay(lastBatteryLevel, lastBatteryCharging);
    }

    function bindBattery(battery) {
        if (!battery) {
            updateBatteryDisplay(1, false);
            return;
        }
        batteryRef = battery;
        var refresh = function () {
            updateBatteryDisplay(battery.level, battery.charging);
        };
        refresh();
        battery.addEventListener('levelchange', refresh);
        battery.addEventListener('chargingchange', refresh);
    }

    function initBatteryMonitor() {
        if (batteryRef) {
            updateBatteryDisplay(batteryRef.level, batteryRef.charging);
            return;
        }
        if (navigator.getBattery) {
            navigator.getBattery().then(bindBattery).catch(function () {
                updateBatteryDisplay(1, false);
            });
            return;
        }
        updateBatteryDisplay(1, false);
    }

    function createStatusBarElement() {
        var bar = document.createElement('div');
        bar.id = STATUS_BAR_ID;
        bar.className = 'system-status-bar';
        bar.setAttribute('aria-hidden', 'true');
        bar.innerHTML =
            '<div class="system-status-bar-time">--:--</div>' +
            '<div class="system-status-bar-right">' +
                '<span class="system-status-signal" aria-hidden="true">' +
                    '<span></span><span></span><span></span><span></span>' +
                '</span>' +
                '<span class="system-status-battery">' +
                    '<span class="system-status-battery-shell">' +
                        '<span class="system-status-battery-level" style="width:100%"></span>' +
                    '</span>' +
                    '<span class="system-status-battery-text">100%</span>' +
                '</span>' +
            '</div>';
        return bar;
    }

    function ensureStatusBarMounted() {
        var container = document.querySelector('.iphone-container');
        if (!container) return;

        var bar = getStatusBarElement();
        if (!bar) {
            bar = createStatusBarElement();
        }
        if (bar.parentElement !== container) {
            container.insertBefore(bar, container.firstChild);
        }
    }

    function startStatusBarTimers() {
        updateStatusBarTime();
        if (timeTimerId) return;
        timeTimerId = window.setInterval(updateStatusBarTime, 1000);
    }

    function applyStatusBarVisibility() {
        var enabled = loadStatusBarSetting();
        document.documentElement.dataset.statusBar = enabled ? 'on' : 'off';
        var bar = getStatusBarElement();
        if (bar) {
            bar.hidden = !enabled;
            bar.style.backgroundColor = '';
            bar.style.color = '';
        }
        if (enabled) {
            ensureStatusBarMounted();
            startStatusBarTimers();
            initBatteryMonitor();
            syncStatusBarState();
        }
    }

    function mountStatusBar() {
        ensureStatusBarMounted();
        applyStatusBarVisibility();
    }

    function setStatusBar(enabled) {
        if (typeof saveStatusBar === 'function') {
            saveStatusBar(enabled);
        }
        applyStatusBarVisibility();
    }

    window.mountStatusBar = mountStatusBar;
    window.applyStatusBarVisibility = applyStatusBarVisibility;
    window.setStatusBar = setStatusBar;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountStatusBar);
    } else {
        mountStatusBar();
    }
})();

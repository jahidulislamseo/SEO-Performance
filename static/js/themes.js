/* ═══════════════════════════════════════════════════════════════
   themes.js — Theme management (Light, Dark, System)
   ═══════════════════════════════════════════════════════════════ */

(function() {
    const STORAGE_KEY = 'dashboard-theme';
    const THEMES = { LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' };

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
    }

    function applyTheme(theme) {
        let actualTheme = theme;
        if (theme === THEMES.SYSTEM) {
            actualTheme = getSystemTheme();
        }
        document.documentElement.setAttribute('data-theme', actualTheme);
        document.documentElement.setAttribute('data-pref', theme);
        
        // Update Icons in UI if they exist
        const iconMap = { light: '☀️', dark: '🌙', system: '💻' };
        const activeLabel = document.getElementById('theme-label');
        if (activeLabel) activeLabel.textContent = iconMap[theme];
    }

    // Initial Load
    const saved = localStorage.getItem(STORAGE_KEY) || THEMES.SYSTEM;
    applyTheme(saved);

    // Listen for system changes if in system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const current = localStorage.getItem(STORAGE_KEY) || THEMES.SYSTEM;
        if (current === THEMES.SYSTEM) applyTheme(THEMES.SYSTEM);
    });

    // Global toggle function
    window.setTheme = function(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme);
        // Toast UI feedback
        if (typeof showToast === 'function') {
            const labels = { light: 'Light Mode', dark: 'Dark Mode', system: 'System Default' };
            showToast(`Theme set to ${labels[theme]}`, '#6366f1');
        }
        toggleThemeMenu(false);
    };

    window.toggleThemeMenu = function(show) {
        const menu = document.getElementById('theme-menu');
        if (!menu) return;
        if (show === undefined) menu.classList.toggle('open');
        else menu.classList.toggle('open', show);
    };

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-switcher')) toggleThemeMenu(false);
    });
})();

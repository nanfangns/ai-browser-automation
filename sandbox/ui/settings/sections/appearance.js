
// sandbox/ui/settings/sections/appearance.js
import { CustomDropdown } from '../../dropdown.js';

export class AppearanceSection {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.elements = {};
        this.dropdowns = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            themeWrapper: get('theme-select-wrapper'),
            themeTrigger: get('theme-select-trigger'),
            themeDropdown: get('theme-select-dropdown'),
            themeSelect: get('theme-select'),
            languageWrapper: get('language-select-wrapper'),
            languageTrigger: get('language-select-trigger'),
            languageDropdown: get('language-select-dropdown'),
            languageSelect: get('language-select')
        };
    }

    bindEvents() {
        const { themeWrapper, themeTrigger, themeDropdown, themeSelect,
                languageWrapper, languageTrigger, languageDropdown, languageSelect } = this.elements;

        // Theme dropdown
        if (themeWrapper && themeTrigger && themeDropdown && themeSelect) {
            this.dropdowns.theme = new CustomDropdown({
                wrapper: themeWrapper,
                trigger: themeTrigger,
                dropdown: themeDropdown,
                nativeSelect: themeSelect,
                options: [
                    { val: 'system', txt: 'System Default' },
                    { val: 'light', txt: 'Light' },
                    { val: 'dark', txt: 'Dark' }
                ],
                onSelect: (value) => this.fire('onThemeChange', value)
            });
        }

        // Language dropdown
        if (languageWrapper && languageTrigger && languageDropdown && languageSelect) {
            this.dropdowns.language = new CustomDropdown({
                wrapper: languageWrapper,
                trigger: languageTrigger,
                dropdown: languageDropdown,
                nativeSelect: languageSelect,
                options: [
                    { val: 'system', txt: 'System Default' },
                    { val: 'en', txt: 'English' },
                    { val: 'zh', txt: '中文' }
                ],
                onSelect: (value) => this.fire('onLanguageChange', value)
            });
        }

        // System Theme Listener
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
             const themeSelect = this.elements.themeSelect;
             if (themeSelect && themeSelect.value === 'system') {
                 this.applyVisualTheme('system');
             }
        });
    }

    setTheme(theme) {
        const dd = this.dropdowns.theme;
        if (dd) dd.setValue(theme);
        this.applyVisualTheme(theme);
    }

    setLanguage(lang) {
        const dd = this.dropdowns.language;
        if (dd) dd.setValue(lang);
    }

    applyVisualTheme(theme) {
        let applied = theme;
        if (theme === 'system') {
             applied = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', applied);
    }

    fire(event, data) {
        if (this.callbacks[event]) this.callbacks[event](data);
    }
}

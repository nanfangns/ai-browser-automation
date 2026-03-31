
export const AppearanceSettingsTemplate = `
<div class="setting-group">
    <h4 data-i18n="appearance">Appearance</h4>

    <!-- Theme Dropdown -->
    <div class="shortcut-row">
        <label data-i18n="theme">Theme</label>
        <div class="cd-wrapper cd-wrapper-sm" id="theme-select-wrapper">
            <button class="cd-trigger cd-trigger-sm" id="theme-select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="Select theme">
                <span class="cd-trigger-label">System Default</span>
                <svg class="cd-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="cd-dropdown cd-dropdown-sm" id="theme-select-dropdown" role="listbox">
                <div class="cd-option active" data-value="system" role="option" aria-selected="true" tabindex="0"><span class="cd-option-name">System Default</span></div>
                <div class="cd-option" data-value="light" role="option" aria-selected="false" tabindex="0"><span class="cd-option-name">Light</span></div>
                <div class="cd-option" data-value="dark" role="option" aria-selected="false" tabindex="0"><span class="cd-option-name">Dark</span></div>
            </div>
            <select id="theme-select" style="display:none" aria-label="Select theme">
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </div>
    </div>

    <!-- Language Dropdown -->
    <div class="shortcut-row">
        <label data-i18n="language">Language</label>
        <div class="cd-wrapper cd-wrapper-sm" id="language-select-wrapper">
            <button class="cd-trigger cd-trigger-sm" id="language-select-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="Select language">
                <span class="cd-trigger-label">System Default</span>
                <svg class="cd-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <div class="cd-dropdown cd-dropdown-sm" id="language-select-dropdown" role="listbox">
                <div class="cd-option active" data-value="system" role="option" aria-selected="true" tabindex="0"><span class="cd-option-name">System Default</span></div>
                <div class="cd-option" data-value="en" role="option" aria-selected="false" tabindex="0"><span class="cd-option-name">English</span></div>
                <div class="cd-option" data-value="zh" role="option" aria-selected="false" tabindex="0"><span class="cd-option-name">中文</span></div>
            </div>
            <select id="language-select" style="display:none" aria-label="Select language">
                <option value="system">System Default</option>
                <option value="en">English</option>
                <option value="zh">中文</option>
            </select>
        </div>
    </div>
</div>`;


export const PromptSettingsTemplate = `
<div class="setting-group">
    <h4 data-i18n="customPrompt">Custom Prompt</h4>
    <p class="setting-desc" style="margin-bottom: 12px;" data-i18n="customPromptDesc">Add a global system prompt that will be included in every conversation. Use it to customize AI behavior, add context, or define specific rules.</p>
    <textarea
        id="custom-prompt-input"
        class="shortcut-input"
        style="width: 100%; min-height: 150px; resize: vertical; padding: 12px; line-height: 1.5; font-family: inherit; font-size: 14px; box-sizing: border-box;"
        data-i18n-placeholder="customPromptPlaceholder"
        placeholder="You are a helpful assistant that specializes in..."
    ></textarea>
</div>
`;

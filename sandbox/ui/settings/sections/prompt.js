
// sandbox/ui/settings/sections/prompt.js
import { PROMPT_PRESETS } from '../../templates/settings/prompt.js';
import { CustomDropdown } from '../../dropdown.js';

export class PromptSection {
    constructor() {
        this.elements = {};
        this.dropdown = null;
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            promptInput: get('custom-prompt-input'),
            presetWrapper: get('prompt-preset-wrapper'),
            presetTrigger: get('prompt-preset-trigger'),
            presetDropdown: get('prompt-preset-dropdown'),
            presetSelect: get('prompt-preset-select')
        };
    }

    bindEvents() {
        const { presetWrapper, presetTrigger, presetDropdown, presetSelect } = this.elements;
        if (presetWrapper && presetTrigger && presetDropdown && presetSelect) {
            this.dropdown = new CustomDropdown({
                wrapper: presetWrapper,
                trigger: presetTrigger,
                dropdown: presetDropdown,
                nativeSelect: presetSelect,
                options: [
                    { val: 'custom', txt: 'Custom (Write your own below)' },
                    { val: 'brutal', txt: '吐槽毒舌', desc: 'Brutal Truth Teller' },
                    { val: 'untrammelled', txt: '桀骜不驯', desc: 'Untrammelled Writer' }
                ],
                onSelect: (value) => {
                    if (value === 'custom') {
                        if (this.elements.promptInput) this.elements.promptInput.value = '';
                        return;
                    }
                    const preset = PROMPT_PRESETS[value];
                    if (preset && this.elements.promptInput) {
                        this.elements.promptInput.value = preset;
                    }
                }
            });
        }
    }

    getData() {
        return {
            customPrompt: this.elements.promptInput ? this.elements.promptInput.value : ''
        };
    }

    setData(data) {
        if (this.elements.promptInput && data && data.customPrompt !== undefined) {
            this.elements.promptInput.value = data.customPrompt || '';
        }
    }
}

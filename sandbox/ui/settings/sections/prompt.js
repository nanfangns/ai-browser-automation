
// sandbox/ui/settings/sections/prompt.js

export class PromptSection {
    constructor() {
        this.elements = {};
        this.queryElements();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            promptInput: get('custom-prompt-input')
        };
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

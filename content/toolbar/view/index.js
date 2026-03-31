
// content/toolbar/view/index.js
(function() {
    /**
     * Main View Facade
     * Orchestrates WidgetView and WindowView
     */
    class ToolbarView {
        constructor(shadowRoot) {
            this.shadow = shadowRoot;
            this.elements = {};
            this.cacheElements();
            this._initModelDropdown();

            // Initialize Sub-Views
            this.widgetView = new window.GeminiViewWidget(this.elements);
            this.windowView = new window.GeminiViewWindow(this.elements);
        }

        _initModelDropdown() {
            const wrapper = this.shadow.getElementById('ask-model-wrapper');
            const trigger = this.shadow.getElementById('ask-model-trigger');
            const dropdown = this.shadow.getElementById('ask-model-dropdown');
            const label = this.shadow.getElementById('ask-model-label');
            const select = this.elements.askModelSelect;
            if (!wrapper || !trigger || !dropdown || !label || !select) return;

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('open');
                if (isOpen) this._closeDropdown();
                else this._openDropdown();
            });

            dropdown.addEventListener('click', (e) => {
                const option = e.target.closest('.ask-model-option');
                if (!option) return;
                this._selectOption(option.dataset.value);
            });

            this.shadow.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) this._closeDropdown();
            });

            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') { this._closeDropdown(); return; }
                if (!dropdown.classList.contains('open') && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                    e.preventDefault();
                    this._openDropdown();
                }
            });

            dropdown.addEventListener('keydown', (e) => {
                const opts = [...dropdown.querySelectorAll('.ask-model-option')];
                const focused = dropdown.querySelector('.ask-model-option:focus');
                const idx = opts.indexOf(focused);
                if (e.key === 'ArrowDown') { e.preventDefault(); (opts[idx + 1] || opts[0])?.focus(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); (opts[idx - 1] || opts[opts.length - 1])?.focus(); }
                else if (['Enter', ' '].includes(e.key)) { e.preventDefault(); document.activeElement?.click(); }
                else if (e.key === 'Escape') { this._closeDropdown(); trigger.focus(); }
            });
        }

        _openDropdown() {
            const trigger = this.shadow.getElementById('ask-model-trigger');
            const dropdown = this.shadow.getElementById('ask-model-dropdown');
            if (!trigger || !dropdown) return;
            dropdown.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
            dropdown.querySelector('.ask-model-option')?.focus();
        }

        _closeDropdown() {
            const trigger = this.shadow.getElementById('ask-model-trigger');
            const dropdown = this.shadow.getElementById('ask-model-dropdown');
            if (!trigger || !dropdown) return;
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }

        _selectOption(value) {
            const dropdown = this.shadow.getElementById('ask-model-dropdown');
            const label = this.shadow.getElementById('ask-model-label');
            const select = this.elements.askModelSelect;
            if (!dropdown || !label || !select) return;

            dropdown.querySelectorAll('.ask-model-option').forEach(opt => {
                const isActive = opt.dataset.value === value;
                opt.classList.toggle('active', isActive);
                opt.setAttribute('aria-selected', isActive);
            });

            const active = dropdown.querySelector(`.ask-model-option[data-value="${value}"]`);
            if (active) label.textContent = active.querySelector('.ask-model-option-name').textContent;
            select.value = value;
            select.dispatchEvent(new Event('change'));
            this._closeDropdown();
        }

        cacheElements() {
            const get = (id) => this.shadow.getElementById(id);
            this.elements = {
                toolbar: get('toolbar'),
                toolbarDrag: get('toolbar-drag'),
                imageBtn: get('image-btn'),
                
                // New Window Elements
                askWindow: get('ask-window'),
                askHeader: get('ask-header'),
                windowTitle: get('window-title'),
                contextPreview: get('context-preview'),
                askInput: get('ask-input'),
                resultArea: get('result-area'),
                resultText: get('result-text'),
                askModelSelect: get('ask-model-select'),
                
                // Footer Elements
                windowFooter: get('window-footer'),
                footerActions: get('footer-actions'),
                footerStop: get('footer-stop'),
                
                // Buttons
                buttons: {
                    copySelection: get('btn-copy'),
                    ask: get('btn-ask'),
                    grammar: get('btn-grammar'),
                    translate: get('btn-translate'),
                    explain: get('btn-explain'),
                    summarize: get('btn-summarize'),
                    headerClose: get('btn-header-close'),
                    stop: get('btn-stop-gen'),
                    continue: get('btn-continue-chat'),
                    copy: get('btn-copy-result'),
                    retry: get('btn-retry'),
                    insert: get('btn-insert'),
                    replace: get('btn-replace'),
                    
                    // Image Menu Buttons
                    imageChat: get('btn-image-chat'),
                    imageDescribe: get('btn-image-describe'),
                    imageExtract: get('btn-image-extract'),
                    
                    // Image Edit Buttons
                    imageRemoveBg: get('btn-image-remove-bg'),
                    imageRemoveText: get('btn-image-remove-text'),
                    imageRemoveWatermark: get('btn-image-remove-watermark'),
                    imageUpscale: get('btn-image-upscale'),
                    imageExpand: get('btn-image-expand')
                }
            };
        }

        // --- Delegation to Widget View ---

        showToolbar(rect, mousePoint) { this.widgetView.showToolbar(rect, mousePoint); }
        hideToolbar() { this.widgetView.hideToolbar(); }
        showImageButton(rect) { this.widgetView.showImageButton(rect); }
        hideImageButton() { this.widgetView.hideImageButton(); }
        isToolbarVisible() { return this.widgetView.isToolbarVisible(); }
        toggleCopySelectionIcon(success) { this.widgetView.toggleCopySelectionIcon(success); }

        // --- Delegation to Window View ---

        get isPinned() { return this.windowView.isPinned; }
        get isDocked() { return this.windowView.isDocked; }
        
        togglePin() { return this.windowView.togglePin(); }
        showAskWindow(rect, contextText, title, resetDrag, mousePoint) { return this.windowView.show(rect, contextText, title, resetDrag, mousePoint); }
        hideAskWindow() { this.windowView.hide(); }
        showLoading(msg) { this.windowView.showLoading(msg); }
        
        // Pass optional isHtml flag
        showResult(text, title, isStreaming, isHtml = false) { 
            this.windowView.showResult(text, title, isStreaming, isHtml); 
        }
        
        updateStreamingState(isStreaming) { this.windowView.updateStreamingState(isStreaming); }

        showError(text) { this.windowView.showError(text); }
        toggleCopyIcon(success) { this.windowView.toggleCopyIcon(success); }
        setInputValue(text) { this.windowView.setInputValue(text); }
        isWindowVisible() { return this.windowView.isVisible(); }

        dockWindow(side, top) { this.windowView.dockWindow(side, top); }
        undockWindow() { this.windowView.undockWindow(); }

        // --- Model Selection ---
        
        getSelectedModel() {
            return this.elements.askModelSelect ? this.elements.askModelSelect.value : "gemini-2.5-flash";
        }

        setSelectedModel(model) {
            const label = this.shadow.getElementById('ask-model-label');
            const dropdown = this.shadow.getElementById('ask-model-dropdown');
            const select = this.elements.askModelSelect;
            if (!select || !model) return;
            select.value = model;

            if (dropdown) {
                dropdown.querySelectorAll('.ask-model-option').forEach(opt => {
                    const isActive = opt.dataset.value === model;
                    opt.classList.toggle('active', isActive);
                    opt.setAttribute('aria-selected', isActive);
                });
            }
            if (label) {
                const active = dropdown?.querySelector(`.ask-model-option[data-value="${model}"]`);
                if (active) label.textContent = active.querySelector('.ask-model-option-name').textContent;
            }
        }

        updateModelOptions(options, selectedValue) {
            const select = this.elements.askModelSelect;
            const dropdown = this.shadow.getElementById('ask-model-dropdown');
            const label = this.shadow.getElementById('ask-model-label');
            if (!select || !dropdown) return;

            select.innerHTML = '';
            dropdown.innerHTML = '';
            const currentVal = selectedValue || options[0]?.val;

            options.forEach(o => {
                // Native select option
                const opt = document.createElement('option');
                opt.value = o.val;
                opt.textContent = o.txt;
                select.appendChild(opt);

                // Custom dropdown option
                const div = document.createElement('div');
                div.className = `ask-model-option${o.val === currentVal ? ' active' : ''}`;
                div.dataset.value = o.val;
                div.setAttribute('role', 'option');
                div.setAttribute('aria-selected', o.val === currentVal);
                div.tabIndex = 0;
                div.innerHTML = `<span class="ask-model-option-name">${o.txt}</span><span class="ask-model-option-desc">${o.desc || o.val}</span>`;
                dropdown.appendChild(div);
            });

            const val = options.some(o => o.val === currentVal) ? currentVal : options[0]?.val;
            if (val) {
                select.value = val;
                if (label) {
                    const active = dropdown.querySelector(`.ask-model-option[data-value="${val}"]`);
                    if (active) label.textContent = active.querySelector('.ask-model-option-name').textContent;
                }
            }
        }

        // --- General ---

        isHost(target, host) {
            return target === host || this.windowView.isHost(target);
        }
    }

    window.GeminiToolbarView = ToolbarView;
})();
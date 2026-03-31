
// sandbox/ui/settings/sections/about.js

export class AboutSection {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.elements = {};
        this.queryElements();
        this.bindEvents();
    }

    queryElements() {
        const get = (id) => document.getElementById(id);
        this.elements = {
            btnDownloadLogs: get('download-logs'),
            starEl: get('star-count'),
            currentVersionEl: get('app-current-version'),
            updateStatusEl: get('app-update-status')
        };
    }

    bindEvents() {
        if (this.elements.btnDownloadLogs) {
            this.elements.btnDownloadLogs.addEventListener('click', () => {
                if (this.callbacks.onDownloadLogs) this.callbacks.onDownloadLogs();
            });
        }
    }

    displayStars(count) {
        const { starEl } = this.elements;
        if (!starEl) return;

        if (count) {
            const formatted = count > 999 ? (count / 1000).toFixed(1) + 'k' : count;
            starEl.textContent = `★ ${formatted}`;
            starEl.style.display = 'inline';
        } else {
            starEl.style.display = 'none';
        }
    }

    hasFetchedStars() {
        const { starEl } = this.elements;
        return starEl && starEl.style.display !== 'none';
    }

    getCurrentVersion() {
        const { currentVersionEl } = this.elements;
        return currentVersionEl ? currentVersionEl.textContent : null;
    }

    displayUpdateStatus(latest, current, isUpdateAvailable) {
        const { updateStatusEl } = this.elements;
        if (!updateStatusEl) return;

        if (isUpdateAvailable) {
            updateStatusEl.innerHTML = `<a href="https://github.com/nanfangns/gemini-nexus/releases" target="_blank" style="color: #d93025; text-decoration: none; border-bottom: 1px dashed;">Update: ${latest}</a>`;
            updateStatusEl.style.color = '';
        } else {
            updateStatusEl.textContent = `(Latest)`;
            updateStatusEl.style.color = 'var(--text-tertiary)';
        }
    }
}

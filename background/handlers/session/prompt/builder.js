
// background/handlers/session/prompt/builder.js
import { getActiveTabContextData } from '../utils.js';
import { BROWSER_CONTROL_PREAMBLE } from './preamble.js';

export class PromptBuilder {
    constructor(controlManager) {
        this.controlManager = controlManager;
    }

    async build(request) {
        let systemPreamble = "";
        let pageContextMeta = null;
        let pageContextChanged = false;

        // Fetch custom prompt from storage
        const { geminiCustomPrompt = '' } = await chrome.storage.local.get(['geminiCustomPrompt']);
        if (geminiCustomPrompt && geminiCustomPrompt.trim()) {
            systemPreamble += `[Custom System Prompt]:\n${geminiCustomPrompt.trim()}\n\n---\n\n`;
        }

        if (request.includePageContext) {
            // If we have a locked tab in ControlManager, use it for context
            const targetTabId = this.controlManager ? this.controlManager.getTargetTabId() : null;
            const pageContext = await getActiveTabContextData(targetTabId);
            const pageContent = pageContext ? pageContext.content : null;
            
            if (pageContent) {
                pageContextMeta = {
                    url: pageContext.url || '',
                    title: pageContext.title || '',
                    fingerprint: pageContext.fingerprint || ''
                };

                const previousMeta = await this._getSessionPageContextMeta(request.sessionId);
                pageContextChanged = Boolean(
                    previousMeta &&
                    previousMeta.fingerprint &&
                    pageContextMeta.fingerprint &&
                    previousMeta.fingerprint !== pageContextMeta.fingerprint
                );

                if (pageContextMeta.url) {
                    systemPreamble += `[Current Page URL]: ${pageContextMeta.url}\n\n`;
                }

                if (pageContextChanged) {
                    systemPreamble += `[Page Context Update]: The active page has changed since earlier turns. Treat the current page context below as authoritative. Ignore prior page-specific assumptions unless the user explicitly asks to compare pages.\n\n`;
                }

                systemPreamble += `Webpage Context:\n\`\`\`text\n${pageContent}\n\`\`\`\n\n`;
            }
        }

        if (request.enableBrowserControl) {
            systemPreamble += BROWSER_CONTROL_PREAMBLE;

            if (this.controlManager) {
                try {
                    // 1. Inject URL
                    let url = null;
                    const targetTabId = this.controlManager.getTargetTabId();
                    if (targetTabId) {
                        try {
                            const tab = await chrome.tabs.get(targetTabId);
                            url = tab.url;
                        } catch (e) { }
                    }
                    
                    // Fallback to active tab if no locked tab or lookup failed
                    if (!url) {
                        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                        if (tabs.length > 0) url = tabs[0].url;
                    }

                    if (url) {
                        systemPreamble += `\n[Current Page URL]: ${url}\n`;
                    }

                    // 2. Inject Snapshot (Accessibility Tree) - Only on first turn
                    // This jump-starts the model without it needing to call take_snapshot first, saving a turn.
                    const isFirst = await this._isFirstTurn(request.sessionId);
                    
                    if (isFirst) {
                        const snapshot = await this.controlManager.getSnapshot();
                        if (snapshot && typeof snapshot === 'string' && !snapshot.startsWith('Error')) {
                             systemPreamble += `\n[Current Page Accessibility Tree]:\n\`\`\`text\n${snapshot}\n\`\`\`\n`;
                        }
                    }

                } catch (e) {
                    console.warn("Auto-Injection failed:", e);
                }
            }
        }

        // Return separated components
        return {
            systemInstruction: systemPreamble,
            userPrompt: request.text,
            pageContextMeta,
            pageContextChanged
        };
    }

    async _getSessionPageContextMeta(sessionId) {
        if (!sessionId) return null;

        try {
            const { geminiSessions = [] } = await chrome.storage.local.get(['geminiSessions']);
            const session = geminiSessions.find((item) => item.id === sessionId);
            return session?.pageContextMeta || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Checks if this is the first turn of the conversation (no AI replies yet).
     */
    async _isFirstTurn(sessionId) {
        if (!sessionId) return true; // No session ID implies new/ephemeral request
        try {
            const { geminiSessions = [] } = await chrome.storage.local.get(['geminiSessions']);
            const session = geminiSessions.find(s => s.id === sessionId);
            if (!session) return true;
            
            // If there are no AI responses yet, this is the first turn being processed
            const hasAiResponse = session.messages.some(m => m.role === 'ai');
            return !hasAiResponse;
        } catch (e) {
            return true; // Default to true on error to be safe
        }
    }
}

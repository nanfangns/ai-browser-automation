
(function() {
    window.GeminiStyles = window.GeminiStyles || {};
    window.GeminiStyles.PanelHeader = `
        /* --- Standard Header Styles --- */

        .ask-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 16px;
            cursor: move;
            user-select: none;
            background: #fff;
            flex-shrink: 0;
        }
        
        @media (max-width: 600px) {
            .ask-header {
                cursor: default; 
            }
        }

        .window-title {
            font-weight: 600;
            font-size: 15px;
            color: #1f1f1f;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

.ask-model-select-wrapper {
    position: relative;
    display: inline-block;
}

.ask-model-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: #f0f4f9;
    border: 1px solid transparent;
    border-radius: 18px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: #444746;
    font-family: inherit;
    transition: all 0.18s;
    white-space: nowrap;
    user-select: none;
}

.ask-model-trigger:hover {
    background: #e9eef6;
    color: #1f1f1f;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.ask-model-trigger:focus-visible {
    outline: 2px solid #0b57d0;
    outline-offset: 2px;
}

.ask-model-trigger[aria-expanded="true"] {
    border-color: #0b57d0;
    box-shadow: 0 0 0 2px rgba(11, 87, 208, 0.15);
}

.ask-model-label {
    max-width: 90px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ask-model-arrow {
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    color: #888;
}

.ask-model-trigger[aria-expanded="true"] .ask-model-arrow {
    transform: rotate(180deg);
}

.ask-model-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 100;
    background: #fff;
    border: 1px solid #e1e3e1;
    border-radius: 10px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.12);
    padding: 5px;
    min-width: 180px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-4px) scale(0.97);
    transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: top left;
}

.ask-model-dropdown.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
}

.ask-model-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.12s;
    gap: 12px;
}

.ask-model-option:hover {
    background: #f0f4f9;
}

.ask-model-option.active {
    background: #d3e3fd;
}

.ask-model-option-name {
    font-size: 13px;
    font-weight: 500;
    color: #1f1f1f;
}

.ask-model-option.active .ask-model-option-name {
    color: #0b57d0;
    font-weight: 600;
}

.ask-model-option-desc {
    font-size: 10px;
    color: #888;
    font-family: monospace;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ask-model-option.active::after {
    content: '';
    display: block;
    width: 14px;
    height: 14px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%230b57d0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: contain;
    flex-shrink: 0;
}

        .icon-btn {
            background: transparent;
            border: none;
            color: #5e5e5e;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s, color 0.2s;
        }
        .icon-btn:hover {
            background: #f0f1f1;
            color: #1f1f1f;
        }
    `;
})();

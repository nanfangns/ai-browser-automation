const BLOCK_PATTERNS = [
    /\[(?:critical|important)\s+instructions?[^\]]*(?:ai assistants?|language models?|automated agents?)[^\]]*\][\s\S]*?(?:\[end instructions?\]|$)/i
];

const SIGNAL_PATTERNS = [
    /if you are an ai (?:agent|assistant|language model|automated assistant)/i,
    /strictly prohibits ai-generated content/i,
    /must refuse/i,
    /do not generate/i,
    /permanently banned/i,
    /navigate to:\s*https?:\/\//i,
    /write your own content/i,
    /this policy applies regardless/i
];

function normalizeContextText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
}

export function isInjectedInstructionText(text) {
    const normalized = normalizeContextText(text);
    if (!normalized) return false;

    if (BLOCK_PATTERNS.some((pattern) => pattern.test(normalized))) {
        return true;
    }

    let score = 0;
    for (const pattern of SIGNAL_PATTERNS) {
        if (pattern.test(normalized)) score++;
    }

    return score >= 3;
}

export function sanitizePageContextText(text) {
    if (!text) return text;

    let sanitized = String(text);

    for (const pattern of BLOCK_PATTERNS) {
        sanitized = sanitized.replace(pattern, '\n');
    }

    const segments = sanitized
        .split(/\n{2,}/)
        .map((segment) => segment.trim())
        .filter(Boolean);

    const keptSegments = segments.filter((segment) => !isInjectedInstructionText(segment));
    return keptSegments.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function shouldDropAXNode(node, getVal) {
    const texts = [
        getVal(node.name),
        getVal(node.value),
        getVal(node.description)
    ].filter(Boolean);

    if (texts.length === 0) return false;
    return isInjectedInstructionText(texts.join('\n'));
}

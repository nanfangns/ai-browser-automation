
// services/providers/xai.js

/**
 * Sends a message using the xAI (Grok) API.
 * xAI API is OpenAI-compatible at https://api.x.ai/v1
 * Docs: https://docs.x.ai/
 */
export async function sendXaiMessage(prompt, systemInstruction, history, config, files, signal, onUpdate) {
    let { apiKey, model } = config;

    if (!apiKey) throw new Error("xAI API Key is missing. Please get one from https://console.x.ai");

    const baseUrl = "https://api.x.ai/v1";
    const url = `${baseUrl}/chat/completions`;

    // 1. Build Messages Array
    const messages = [];

    // System Message
    if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
    }

    // Helper to format content (Text + Image)
    const formatContent = (text, images) => {
        if (!images || images.length === 0) {
            return text || "";
        }

        const content = [];
        if (text) {
            content.push({ type: "text", text: text });
        }

        images.forEach(img => {
            content.push({
                type: "image_url",
                image_url: {
                    url: img
                }
            });
        });

        return content;
    };

    // History
    if (history && Array.isArray(history)) {
        history.forEach(msg => {
            const role = msg.role === 'ai' ? 'assistant' : 'user';
            const images = (msg.role === 'user' && msg.image) ? msg.image : [];
            messages.push({
                role: role,
                content: formatContent(msg.text, images)
            });
        });
    }

    // Current Prompt
    const currentImages = [];
    if (files && files.length > 0) {
        files.forEach(f => {
            currentImages.push(f.base64);
        });
    }

    messages.push({
        role: "user",
        content: formatContent(prompt, currentImages)
    });

    const payload = {
        model: model || "grok-3-mini",
        messages: messages,
        stream: true
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    console.debug(`[xAI] Requesting ${payload.model} at ${url}...`);

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal
    });

    if (!response.ok) {
        let errorText = await response.text();
        try {
            const errJson = JSON.parse(errorText);
            if (errJson.error && errJson.error.message) errorText = errJson.error.message;
        } catch (e) { }
        throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = "";
    let fullText = "";
    let fullThoughts = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        let lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.substring(6);
                if (dataStr === '[DONE]') continue;

                try {
                    const data = JSON.parse(dataStr);
                    if (data.choices && data.choices.length > 0) {
                        const delta = data.choices[0].delta;

                        // Standard Content
                        if (delta.content) {
                            fullText += delta.content;
                            onUpdate(fullText, fullThoughts);
                        }

                        // Reasoning Content (for thinking models)
                        if (delta.reasoning_content) {
                            fullThoughts += delta.reasoning_content;
                            onUpdate(fullText, fullThoughts);
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }

    return {
        text: fullText,
        thoughts: fullThoughts || null,
        images: [],
        context: null
    };
}

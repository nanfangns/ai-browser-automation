import { getDoubaoAuth, clearDoubaoAuth, uploadDoubaoImagesFromPage, preHandleDoubaoImage } from '../doubao_auth.js';

const DOUBAO_BOT_ID = '7338286299411103781';
const DOUBAO_PC_VERSION = '3.13.0';
const DOUBAO_VERSION_CODE = '20800';
const DOUBAO_AID = '497858';

const DOUBAO_ATTACHMENT_BLOCK = 10052;

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function buildCompletionUrl(auth) {
    const url = new URL('https://www.doubao.com/chat/completion');
    url.searchParams.set('aid', DOUBAO_AID);
    url.searchParams.set('device_id', auth.deviceId);
    url.searchParams.set('device_platform', 'web');
    url.searchParams.set('fp', auth.fp);
    url.searchParams.set('language', 'zh');
    url.searchParams.set('pc_version', DOUBAO_PC_VERSION);
    url.searchParams.set('pkg_type', 'release_version');
    url.searchParams.set('real_aid', DOUBAO_AID);
    url.searchParams.set('region', '');
    url.searchParams.set('samantha_web', '1');
    url.searchParams.set('sys_region', '');
    url.searchParams.set('tea_uuid', auth.teaUuid);
    url.searchParams.set('use-olympus-account', '1');
    url.searchParams.set('version_code', DOUBAO_VERSION_CODE);
    url.searchParams.set('web_id', auth.webId);
    url.searchParams.set('web_tab_id', generateUUID());
    return url.toString();
}

async function buildPayload(prompt, conversationId, replyMessageId, fp, files) {
    const localConversationId = conversationId || `local_${Date.now()}`;
    const localMessageId = generateUUID();
    const contentBlocks = [];
    let preGenerateId = '';

    if (files && files.length > 0) {
        const uploadPlans = files.map((file) => ({
            file,
            identifier: generateUUID(),
            localMessageId
        }));
        const attachments = await uploadDoubaoImagesFromPage(uploadPlans);

        for (const attachment of attachments) {
            const preHandleResult = await preHandleDoubaoImage(attachment, localMessageId, preGenerateId);
            if (preHandleResult?.pre_generate_id) {
                preGenerateId = preHandleResult.pre_generate_id;
            }
        }

        contentBlocks.push({
            block_type: DOUBAO_ATTACHMENT_BLOCK,
            content: {
                attachment_block: {
                    attachments
                },
                pc_event_block: ''
            },
            block_id: generateUUID(),
            parent_id: '',
            meta_info: [],
            append_fields: []
        });
    }

    contentBlocks.push({
        block_type: 10000,
        content: {
            text_block: {
                text: prompt,
                icon_url: '',
                icon_url_dark: '',
                summary: ''
            },
            pc_event_block: ''
        },
        block_id: generateUUID(),
        parent_id: '',
        meta_info: [],
        append_fields: []
    });

    return {
        client_meta: {
            local_conversation_id: localConversationId,
            conversation_id: conversationId || '',
            bot_id: DOUBAO_BOT_ID,
            last_section_id: '',
            last_message_index: null
        },
        messages: [
            {
                local_message_id: localMessageId,
                content_block: contentBlocks,
                message_status: 0
            }
        ],
        option: {
            send_message_scene: '',
            create_time_ms: Date.now(),
            collect_id: '',
            is_audio: false,
            answer_with_suggest: false,
            tts_switch: false,
            need_deep_think: 0,
            click_clear_context: false,
            from_suggest: false,
            is_regen: false,
            is_replace: false,
            disable_sse_cache: false,
            select_text_action: '',
            resend_for_regen: false,
            scene_type: 0,
            unique_key: generateUUID(),
            start_seq: 0,
            need_create_conversation: !conversationId,
            conversation_init_option: {
                need_ack_conversation: true
            },
            regen_query_id: [],
            edit_query_id: [],
            regen_instruction: '',
            no_replace_for_regen: false,
            message_from: 0,
            shared_app_name: '',
            sse_recv_event_options: {
                support_chunk_delta: true
            },
            is_ai_playground: false,
            pre_generate_id: preGenerateId || undefined
        },
        ext: {
            fp,
            use_deep_think: '0',
            conversation_init_option: '{"need_ack_conversation":true}',
            commerce_credit_config_enable: '0',
            sub_conv_firstmet_type: '1'
        }
    };
}

function isAuthError(message) {
    return /login|auth|401|403|cookie|doubao authentication/i.test(message || '');
}

function parseEventData(raw) {
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

export class DoubaoWebProvider {
    async sendMessage(prompt, conversationId, replyMessageId, files, signal, onUpdate) {
        const auth = await getDoubaoAuth();
        const payload = await buildPayload(prompt, conversationId, replyMessageId, auth.fp, files);
        const endpoint = buildCompletionUrl(auth);

        const response = await fetch(endpoint, {
            method: 'POST',
            signal,
            headers: {
                'content-type': 'application/json',
                'accept': 'text/event-stream',
                'cookie': auth.cookieHeader,
                'user-agent': navigator.userAgent || 'Mozilla/5.0'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            if (response.status === 401 || response.status === 403) {
                await clearDoubaoAuth();
            }
            throw new Error(errorText || `Doubao request failed (${response.status})`);
        }

        if (!response.body) {
            throw new Error('Doubao returned an empty response body.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let buffer = '';
        let fullText = '';
        let context = {
            doubaoConversationId: conversationId || '',
            doubaoSectionId: '',
            doubaoReplyMessageId: replyMessageId || '',
            doubaoBotId: DOUBAO_BOT_ID
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let delimiterIndex;
            while ((delimiterIndex = buffer.indexOf('\n\n')) !== -1) {
                const rawEvent = buffer.slice(0, delimiterIndex);
                buffer = buffer.slice(delimiterIndex + 2);
                if (!rawEvent.trim()) continue;

                let eventName = '';
                let dataStr = '';
                const lines = rawEvent.split('\n');
                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        eventName = line.slice(6).trim();
                    } else if (line.startsWith('data:')) {
                        dataStr += (dataStr ? '\n' : '') + line.slice(5).trim();
                    }
                }

                if (!dataStr) continue;

                const data = parseEventData(dataStr);
                if (!data) {
                    continue;
                }

                if (eventName === 'SSE_ACK') {
                    const ack = data.ack_client_meta || {};
                    context.doubaoConversationId = ack.conversation_id || context.doubaoConversationId;
                    context.doubaoSectionId = ack.section_id || context.doubaoSectionId;
                } else if (eventName === 'STREAM_MSG_NOTIFY') {
                    const meta = data.meta || {};
                    context.doubaoConversationId = meta.conversation_id || context.doubaoConversationId;
                    context.doubaoSectionId = meta.section_id || context.doubaoSectionId;
                    context.doubaoReplyMessageId = meta.message_id || context.doubaoReplyMessageId;
                } else if (eventName === 'CHUNK_DELTA') {
                    if (data.text) {
                        fullText += data.text;
                        if (onUpdate) onUpdate(fullText, null);
                    }
                } else if (eventName === 'SSE_REPLY_END') {
                    continue;
                }
            }
        }

        return {
            text: fullText,
            thoughts: null,
            images: [],
            context
        };
    }

    async resetAuth() {
        await clearDoubaoAuth();
    }
}

export const doubaoWebProvider = new DoubaoWebProvider();

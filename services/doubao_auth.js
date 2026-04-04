let cachedAuthData = null;
const DOUBAO_AUTH_STORAGE_KEY = 'doubaoAuthCache';

function getCookieValue(cookieList, name) {
    const item = (cookieList || []).find((cookie) => cookie.name === name);
    return item ? item.value : '';
}

function normalizeCookieHeader(cookieList) {
    return (cookieList || []).map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}

async function persistDoubaoAuth(auth) {
    await chrome.storage.local.set({ [DOUBAO_AUTH_STORAGE_KEY]: auth });
}

async function restoreDoubaoAuth() {
    const stored = await chrome.storage.local.get([DOUBAO_AUTH_STORAGE_KEY]);
    return stored[DOUBAO_AUTH_STORAGE_KEY] || null;
}

function hasCompleteAuth(auth) {
    return !!(
        auth &&
        auth.cookieHeader &&
        auth.fp &&
        auth.deviceId &&
        auth.webId &&
        auth.teaUuid
    );
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function queryDoubaoTab() {
    const tabs = await new Promise((resolve) => {
        chrome.tabs.query({ url: '*://www.doubao.com/*' }, (results) => resolve(results || []));
    });

    if (!tabs.length) {
        const fallbackTabs = await new Promise((resolve) => {
            chrome.tabs.query({ url: '*://doubao.com/*' }, (results) => resolve(results || []));
        });
        if (fallbackTabs.length) {
            return fallbackTabs[0];
        }
    }

    if (!tabs.length) {
        throw new Error('Doubao authentication failed. Please open https://www.doubao.com/chat/ and log in first.');
    }

    return tabs[0];
}

async function readDoubaoIdsFromPage(tabId) {
    const results = await chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: () => {
            const samantha = JSON.parse(localStorage.getItem('samantha_web_web_id') || '{}');
            const tea = JSON.parse(localStorage.getItem('__tea_cache_tokens_497858') || '{}');
            return {
                deviceId: samantha.web_id || '',
                webId: tea.web_id || '',
                teaUuid: tea.web_id || ''
            };
        }
    });

    return results?.[0]?.result || { deviceId: '', webId: '', teaUuid: '' };
}

export async function requestDoubaoAuthFromPage() {
    const tab = await queryDoubaoTab();
    const tabId = tab.id;

    const cookieList = await new Promise((resolve) => {
        chrome.cookies.getAll({ domain: '.doubao.com' }, (cookies) => resolve(cookies || []));
    });

    const ids = await readDoubaoIdsFromPage(tabId);
    const fp = getCookieValue(cookieList, 's_v_web_id');
    const cookieHeader = normalizeCookieHeader(cookieList);

    cachedAuthData = {
        cookieList,
        cookieHeader,
        fp,
        deviceId: ids.deviceId || '',
        webId: ids.webId || '',
        teaUuid: ids.teaUuid || '',
        timestamp: Date.now(),
        tabId
    };

    if (!cachedAuthData.cookieHeader || !cachedAuthData.fp || !cachedAuthData.deviceId || !cachedAuthData.webId || !cachedAuthData.teaUuid) {
        throw new Error('Doubao authentication failed. Please ensure Doubao is open and fully logged in.');
    }

    await persistDoubaoAuth(cachedAuthData);
    return cachedAuthData;
}

export async function uploadDoubaoImage(file) {
    const auth = await requestDoubaoAuthFromPage();
    const extension = (file.name && file.name.includes('.')) ? file.name.slice(file.name.lastIndexOf('.')) : '.png';
    const fileSize = Math.ceil((file.base64.length * 3) / 4);

    const applyUrl = new URL('https://www.doubao.com/top/v1');
    applyUrl.searchParams.set('Action', 'ApplyImageUpload');
    applyUrl.searchParams.set('Version', '2018-08-01');
    applyUrl.searchParams.set('ServiceId', 'a9rns2rl98');
    applyUrl.searchParams.set('NeedFallback', 'true');
    applyUrl.searchParams.set('FileSize', String(fileSize));
    applyUrl.searchParams.set('FileExtension', extension);
    applyUrl.searchParams.set('s', Math.random().toString(36).slice(2));

    const applyResponse = await fetch(applyUrl.toString(), {
        method: 'GET',
        headers: {
            'cookie': auth.cookieHeader,
            'user-agent': navigator.userAgent || 'Mozilla/5.0',
            'referer': 'https://www.doubao.com/chat/'
        },
        credentials: 'include'
    });

    if (!applyResponse.ok) {
        throw new Error(`Doubao image upload apply failed (${applyResponse.status})`);
    }

    const applyJson = await applyResponse.json();
    const uploadAddress = applyJson?.Result?.UploadAddress;
    const storeInfo = uploadAddress?.StoreInfos?.[0];
    const uploadHost = uploadAddress?.UploadHosts?.[0];
    const sessionKey = uploadAddress?.SessionKey;

    if (!storeInfo || !uploadHost || !sessionKey) {
        throw new Error('Doubao image upload apply returned incomplete data.');
    }

    const blob = dataUrlToBlob(file.base64);
    const uploadUrl = `https://${uploadHost}/upload/v1/${storeInfo.StoreUri}`;
    const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'authorization': storeInfo.Auth,
            'content-type': 'application/octet-stream',
            'content-disposition': `attachment; filename="${file.name || 'image.png'}"`,
            'x-storage-u': auth.webId,
            'referer': 'https://www.doubao.com/'
        },
        body: blob
    });

    if (!uploadResponse.ok) {
        throw new Error(`Doubao image upload failed (${uploadResponse.status})`);
    }

    const commitUrl = new URL('https://www.doubao.com/top/v1');
    commitUrl.searchParams.set('Action', 'CommitImageUpload');
    commitUrl.searchParams.set('Version', '2018-08-01');
    commitUrl.searchParams.set('ServiceId', 'a9rns2rl98');

    const commitResponse = await fetch(commitUrl.toString(), {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'cookie': auth.cookieHeader,
            'user-agent': navigator.userAgent || 'Mozilla/5.0',
            'referer': 'https://www.doubao.com/chat/'
        },
        body: JSON.stringify({ SessionKey: sessionKey })
    });

    if (!commitResponse.ok) {
        throw new Error(`Doubao image upload commit failed (${commitResponse.status})`);
    }

    const commitJson = await commitResponse.json();
    const pluginResult = commitJson?.Result?.PluginResult?.[0];
    const uri = pluginResult?.ImageUri || commitJson?.Result?.Results?.[0]?.Uri || '';

    if (!uri) {
        throw new Error('Doubao image upload commit returned no image uri.');
    }

    return {
        type: 1,
        identifier: generateUUID(),
        image: {
            name: file.name || 'image.png',
            uri,
            image_ori: {
                url: '',
                width: pluginResult?.ImageWidth || 0,
                height: pluginResult?.ImageHeight || 0,
                format: '',
                url_formats: {}
            }
        },
        parse_state: 0,
        review_state: 1,
        upload_status: 1,
        progress: 100,
        src: ''
    };
}

export async function uploadDoubaoImagesFromPage(files) {
    const auth = await getDoubaoAuth();
    if (!auth?.tabId) {
        throw new Error('Doubao image upload requires an open https://www.doubao.com/chat/ page.');
    }
    const results = await chrome.scripting.executeScript({
        target: { tabId: auth.tabId },
        world: 'MAIN',
        args: [files],
        func: async (inputFiles) => {
            const dataUrlToBlob = (dataUrl) => {
                const [header, base64] = dataUrl.split(',');
                const mime = header.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
                const binary = atob(base64);
                const array = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    array[i] = binary.charCodeAt(i);
                }
                return new Blob([array], { type: mime });
            };

            const buildId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });

            const uploadOne = async (inputFile) => {
                const file = inputFile?.file || inputFile;
                const identifier = inputFile?.identifier || buildId();
                const localMessageId = inputFile?.localMessageId || '';
                const extension = (file.name && file.name.includes('.')) ? file.name.slice(file.name.lastIndexOf('.')) : '.png';
                const base64Payload = file.base64.split(',')[1] || '';
                const fileSize = Math.ceil((base64Payload.length * 3) / 4);

                const applyUrl = new URL('https://www.doubao.com/top/v1');
                applyUrl.searchParams.set('Action', 'ApplyImageUpload');
                applyUrl.searchParams.set('Version', '2018-08-01');
                applyUrl.searchParams.set('ServiceId', 'a9rns2rl98');
                applyUrl.searchParams.set('NeedFallback', 'true');
                applyUrl.searchParams.set('FileSize', String(fileSize));
                applyUrl.searchParams.set('FileExtension', extension);
                applyUrl.searchParams.set('s', Math.random().toString(36).slice(2));

                const applyResp = await fetch(applyUrl.toString(), {
                    method: 'GET',
                    credentials: 'include'
                });
                if (!applyResp.ok) {
                    throw new Error(`ApplyImageUpload failed (${applyResp.status})`);
                }

                const applyJson = await applyResp.json();
                const uploadAddress = applyJson?.Result?.UploadAddress;
                const storeInfo = uploadAddress?.StoreInfos?.[0];
                const uploadHost = uploadAddress?.UploadHosts?.[0];
                const sessionKey = uploadAddress?.SessionKey;

                if (!storeInfo || !uploadHost || !sessionKey) {
                    throw new Error('ApplyImageUpload returned incomplete data');
                }

                const webId = JSON.parse(localStorage.getItem('__tea_cache_tokens_497858') || '{}').web_id || '';
                const blob = dataUrlToBlob(file.base64);
                const uploadResp = await fetch(`https://${uploadHost}/upload/v1/${storeInfo.StoreUri}`, {
                    method: 'POST',
                    headers: {
                        authorization: storeInfo.Auth,
                        'content-type': 'application/octet-stream',
                        'content-disposition': `attachment; filename="${file.name || 'image.png'}"`,
                        'x-storage-u': webId,
                        referer: 'https://www.doubao.com/'
                    },
                    body: blob
                });
                if (!uploadResp.ok) {
                    throw new Error(`TOS upload failed (${uploadResp.status})`);
                }

                const commitUrl = new URL('https://www.doubao.com/top/v1');
                commitUrl.searchParams.set('Action', 'CommitImageUpload');
                commitUrl.searchParams.set('Version', '2018-08-01');
                commitUrl.searchParams.set('ServiceId', 'a9rns2rl98');

                const commitResp = await fetch(commitUrl.toString(), {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ SessionKey: sessionKey })
                });
                if (!commitResp.ok) {
                    throw new Error(`CommitImageUpload failed (${commitResp.status})`);
                }

                const commitJson = await commitResp.json();
                const pluginResult = commitJson?.Result?.PluginResult?.[0];
                const uri = pluginResult?.ImageUri || commitJson?.Result?.Results?.[0]?.Uri || '';
                if (!uri) {
                    throw new Error('CommitImageUpload returned no image uri');
                }

                return {
                    type: 1,
                    identifier,
                    image: {
                        name: file.name || 'image.png',
                        uri,
                        image_ori: {
                            url: '',
                            width: pluginResult?.ImageWidth || 0,
                            height: pluginResult?.ImageHeight || 0,
                            format: '',
                            url_formats: {}
                        }
                    },
                    parse_state: 0,
                    review_state: 1,
                    upload_status: 1,
                    progress: 100,
                    src: ''
                };
            };

            const attachments = [];
            for (const file of inputFiles || []) {
                attachments.push(await uploadOne(file));
            }
            return attachments;
        }
    });

    return results?.[0]?.result || [];
}

export async function preHandleDoubaoImage(attachment, localMessageId, preGenerateId = '') {
    const auth = await getDoubaoAuth();
    if (!auth?.tabId) {
        throw new Error('Doubao image upload requires an open https://www.doubao.com/chat/ page.');
    }
    const imageKey = attachment?.image?.uri || '';
    const identifier = attachment?.identifier || generateUUID();
    const results = await chrome.scripting.executeScript({
        target: { tabId: auth.tabId },
        world: 'MAIN',
        args: [imageKey, identifier, localMessageId, preGenerateId],
        func: async (imageKeyArg, identifierArg, messageId, currentPreGenerateId) => {
            const samantha = JSON.parse(localStorage.getItem('samantha_web_web_id') || '{}');
            const tea = JSON.parse(localStorage.getItem('__tea_cache_tokens_497858') || '{}');
            const webTabId = crypto.randomUUID();
            const url = new URL('https://www.doubao.com/alice/message/pre_handle_v2_without_conv');
            url.searchParams.set('version_code', '20800');
            url.searchParams.set('language', 'zh');
            url.searchParams.set('device_platform', 'web');
            url.searchParams.set('aid', '497858');
            url.searchParams.set('real_aid', '497858');
            url.searchParams.set('pkg_type', 'release_version');
            url.searchParams.set('device_id', samantha.web_id || '');
            url.searchParams.set('pc_version', '3.13.0');
            url.searchParams.set('web_id', tea.web_id || '');
            url.searchParams.set('tea_uuid', tea.web_id || '');
            url.searchParams.set('region', '');
            url.searchParams.set('sys_region', '');
            url.searchParams.set('samantha_web', '1');
            url.searchParams.set('use-olympus-account', '1');
            url.searchParams.set('web_tab_id', webTabId);

            const body = {
                uplink_entity: {
                    entity_type: 2,
                    entity_content: {
                        image: {
                            key: imageKeyArg
                        }
                    },
                    identifier: identifierArg
                },
                bot_id: '7338286299411103781',
                local_message_id: messageId
            };

            if (currentPreGenerateId) {
                body.pre_generate_id = currentPreGenerateId;
            }

            const resp = await fetch(url.toString(), {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            const json = await resp.json();
            return {
                ok: resp.ok,
                status: resp.status,
                json
            };
        }
    });

    const result = results?.[0]?.result;
    if (!result?.ok || result?.json?.code !== 0) {
        throw new Error('Doubao image pre-handle failed.');
    }
    return result.json?.data || null;
}

export async function getDoubaoAuth() {
    if (cachedAuthData && Date.now() - cachedAuthData.timestamp < 30 * 60 * 1000 && hasCompleteAuth(cachedAuthData)) {
        return cachedAuthData;
    }

    const restoredAuth = await restoreDoubaoAuth();
    if (restoredAuth && Date.now() - restoredAuth.timestamp < 30 * 60 * 1000 && hasCompleteAuth(restoredAuth)) {
        cachedAuthData = restoredAuth;
        return cachedAuthData;
    }

    try {
        return await requestDoubaoAuthFromPage();
    } catch (error) {
        if (hasCompleteAuth(cachedAuthData)) {
            return cachedAuthData;
        }
        if (restoredAuth && hasCompleteAuth(restoredAuth)) {
            cachedAuthData = restoredAuth;
            return cachedAuthData;
        }
        throw error;
    }
}

export function hasDoubaoAuth() {
    return hasCompleteAuth(cachedAuthData);
}

export async function clearDoubaoAuth() {
    cachedAuthData = null;
    await chrome.storage.local.remove([DOUBAO_AUTH_STORAGE_KEY]);
}

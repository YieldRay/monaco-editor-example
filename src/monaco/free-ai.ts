async function request({
    url,
    body,
    signal,
    token,
}: {
    url: string;
    body: object;
    signal?: AbortSignal;
    token?: string;
}) {
    const response = await fetch(url, {
        signal,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
}

export function openrouter(body: object, signal?: AbortSignal) {
    return request({
        url: "https://yieldray-openrouter.web.val.run/v1/chat/completions",
        body: {
            model: "google/gemini-2.0-flash-exp:free",
            ...body,
        },
        signal,
    });
}

export async function nahcrof(body: object, signal?: AbortSignal) {
    const models = [
        "llama3-70b",
        "llama3.3-70b",
        "llama3.1-tulu3-405b",
        "llama3.1-405b",
        "llama3.1-8b",
        "llama3-8b",
        "llama3.2-1b",
    ];

    for (const model of models) {
        return await request({
            url: "https://yieldray-nahcrof.web.val.run/v1/chat/completions",
            body: {
                model,
                ...body,
            },
            signal,
        });
    }
    return Promise.reject();
}

export function pollinations(body: object, signal?: AbortSignal) {
    return request({
        url: "https://proxy.scalar.com/?scalar_url=https://api.pollinations.ai/v1/chat/completions",
        body: {
            model: "qwen-coder",
            ...body,
        },
        signal,
    });
}

export function qwq(body: object, signal?: AbortSignal) {
    return request({
        url: "https://api.suanli.cn/v1/chat/completions",
        body: {
            model: "free:QwQ-32B",
            ...body,
        },
        signal,
        token: "sk-W0rpStc95T7JVYVwDYc29IyirjtpPPby6SozFMQr17m8KWeo",
    });
}

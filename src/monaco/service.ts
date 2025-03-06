import { createPromptMessages, systemMessage } from "./preprocess";
import { extractFirstCodeBlockContent } from "./postprocess";

/**
 * this is just a demo
 */
export async function chatCompletions(
    textBeforeCursor: string,
    textAfterCursor: string,
    signal?: AbortSignal,
    filepath?: string
) {
    const params = {
        messages: createPromptMessages({
            textBeforeCursor,
            textAfterCursor,
            filepath,
            systemMessage,
        }),
        max_completion_tokens: 1000,
        frequency_penalty: 0.5,
        presence_penalty: -0.5,
        temperature: 0.8,
    };
    try {
        const resp = await fetch("https://text.pollinations.ai/openai", {
            signal,
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                model: "qwen-coder",
                ...params,
            }),
        });
        if (resp.ok) {
            const json = await resp.json();
            return extractFirstCodeBlockContent(json.choices[0].message.content);
        }
    } catch {}

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
        try {
            const resp = await fetch("https://yieldray-nahcrof.web.val.run/v1/chat/completions", {
                signal,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // https://platform.openai.com/docs/api-reference/chat/create
                body: JSON.stringify({
                    model,
                    ...params,
                }),
            });
            if (!resp.ok) continue;
            const json = await resp.json();
            return extractFirstCodeBlockContent(json.choices[0].message.content);
        } catch {}
    }

    throw new Error("Failed to get completions");
}

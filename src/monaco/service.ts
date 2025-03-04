import { createPromptMessages } from "./preprocess";
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
                    messages: createPromptMessages({
                        textBeforeCursor,
                        textAfterCursor,
                        filepath,
                        systemMessage:
                            "You are an expert code assistant completing code in an editor. Provide concise, accurate code that seamlessly integrates with the existing context.",
                    }),
                    max_completion_tokens: 1000,
                    frequency_penalty: 0.5,
                    presence_penalty: -0.5,
                    temperature: 0.8,
                }),
            });
            if (!resp.ok) continue;
            const json = await resp.json();
            return extractFirstCodeBlockContent(json.choices[0].message.content);
        } catch (e) {
            console.error(model, e);
        }
    }

    throw new Error("Failed to get completions");
}

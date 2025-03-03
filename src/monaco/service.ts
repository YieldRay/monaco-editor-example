const CURSOR_PLACEHOLDER = "<|developer_cursor_is_here|>";

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
        "llama3-8b",
        "llama3.1-8b",
        "llama3.3-70b",
        "llama3.2-1b",
        "llama3-70b",
        "llama3.1-405b",
        "llama3.1-tulu3-405b",
    ].reverse();

    for (const model of models) {
        try {
            const resp = await fetch("https://yieldray-nahcrof.web.val.run/v1/chat/completions", {
                signal,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model,
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are an expert code assistant completing code in an editor. Provide concise, accurate code that seamlessly integrates with the existing context. Never use markdown code block syntax.",
                        },
                        {
                            role: "user",
                            content:
                                `**Current file(/root/project/main.c):**\n` +
                                `char *strcpy(char *dest, const char *source)
{
    ${CURSOR_PLACEHOLDER}
    while (*dest++ = *source++)
        ;
    return ptr;
}`,
                        },
                        {
                            role: "assistant",
                            content: "char *ptr = dest;",
                        },
                        {
                            role: "user",
                            content:
                                `**Current file${filepath ? `(${filepath})` : ""}:**` +
                                `\n${textBeforeCursor}${CURSOR_PLACEHOLDER}${textAfterCursor}`,
                        },
                    ],
                    max_tokens: 1000,
                }),
            });
            if (!resp.ok) continue;
            const json = await resp.json();
            return json.choices[0].message.content as string;
        } catch (e) {
            console.error(model, e);
        }
    }

    throw new Error("Failed to get completions");
}

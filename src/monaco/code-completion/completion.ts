import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { createPromptMessages, systemMessage } from "./preprocess";
import { extractFirstCodeBlockContent } from "./postprocess";
import type { ProvideInlineCompletions } from "./register";

export function chatCompletions(
    facade: (
        textBeforeCursor: string,
        textAfterCursor: string,
        filepath: string,
        signal: AbortSignal
    ) => Promise<string>,
    force = false
): ProvideInlineCompletions {
    return async (model, position, _context, token) => {
        const textBeforeCursor = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        });
        const endLineNumber = model.getLineCount();
        const textAfterCursor = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber,
            endColumn: model.getLineMaxColumn(endLineNumber),
        });
        const filepath = model.uri.path;
        console.debug({ textBeforeCursor, textAfterCursor });
        const ac = new AbortController();
        token.onCancellationRequested(() => ac.abort("CancellationRequested"));

        const insertText = await facade(textBeforeCursor, textAfterCursor, filepath, ac.signal);
        if (!insertText) return null;

        // force the completion to be inserted at the cursor position
        const range = force
            ? new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
              )
            : undefined;

        const inlineCompletions: monaco.languages.InlineCompletions = {
            items: [{ insertText, range, completeBracketPairs: true }],
            enableForwardStability: true,
        };
        return inlineCompletions;
    };
}

/**
 * this is just a demo
 */
export function chatCompletionsDemo(): ProvideInlineCompletions {
    return chatCompletions(async (textBeforeCursor, textAfterCursor, filepath, signal) => {
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

        const pollinationsAI = async () => {
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
            return Promise.reject();
        };

        const nahcrofAI = async () => {
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
                    const resp = await fetch(
                        "https://yieldray-nahcrof.web.val.run/v1/chat/completions",
                        {
                            signal,
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            // https://platform.openai.com/docs/api-reference/chat/create
                            body: JSON.stringify({
                                model,
                                ...params,
                            }),
                        }
                    );
                    if (!resp.ok) continue;
                    const json = await resp.json();
                    return extractFirstCodeBlockContent(json.choices[0].message.content);
                } catch {}
            }
            return Promise.reject();
        };

        const qwq = async () => {
            const resp = await fetch("https://api.suanli.cn/v1/chat/completions", {
                signal,
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    Authorization: "Bearer sk-W0rpStc95T7JVYVwDYc29IyirjtpPPby6SozFMQr17m8KWeo",
                },
                body: JSON.stringify({
                    model: "free:QwQ-32B",
                    ...params,
                }),
            });
            if (resp.ok) {
                const json = await resp.json();
                return extractFirstCodeBlockContent(json.choices[0].message.content);
                // TODO: remove the <think> tag
            }
            return Promise.reject();
        };

        return fallbacks(pollinationsAI, nahcrofAI, qwq);
    }, true);
}

async function fallbacks<T>(...fns: Array<() => Promise<T>>) {
    for (const fn of fns) {
        try {
            const result = await fn();
            return result;
        } catch (e) {
            if (e) console.debug(e);
        }
    }
    throw new Error("No fallback available");
}

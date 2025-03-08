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
        token.onCancellationRequested(() => ac.abort());

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

        throw new Error("Failed to get completions");
    }, true);
}

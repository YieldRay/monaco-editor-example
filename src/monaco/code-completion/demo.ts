import type { ProvideInlineCompletions } from "./register";
import { chatCompletions } from "./completion";
import { createPromptMessages, systemMessage } from "./preprocess";
import { extractFirstCodeBlockContent } from "./postprocess";
import { pollinations, openrouter, nahcrof } from "../free-ai";

/**
 * this is just a demo, you can replace it with your own AI model
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

        return fallbacks(
            async () => {
                const json = await nahcrof(params, signal);
                return extractFirstCodeBlockContent(json.choices[0].message.content);
            },
            async () => {
                const json = await openrouter(params, signal);
                return extractFirstCodeBlockContent(json.choices[0].message.content);
            },
            async () => {
                const json = await pollinations(params, signal);
                return extractFirstCodeBlockContent(json.choices[0].message.content);
            }
        );
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

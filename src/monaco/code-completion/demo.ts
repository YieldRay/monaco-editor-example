import { chatCompletions } from "./completion";
import { pollinations, openrouter, nahcrof } from "../free-ai";
import { createCommonPayload, stripWithFirstCodeBlock } from "../prompt/process-common";
import { createFIMPayload, stripFIM } from "../prompt/process-fim";

/**
 * this is just a demo, you can replace it with your own AI model and params
 */
export const chatCompletionsDemo = chatCompletions(
    async (textBeforeCursor, textAfterCursor, filepath, signal) => {
        const params = createCommonPayload({
            textBeforeCursor,
            textAfterCursor,
            filepath,
        });

        return fallbacks(
            async () => {
                const payload = {
                    // https://ai.google.dev/gemma/docs/core/prompt-structure
                    model: "google/gemini-2.0-flash-exp:free",
                    ...createFIMPayload(textBeforeCursor, textAfterCursor),
                };
                const json = await openrouter(payload, signal);
                return stripFIM(json.choices[0].text);
            },
            async () => {
                const json = await nahcrof(params, signal);
                return stripWithFirstCodeBlock(json.choices[0].message.content);
            },
            async () => {
                const json = await pollinations(params, signal);
                return stripWithFirstCodeBlock(json.choices[0].message.content);
            }
        );
    },
    true
);

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

import { openrouter } from "../free-ai";
import { inlineChat } from "./completion";
import { stripMaybeMarkdown } from "../prompt/process-common";

/**
 * this is just a demo, you can replace it with your own AI model
 */
export const inlineChatDemo = inlineChat(
    async (userPromptText, afterLineNumber, beforeLineText, afterLineText, executeEdit, signal) => {
        const json = await openrouter(
            {
                messages: [
                    {
                        role: "system",
                        content: `You are now editing an code editor, all your response will be used for fill the placeholder.`,
                    },
                    {
                        role: "user",
                        content: `char *strcpy(char *dest, const char *source)\n${placeholder(
                            afterLineNumber
                        )}\n`,
                    },
                    {
                        role: "user",
                        content: `complete the code`,
                    },
                    {
                        role: "assistant",
                        content: `{
        char *ptr = dest;
        while (*dest++ = *source++)
            ;
        return ptr;
    }`,
                    },
                    {
                        role: "user",
                        content: `${beforeLineText}\n${placeholder(
                            afterLineNumber
                        )}\n${afterLineText}`,
                    },
                    {
                        role: "user",
                        content: userPromptText,
                    },
                ],
                max_completion_tokens: 1000,
                frequency_penalty: 0.5,
                presence_penalty: -0.5,
                temperature: 0.8,
            },
            signal
        );

        const completionText = stripMaybeMarkdown(json.choices[0].message.content);
        executeEdit(completionText);
    }
);

const placeholder = (afterLineNumber: number) => `<|line_${afterLineNumber}_placeholder_is_here|>`;

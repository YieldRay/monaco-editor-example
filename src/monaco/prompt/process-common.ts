/**
 * This prompt is for the common LLMs that may NOT follow FIM
 *
 * It add an extra user->assistant chat to hint the LLM
 */
const CURSOR_PLACEHOLDER = "<|developer_cursor_is_here|>";

function createUserMessage(context: {
    textBeforeCursor?: string;
    textAfterCursor?: string;
    filepath?: string;
}) {
    const { filepath, textBeforeCursor = "", textAfterCursor = "" } = context;

    let user: string;
    if (!context.filepath) {
        user = `The developer is editing the file and the content is as follows:`;
    } else {
        user = `The developer is editing file of path ${filepath} and the content is as follows:`;
    }

    user += `\n\n`;
    user += `${textBeforeCursor}${CURSOR_PLACEHOLDER}${textAfterCursor}`;
    return user;
}

const systemMessage =
    "You are an expert code assistant completing code in an editor. Provide concise, accurate code that seamlessly integrates with the existing context. Return CODE ONLY and NO extra markdown code block is required.";

export function createCommonPayload(context: {
    textBeforeCursor: string;
    textAfterCursor: string;
    filepath?: string;
    systemMessage?: string;
}) {
    const messages = [
        {
            role: "system",
            content: context.systemMessage || systemMessage,
        },
        // give an example of a code completion
        {
            role: "user",
            content:
                createUserMessage({
                    filepath: "/root/project/example.c",
                }) +
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
        // the actual code completion
        {
            role: "user",
            content: createUserMessage(context),
        },
    ];

    return {
        messages,
        max_completion_tokens: 1000,
        frequency_penalty: 0.5,
        presence_penalty: -0.5,
        temperature: 0.8,
    };
}

/**
 * LLMs may reply markdown code block, we need to strip it out
 */
export function stripMaybeMarkdown(text: string) {
    let result = "";

    for (let line of text.split("\n")) {
        if (line.startsWith("```")) {
            continue; // remove code blocks
        }
        result += line + "\n";
    }

    return result.trimEnd();
}

export function stripWithFirstCodeBlock(text: string) {
    let result = "";
    let inFirstCodeBlock = false;

    for (let line of text.split("\n")) {
        if (line.startsWith("```") && !inFirstCodeBlock) {
            inFirstCodeBlock = true;
            continue;
        }

        if (inFirstCodeBlock) {
            if (line.startsWith("```")) {
                break; // end of first code block
            }

            result += line + "\n";
        }
    }

    if (!inFirstCodeBlock) {
        // no code block found
        return text.trimEnd();
    }

    return result.trimEnd();
}

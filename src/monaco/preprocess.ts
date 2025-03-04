const CURSOR_PLACEHOLDER = "<|developer_cursor_is_here|>";

function insertCursorPlaceholder(textBeforeCursor: string, textAfterCursor: string) {
    return `${textBeforeCursor}${CURSOR_PLACEHOLDER}${textAfterCursor}`;
}

export function createUserMessage(context: {
    textBeforeCursor?: string;
    textAfterCursor?: string;
    filepath?: string;
}) {
    let user: string;
    if (!context.filepath) {
        user = `The developer is editing the file and the content is as follows:`;
    } else {
        user = `The developer is editing file of path ${context.filepath} and the content is as follows:`;
    }

    user += `\n\n`;
    if (context.textBeforeCursor || context.textAfterCursor) {
        user += insertCursorPlaceholder(
            context.textBeforeCursor || "",
            context.textAfterCursor || ""
        );
    }
    return user;
}

const systemMessage =
    "You are an expert code assistant completing code in an editor. Provide concise, accurate code that seamlessly integrates with the existing context.";

export function createPromptMessages(context: {
    textBeforeCursor: string;
    textAfterCursor: string;
    filepath?: string;
    systemMessage?: string;
}): Array<{
    role: string;
    content: string;
}> {
    return [
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
}

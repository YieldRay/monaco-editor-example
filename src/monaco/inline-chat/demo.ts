import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { openrouter } from "../free-ai";
import { formatMaybeMarkdownSyntax } from "../code-completion/postprocess";

const placeholder = (afterLineNumber: number) => `<|line_${afterLineNumber}_placeholder_is_here|>`;

export async function inlineChatDemo(
    text: string,
    editor: monaco.editor.ICodeEditor,
    afterLineNumber: number,
    signal: AbortSignal
) {
    const model = editor.getModel()!;
    const endLineNumber = model.getLineCount();
    const isCurrentLineBlank = model.getLineContent(afterLineNumber).trim() === "";
    const isNextLineBlank =
        afterLineNumber + 1 <= endLineNumber
            ? model.getLineContent(afterLineNumber + 1).trim() === ""
            : true;

    // all the code before the line
    let beforeLineText;
    if (afterLineNumber === 0) {
        beforeLineText = "";
    } else {
        beforeLineText = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: afterLineNumber,
            endColumn: model.getLineMaxColumn(afterLineNumber),
        });
    }

    // all the code after the line
    const afterLineText = model.getValueInRange({
        startLineNumber: afterLineNumber + 1,
        endLineNumber,
        startColumn: 1,
        endColumn: model.getLineMaxColumn(endLineNumber),
    });

    console.debug({ beforeLineText, afterLineText });

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
                    content: `${beforeLineText}\n${placeholder(afterLineNumber)}\n${afterLineText}`,
                },
                {
                    role: "user",
                    content: text,
                },
            ],
            max_completion_tokens: 1000,
            frequency_penalty: 0.5,
            presence_penalty: -0.5,
            temperature: 0.8,
        },
        signal
    );

    let filled = formatMaybeMarkdownSyntax(json.choices[0].message.content);
    if (!isCurrentLineBlank) filled = "\n" + filled;
    if (!isNextLineBlank) filled = filled + "\n";

    // now we add the filled content to the editor
    editor.executeEdits("monaco-inline-chat", [
        {
            range: new monaco.Range(afterLineNumber + 1, 1, afterLineNumber + 1, 1),
            text: filled,
            forceMoveMarkers: true,
        },
    ]);
}

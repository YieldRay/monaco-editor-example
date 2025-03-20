import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { OnInlineChatSend } from "./register";

/**
 * facade for OnInlineChatSend
 */
export function inlineChat(
    facade: (
        userPromptText: string,
        afterLineNumber: number,
        beforeLineText: string,
        afterLineText: string,
        // TODO: support steaming text, so the param can be also a stream
        executeEdit: (completionText: string) => void,
        signal: AbortSignal
    ) => Promise<void>
): OnInlineChatSend {
    return (
        userPromptText: string,
        editor: monaco.editor.ICodeEditor,
        afterLineNumber: number,
        signal: AbortSignal
    ) => {
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

        console.debug({ afterLineNumber, beforeLineText, afterLineText });

        const executeEdit = (completionText: string) => {
            let filled = completionText;
            if (!isCurrentLineBlank) filled = "\n" + filled;
            if (!isNextLineBlank) filled = filled + "\n";

            editor.executeEdits("monaco-inline-chat", [
                {
                    range: new monaco.Range(afterLineNumber + 1, 1, afterLineNumber + 1, 1),
                    text: filled,
                    forceMoveMarkers: true,
                },
            ]);
        };

        return facade(
            userPromptText,
            afterLineNumber,
            beforeLineText,
            afterLineText,
            /**
             * utils to call `editor.executeEdits` with the correct range
             */
            executeEdit,
            signal
        );
    };
}

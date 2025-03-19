import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { ZoneWidget } from "./zone-widget";
import { createInlineChat } from "./dom";

/**
 * @param [afterLineNumber=0] The line that triggers the inline chat, content will be inserted after this line.
 */
export function registerInlineChat(
    editor: monaco.editor.ICodeEditor,
    onSend: (
        text: string,
        editor: monaco.editor.ICodeEditor,
        afterLineNumber: number,
        signal: AbortSignal
    ) => Promise<void>,
    afterLineNumber = 0,
    keybindings: number[] = [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI]
) {
    const { domNode, input, dispose } = createInlineChat({
        onSend: (text, signal) => {
            return onSend(text, editor, zw.afterLineNumber, signal);
        },
    });

    const zw = new ZoneWidget(editor, domNode, afterLineNumber);
    zw.hide();

    const action = monaco.editor.addEditorAction({
        id: "monaco-inline-chat",
        label: "Editor inline chat",
        keybindings,
        run: () => {
            const currentLineNumber = editor.getPosition()?.lineNumber ?? 0;
            zw.afterLineNumber = currentLineNumber;
            zw.show();
            input.focus();
        },
    });

    editor.onDidChangeCursorPosition(() => {
        zw.hide();
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            zw.hide();
        }
    });

    return {
        show: zw.show,
        hide: zw.hide,
        get afterLineNumber() {
            return zw.afterLineNumber;
        },
        set afterLineNumber(afterLineNumber: number) {
            zw.afterLineNumber = afterLineNumber;
        },
        dispose() {
            zw.dispose();
            action.dispose();
            dispose();
        },
    };
}

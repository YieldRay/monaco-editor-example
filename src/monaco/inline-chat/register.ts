import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { ZoneWidget } from "./zone-widget";
import { createInlineChat } from "./dom";

export interface OnInlineChatSend {
    (
        text: string,
        editor: monaco.editor.ICodeEditor,
        afterLineNumber: number,
        signal: AbortSignal
    ): Promise<void>;
}

/**
 * @param [afterLineNumber=0] The line that triggers the inline chat, content will be inserted after this line.
 */
export function registerInlineChat(
    editor: monaco.editor.ICodeEditor,
    options: {
        onSend: OnInlineChatSend;
        /**
         * @default [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI]
         */
        keybindings?: number[];
        afterLineNumber?: number;
    } & Partial<Omit<monaco.editor.IActionDescriptor, "run">>
) {
    const {
        onSend,
        afterLineNumber = 0,
        id = "monaco-inline-chat",
        label = "Editor inline chat",
        contextMenuGroupId = "navigation",
        keybindings = [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
        ...descriptor
    } = options;

    const { domNode, input, dispose } = createInlineChat({
        onSend: (text, signal) => {
            return onSend(text, editor, zw.afterLineNumber, signal);
        },
    });

    const zw = new ZoneWidget(editor, domNode, afterLineNumber);
    zw.hide();

    const action = monaco.editor.addEditorAction({
        id,
        label,
        keybindings,
        contextMenuGroupId,
        ...descriptor,
        // show the component after the current cursor line
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

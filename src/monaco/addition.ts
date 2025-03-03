import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

/**
 * editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Space, () => {});
 */
export function triggerInlineSuggest(editor: monaco.editor.ICodeEditor) {
    return editor.trigger("keyboard", "editor.action.inlineSuggest.trigger", {});
}

export function addAction({
    id = "triggerInlineSuggest",
    label = "Complete Code",
    contextMenuGroupId = "navigation",
    ...descriptor
}: Partial<monaco.editor.IActionDescriptor> = {}) {
    monaco.editor.addEditorAction({
        id,
        label,
        contextMenuGroupId,
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Space],
        run: (editor) => {
            triggerInlineSuggest(editor);
        },
        ...descriptor,
    });
}

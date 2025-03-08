import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { addStyle } from "../css";

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

export function getCursorDomNode(editor: monaco.editor.ICodeEditor) {
    return editor.getDomNode()?.querySelector(".cursors-layer .cursor") as HTMLElement | undefined;
}

export function setCursorToLoading(editor: monaco.editor.ICodeEditor): VoidFunction {
    const cursor = getCursorDomNode(editor);
    if (!cursor) return noop;

    const classname = "cursor-my-monaco-loading";
    cursor.classList.add(classname); // we should use class, as monaco will replace the style attribute
    const removeStyle = addStyle(/*css*/ `.${CSS.escape(classname)} {
            position: relative !important;
            visibility: visible !important;
            overflow: visible !important;
            background-color: transparent !important;
        }`);
    const style = ` style="position: absolute; top: 50%; transform: translateY(-50%)"`;
    const fontSize = editor.getOption(monaco.editor.EditorOption.fontSize);
    const svgSpinners270RingWithBg: string = `<svg xmlns="http://www.w3.org/2000/svg" width="${fontSize}" height="${fontSize}" viewBox="0 0 24 24"${style}><!-- Icon from SVG Spinners by Utkarsh Verma - https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE --><path fill="#888888" d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></svg>`;
    cursor.innerHTML = svgSpinners270RingWithBg;

    return () => {
        cursor.classList.remove(classname);
        cursor.innerHTML = "";
        removeStyle();
    };
}

const noop: VoidFunction = () => {};

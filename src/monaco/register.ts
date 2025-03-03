import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { EditorRegisteredState } from "./state";

export interface RegisterCompletionOptions {
    language?: monaco.languages.LanguageSelector;
    /** @default 400 */
    delay?: number;
    /** @default 10_000 */
    timeout?: number;
}

export function registerCompletion(
    editor: monaco.editor.IStandaloneCodeEditor,
    options?: RegisterCompletionOptions
): monaco.IDisposable {
    const state = EditorRegisteredState.attachEditor(editor, options);
    return {
        dispose: state.dispose.bind(state),
    };
}

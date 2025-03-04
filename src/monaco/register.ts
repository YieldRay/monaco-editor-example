import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { EditorRegisteredState } from "./state";
import { triggerInlineSuggest } from "./addition";

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
) {
    const state = EditorRegisteredState.attachEditor(editor, options);
    return {
        dispose: state.dispose.bind(state),
        trigger: () => triggerInlineSuggest(editor),
        addEventListener: state.addEventListener.bind(state) as AddEventListener,
        removeEventListener: state.removeEventListener.bind(state),
    };
}

interface AddEventListener {
    (
        type: "change",
        callback: $EventListenerOrEventListenerObject<
            | "prepare-completion"
            | "completion-pending"
            | "completion-error"
            | "completion-done"
            | "idle"
        > | null
    ): void;

    (type: "error", callback: $EventListenerOrEventListenerObject<unknown> | null): void;
}

type $EventListenerOrEventListenerObject<T> = $EventListener<T> | $EventListenerObject<T>;

interface $EventListener<T> {
    (evt: CustomEvent<T>): void;
}

interface $EventListenerObject<T> {
    handleEvent(object: CustomEvent<T>): void;
}

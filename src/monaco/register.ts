import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { EditorRegisteredState } from "./state";
import { triggerInlineSuggest } from "./addition";

export interface RegisterCompletionOptions {
    language?: monaco.languages.LanguageSelector;
    /** @default 400 */
    delay?: number;
    /** @default 10_000 */
    timeout?: number;
    /**
     * @link https://microsoft.github.io/monaco-editor/docs.html#interfaces/languages.InlineCompletionsProvider.html#provideInlineCompletions.provideInlineCompletions
     *
     * Provides inline completion items for the given position and document.
     * If inline completions are enabled, this method will be called whenever the user stopped typing.
     * It will also be called when the user explicitly triggers inline completions or explicitly asks for the next or previous inline completion.
     * In that case, all available inline completions should be returned.
     * context.triggerKind can be used to distinguish between these scenarios.
     *
     * Note that debouncing and many features are already implemented,
     * so you don't need reimplement it again */
    provideInlineCompletions?: (
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.InlineCompletionContext,
        token: monaco.CancellationToken
    ) => monaco.languages.ProviderResult<monaco.languages.InlineCompletions>;
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

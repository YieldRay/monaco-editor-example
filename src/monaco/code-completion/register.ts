import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { EditorRegisteredState, type State } from "./state";
import { triggerInlineSuggest, type addEditorAction } from "./addition";

export type ProvideInlineCompletions = (
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.InlineCompletionContext,
    token: monaco.CancellationToken
) => monaco.languages.ProviderResult<monaco.languages.InlineCompletions>;

export interface RegisterCompletionOptions {
    language?: monaco.languages.LanguageSelector;
    /**
     * After the user stopped typing, how long should we wait before we start fetching the completion
     * @default 400
     */
    delay?: number;
    /**
     * The timeout for the completion to be ready
     * @default 10_000
     */
    timeout?: number;
    /**
     * Replace the cursor with a spinning ring when loading, so you don't need implement it in your own
     */
    loadingCursor?: boolean;
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
    provideInlineCompletions: ProvideInlineCompletions;
    /**
     * If provided, this action will be added to the editor
     */
    editorAction?: boolean | Parameters<typeof addEditorAction>[0];
    /**
     * Check the cursor position before trigger the completion,
     * by default it will only trigger the completion when the cursor is at the end of the line
     * @default "end"
     */
    triggerPosition?: "anywhere" | "end";
}

/**
 * Register inline completion for the editor
 *
 * @param options the options for the completion, this is NOT changeable after the editor is registered,
 * so if you want to change the options, you need to dispose the current completion and register a new one
 * @returns a disposable object to dispose the completion, you can also listen to the completion event
 */
export function registerCompletion(
    editor: monaco.editor.IStandaloneCodeEditor,
    options: RegisterCompletionOptions
) {
    const state = EditorRegisteredState.attachEditor(editor, options);
    return {
        dispose: state.dispose.bind(state),
        /**
         * Trigger inline suggest manually
         */
        trigger: () => triggerInlineSuggest(editor),
        addEventListener: state.addEventListener.bind(state) as AddEventListener,
        removeEventListener: state.removeEventListener.bind(state),
    };
}

interface AddEventListener {
    (type: "change", callback: $EventListenerOrEventListenerObject<State> | null): void;
    (type: "error", callback: $EventListenerOrEventListenerObject<unknown> | null): void;
}

type $EventListenerOrEventListenerObject<T> = $EventListener<T> | $EventListenerObject<T>;

interface $EventListener<T> {
    (evt: CustomEvent<T>): void;
}

interface $EventListenerObject<T> {
    handleEvent(object: CustomEvent<T>): void;
}

import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { RegisterCompletionOptions } from "./register";
import { provideInlineCompletions } from "./completion";

const EDITOR_KEY = Symbol("EDITOR_KEY");

class Cancelled extends Error {
    name = "Cancelled";
    constructor() {
        super("Cancelled");
    }
}

/**
 * @internal
 * One editor can only have one state.
 * Note that the completion is registered for the entire app,
 * we need to make sure completion appears only for the registered one
 */
export class EditorRegisteredState extends EventTarget implements monaco.IDisposable {
    readonly editor: monaco.editor.IStandaloneCodeEditor;
    readonly delay: number;
    readonly timeout: number;
    private constructor(
        editor: monaco.editor.IStandaloneCodeEditor,
        options?: RegisterCompletionOptions
    ) {
        super();
        this.editor = editor;
        this.delay = options?.delay || 400;
        this.timeout = options?.timeout || 10_000;
    }

    static attachEditor(
        editor: monaco.editor.IStandaloneCodeEditor,
        options?: RegisterCompletionOptions
    ) {
        if (Reflect.has(editor, EDITOR_KEY)) {
            return Reflect.get(editor, EDITOR_KEY) as EditorRegisteredState;
        } else {
            // set the editor state
            const state = new EditorRegisteredState(editor, options);
            Reflect.set(editor, EDITOR_KEY, state);
            // listen to the events only once
            state.registerInlineCompletionsProvider();
            editor.onDidChangeModelLanguage(() => {
                state.registerInlineCompletionsProvider();
            });
            // auto dispose
            editor.onDidDispose(() => {
                state.dispose();
            });
            return state;
        }
    }

    private cancelLastInlineCompletion() {
        this.lastInlineCompletionAC?.abort(new Cancelled());
        clearTimeout(this.lastInlineCompletionTO);
    }

    private lastInlineCompletionAC?: AbortController;
    private lastInlineCompletionTO?: ReturnType<typeof setTimeout>;
    private inlineCompletionsProvider: monaco.languages.InlineCompletionsProvider = {
        provideInlineCompletions: async (model, position, context, token) => {
            // we only provide completions for the registered editor (model)
            if (model !== this.editor.getModel()) return null;
            console.debug("provideInlineCompletions", model, position, context, token);
            // cancel the last request
            this.cancelLastInlineCompletion();

            const ac = new AbortController();
            this.lastInlineCompletionAC = ac;

            this.lastInlineCompletionTO = setTimeout(() => {
                ac.abort(new Cancelled());
            }, this.timeout);

            const aborted = new Promise<never>((_, reject) => {
                ac.signal.addEventListener("abort", reject);
            });

            try {
                this.state = "prepare-completion";
                const inlineCompletions = await Promise.race([
                    aborted,
                    this.provideInlineCompletions(model, position, context, token, ac.signal),
                ]);
                this.state = "completion-pending";
                return inlineCompletions;
            } catch (e) {
                if (!(e instanceof Cancelled)) {
                    console.debug(e);
                    this.dispatchEvent(new CustomEvent("completion-error", { detail: e }));
                }
                this.state = "completion-error";
                return null;
            }
        },
        handleItemDidShow: (completions, item, updatedInsertText) => {
            console.debug("handleItemDidShow", completions, item, updatedInsertText);
            this.state = "completion-pending";
        },
        // Ctrl/⌘ →
        handlePartialAccept: (completions, item, acceptedCharacters, info) => {
            console.debug("handlePartialAccept", completions, item, acceptedCharacters, info);
        },
        freeInlineCompletions: (completions) => {
            console.debug("freeInlineCompletions", completions);
        },
    };

    private registerInlineCompletionsProviderResult?: monaco.IDisposable;
    private registerInlineCompletionsProvider() {
        // we only keep one inlineCompletionsProvider
        this.registerInlineCompletionsProviderResult?.dispose();
        // then register for any language
        const language = this.editor.getModel()?.getLanguageId();
        if (!language) return;
        this.registerInlineCompletionsProviderResult =
            monaco.languages.registerInlineCompletionsProvider(
                language,
                this.inlineCompletionsProvider
            );
    }

    dispose(): void {
        Reflect.deleteProperty(this.editor, EDITOR_KEY);
        this.registerInlineCompletionsProviderResult?.dispose();
    }

    private _state: "prepare-completion" | "completion-pending" | "completion-error" | "typing" =
        "typing";

    private set state(s: typeof this._state) {
        this._state = s;
        this.dispatchEvent(new CustomEvent("change", { detail: s }));
    }

    provideInlineCompletions(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.InlineCompletionContext,
        token: monaco.CancellationToken,
        signal: AbortSignal
    ): Promise<monaco.languages.ProviderResult<monaco.languages.InlineCompletions>> {
        return provideInlineCompletions(this, model, position, context, token, signal);
    }
}

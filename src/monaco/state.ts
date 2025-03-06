import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { RegisterCompletionOptions } from "./register";
import { provideInlineCompletions } from "./completion";

const EDITOR_KEY = Symbol("EDITOR_KEY");

class Cancelled<T = never> extends Error {
    name = "Cancelled";
    reason?: T;
    constructor(reason?: T) {
        super("Cancelled");
        this.reason = reason;
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

    /**
     * use this method to attach the editor
     */
    public static attachEditor(
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

    private lastInlineCompletionAC?: AbortController;
    private lastInlineCompletionTO?: ReturnType<typeof setTimeout>;
    private cleanLastDelay?: VoidFunction;
    private inlineCompletionsProvider: monaco.languages.InlineCompletionsProvider = {
        provideInlineCompletions: async (model, position, context, token) => {
            // we only provide completions for the registered editor (model)
            if (model !== this.editor.getModel()) return null;
            // control flow goes here, means that user has typed a character
            console.debug("provideInlineCompletions", { model, position, context, token });

            // cancel the last request
            this.lastInlineCompletionAC?.abort(new Cancelled("abort by new request"));
            clearTimeout(this.lastInlineCompletionTO);
            this.cleanLastDelay?.();

            // prepare a new request
            const ac = new AbortController();
            this.lastInlineCompletionAC = ac;
            const aborted = new Promise<never>((_, reject) =>
                ac.signal.addEventListener("abort", reject)
            );
            token.onCancellationRequested(() => ac.abort(new Cancelled("onCancellationRequested")));

            // waiting for delay
            this.state = "completion-delay";
            const { resolve, reject, promise: delayPromise } = promiseWithResolvers<void>();
            const timeoutId = setTimeout(resolve, this.delay);
            this.cleanLastDelay = () => {
                clearTimeout(timeoutId);
                reject(); // must resolve/reject the promise to prevent memory leak
            };
            try {
                await Promise.race([aborted, delayPromise]);
            } catch {
                return null;
            }

            // now we can start the request
            this.state = "completion-loading";

            // set the request timeout
            this.lastInlineCompletionTO = setTimeout(
                () => ac.abort(new Cancelled("request timeout")),
                this.timeout
            );

            try {
                const inlineCompletions = await Promise.race([
                    aborted,
                    this.provideInlineCompletions(
                        model,
                        position,
                        context,
                        token,
                        ac.signal // pass the signal, this is useful for aborting the `fetch`
                    ),
                ]);
                // request is completed, handleItemDidShow will be called
                this.state = "completion-ready";
                return inlineCompletions;
            } catch (reason) {
                if (reason instanceof Cancelled) {
                    return null;
                }

                console.debug("provideInlineCompletions error", reason);
                this.dispatchEvent(new CustomEvent("completion-error", { detail: reason }));
                if (ac === this.lastInlineCompletionAC) {
                    // make sure there is no new completion
                    this.state = "completion-error";
                }
            }
        },
        handleItemDidShow: (completions, item, updatedInsertText) => {
            console.debug("handleItemDidShow", { completions, item, updatedInsertText });
        },
        // Ctrl/⌘ →
        handlePartialAccept: (completions, item, acceptedCharacters, info) => {
            console.debug("handlePartialAccept", { completions, item, acceptedCharacters, info });
        },
        freeInlineCompletions: (completions) => {
            console.debug("freeInlineCompletions", { completions });
        },
    };

    private registerInlineCompletionsProviderResult?: monaco.IDisposable;
    /** this function should also be called after the language change */
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
        clearTimeout(this.lastInlineCompletionTO);
        this.cleanLastDelay?.();
    }

    private _state:
        | "completion-delay"
        | "completion-loading"
        | "completion-ready"
        | "completion-error"
        | "idle" = "idle";

    private set state(s: typeof this._state) {
        this._state = s;
        this.dispatchEvent(new CustomEvent("change", { detail: s }));
    }

    private provideInlineCompletions(
        model: monaco.editor.ITextModel,
        position: monaco.Position,
        context: monaco.languages.InlineCompletionContext,
        token: monaco.CancellationToken,
        signal: AbortSignal
    ): monaco.languages.ProviderResult<monaco.languages.InlineCompletions> {
        return provideInlineCompletions(model, position, context, token, signal);
    }
}

function promiseWithResolvers<T>() {
    // if ("withResolvers" in Promise) return Promise.withResolvers<T>();
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
}

import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { ProvideInlineCompletions, RegisterCompletionOptions } from "./register";
import { setCursorToLoading, addEditorAction, triggerInlineSuggest } from "./addition";

const EDITOR_KEY = Symbol("EDITOR_KEY");
const CANCELED = Symbol("CANCELED");

export type State =
    | "completion-delay"
    | "completion-loading"
    | "completion-ready"
    | "completion-error"
    | "idle";

// TODO: fire more events, like onCompletionShown, onCompletionAccepted, onCompletionRejected, etc.

/**
 * @internal
 * One editor can only have one state.
 * Note that the completion is registered for the entire app,
 * we need to make sure completion appears only for the registered editor.
 *
 * Also, MAKE SURE everything clean up correctly when the editor is disposed.
 */
export class EditorRegisteredState extends EventTarget implements monaco.IDisposable {
    readonly editor: monaco.editor.IStandaloneCodeEditor;
    readonly delay: number;
    readonly timeout: number;
    readonly manually: boolean;
    readonly triggerPosition: RegisterCompletionOptions["triggerPosition"];
    private provideInlineCompletions: ProvideInlineCompletions;
    private editorAction?: monaco.IDisposable;
    private constructor(
        editor: monaco.editor.IStandaloneCodeEditor,
        options: RegisterCompletionOptions
    ) {
        super();
        this.editor = editor;
        this.delay = options.delay || 400;
        this.timeout = options.timeout || 10_000;
        this.manually = !!options.manually;
        this.triggerPosition = options.triggerPosition
            ? options.triggerPosition
            : this.manually
            ? "anywhere" // if `manually` set to true, defaults to "anywhere"
            : "end"; // or default value is "end"
        this.provideInlineCompletions = options.provideInlineCompletions;

        if (options.editorAction) {
            let actionOptions: Partial<monaco.editor.IActionDescriptor> = {
                run: () => this.triggerManually(),
            };
            if (typeof options.editorAction === "object") {
                actionOptions = { ...options.editorAction, ...actionOptions };
            }
            this.editorAction = addEditorAction(actionOptions);
        }

        if (options.loadingCursor) {
            this.addEventListener("change", (e) => {
                const state = (e as CustomEvent).detail as State;
                if (state === "completion-loading") {
                    this.setCursorToLoading();
                } else {
                    this.setCursorToLoadingCleanup?.();
                }
            });
        }
    }
    private setCursorToLoadingCleanup?: VoidFunction;
    private setCursorToLoading() {
        this.setCursorToLoadingCleanup?.();
        this.setCursorToLoadingCleanup = setCursorToLoading(this.editor);
    }

    /**
     * use this method to attach the editor
     */
    public static attachEditor(
        editor: monaco.editor.IStandaloneCodeEditor,
        options: RegisterCompletionOptions
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

    /** trigger manually is called */
    private manuallyFlag = false;
    public triggerManually() {
        this.manuallyFlag = true;
        triggerInlineSuggest(this.editor);
        // manuallyFlag will be set to false at function `provideInlineCompletions`
    }

    private lastInlineCompletionTO?: ReturnType<typeof setTimeout>;
    private lastInlineCompletionCTS?: monaco.CancellationTokenSource;
    private cleanLastDelay?: VoidFunction;
    private inlineCompletionsProvider: monaco.languages.InlineCompletionsProvider = {
        provideInlineCompletions: async (model, position, context, token) => {
            // we only provide completions for the registered editor (model)
            if (model !== this.editor.getModel()) return null;

            if (this.manually) {
                if (!this.manuallyFlag) {
                    // manuallyFlag is false, not allowed to trigger
                    return null;
                }
                this.manuallyFlag = false;
            } else {
                // do not trigger when content length is too few
                if (model.getValueLength() < 5) return null;
            }

            if (this.triggerPosition === "end") {
                // only trigger the completion when the cursor is at the end of the line
                // after the cursor there can be only whitespace or nothing
                const line = model.getLineContent(position.lineNumber);
                const afterCursor = line.slice(position.column - 1);
                if (!/^\s*$/.test(afterCursor)) return null;
            }

            // control flow goes here, means that user has typed a character
            console.debug("provideInlineCompletions", { model, position, context, token });

            // cancel the last request
            this.lastInlineCompletionCTS?.dispose(true); // cancel and dispose
            clearTimeout(this.lastInlineCompletionTO);
            this.cleanLastDelay?.();

            // prepare a new request
            const compositeCTS = new monaco.CancellationTokenSource(token);
            this.lastInlineCompletionCTS = compositeCTS;

            const canceled = new Promise<never>((_, reject) => {
                compositeCTS.token.onCancellationRequested(() => reject(CANCELED));
            });

            // waiting for delay
            this.state = "completion-delay";
            const { resolve, reject, promise: delayPromise } = promiseWithResolvers<void>();
            const timeoutId = setTimeout(resolve, this.delay);
            this.cleanLastDelay = () => {
                clearTimeout(timeoutId);
                reject(); // must resolve/reject the promise to prevent memory leak
            };
            try {
                await Promise.race([canceled /** this one never fulfilled */, delayPromise]);
            } catch (reason) {
                if (reason === CANCELED) {
                    this.state = "idle";
                }
                // canceled
                return null;
            }

            // now we can start the request
            this.state = "completion-loading";

            // set the request timeout
            this.lastInlineCompletionTO = setTimeout(() => {
                compositeCTS.dispose(true); // cancel and dispose
            }, this.timeout);

            try {
                const inlineCompletions = await Promise.race([
                    canceled /** this one never fulfilled */,
                    this.provideInlineCompletions(model, position, context, compositeCTS.token),
                ]);
                // request is completed, handleItemDidShow will be called
                this.state = "completion-ready";
                return inlineCompletions;
            } catch (reason) {
                if (reason === CANCELED) {
                    this.state = "idle";
                    return null;
                }
                // this.provideInlineCompletions is rejected
                console.debug("provideInlineCompletions error", reason);
                this.dispatchEvent(new CustomEvent("completion-error", { detail: reason }));
                if (compositeCTS === this.lastInlineCompletionCTS) {
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

    public dispose(): void {
        Reflect.deleteProperty(this.editor, EDITOR_KEY);
        this.registerInlineCompletionsProviderResult?.dispose();
        clearTimeout(this.lastInlineCompletionTO);
        this.cleanLastDelay?.();
        this.editorAction?.dispose();
    }

    private _state: State = "idle";

    private set state(s: typeof this._state) {
        this._state = s;
        this.dispatchEvent(new CustomEvent("change", { detail: s }));
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

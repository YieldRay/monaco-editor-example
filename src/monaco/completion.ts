import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { EditorRegisteredState } from "./state";

export async function provideInlineCompletions(
    state: EditorRegisteredState,
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.InlineCompletionContext,
    token: monaco.CancellationToken,
    signal: AbortSignal
): Promise<monaco.languages.ProviderResult<monaco.languages.InlineCompletions>> {
    const { editor } = state;
     


    // TODO
    return null;
    // we need to set signal to fetch options
    const inlineCompletions: monaco.languages.InlineCompletions = {
        items: [
            {
                insertText: "-----",
            },
        ],
    };
    return inlineCompletions;
}

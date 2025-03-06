import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { chatCompletions } from "./service";

export async function provideInlineCompletions(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    _context: monaco.languages.InlineCompletionContext,
    _token: monaco.CancellationToken,
    signal: AbortSignal
): Promise<monaco.languages.InlineCompletions> {
    const textBeforeCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
    });
    const endLineNumber = model.getLineCount();
    const textAfterCursor = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber,
        endColumn: model.getLineMaxColumn(endLineNumber),
    });

    console.debug({ textBeforeCursor, textAfterCursor });

    const reply = await chatCompletions(textBeforeCursor, textAfterCursor, signal, model.uri.path);

    const inlineCompletions: monaco.languages.InlineCompletions = {
        items: [
            {
                insertText: reply,
                range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                ),
                completeBracketPairs: true,
            },
        ],
        enableForwardStability: true,
    };
    return inlineCompletions;
}

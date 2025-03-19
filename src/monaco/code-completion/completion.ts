import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { ProvideInlineCompletions } from "./register";

export function chatCompletions(
    facade: (
        textBeforeCursor: string,
        textAfterCursor: string,
        filepath: string,
        signal: AbortSignal
    ) => Promise<string>,
    force = false
): ProvideInlineCompletions {
    return async (model, position, _context, token) => {
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
        const filepath = model.uri.path;
        console.debug({ textBeforeCursor, textAfterCursor });
        const ac = new AbortController();
        token.onCancellationRequested(() => ac.abort("CancellationRequested"));

        const insertText = await facade(textBeforeCursor, textAfterCursor, filepath, ac.signal);
        if (!insertText) return null;

        // force the completion to be inserted at the cursor position
        // https://github.com/microsoft/monaco-editor/discussions/3917
        const range = force
            ? new monaco.Range(
                  position.lineNumber,
                  position.column,
                  position.lineNumber,
                  position.column
              )
            : undefined;

        const inlineCompletions: monaco.languages.InlineCompletions = {
            items: [{ insertText, range, completeBracketPairs: true }],
            enableForwardStability: true,
        };
        return inlineCompletions;
    };
}

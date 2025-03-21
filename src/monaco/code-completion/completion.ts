import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { ProvideInlineCompletions } from "./register";
import { LRUCache } from "../lru-cache";
import { CURSOR_PLACEHOLDER } from "../prompt/process-common";

/**
 * facade for ProvideInlineCompletions
 *
 * @param options [options.force] force the completion to be inserted at the cursor position
 * @param options [options.lru] the capacity of the LRU cache, 0 means no cache
 */
export function chatCompletions(
    facade: (
        textBeforeCursor: string,
        textAfterCursor: string,
        filepath: string,
        signal: AbortSignal
    ) => Promise<string>,
    options: {
        force?: boolean;
        lru?: number;
    }
): ProvideInlineCompletions {
    const { force = false, lru: lruCapacity } = options;
    const lru = lruCapacity && lruCapacity > 0 ? new LRUCache<string, string>(lruCapacity) : null;

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

        // if the completion is in the cache, return it
        let lruKey: string;
        if (lru) {
            lruKey = `${textBeforeCursor}${CURSOR_PLACEHOLDER}${textAfterCursor}`;
            const cached = lru.get(lruKey);
            if (cached) {
                const inlineCompletions: monaco.languages.InlineCompletions = {
                    items: [{ insertText: cached, range, completeBracketPairs: true }],
                    enableForwardStability: true,
                };
                return inlineCompletions;
            }
        }

        const ac = new AbortController();
        token.onCancellationRequested(() => ac.abort("CancellationRequested"));
        const insertText = await facade(textBeforeCursor, textAfterCursor, filepath, ac.signal);
        if (!insertText) return null;

        if (lru) {
            // lruKey is already defined if lru is defined
            lru.set(lruKey!, insertText);
        }

        const inlineCompletions: monaco.languages.InlineCompletions = {
            items: [{ insertText, range, completeBracketPairs: true }],
            enableForwardStability: true,
        };
        return inlineCompletions;
    };
}

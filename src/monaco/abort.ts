import { type CancellationToken } from "monaco-editor/esm/vs/editor/editor.api";

export function abortSignalFromCancellationToken(token: CancellationToken) {
    const abortController = new AbortController();
    token.onCancellationRequested(() => {
        abortController.abort();
    });
    return abortController.signal;
}

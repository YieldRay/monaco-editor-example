import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

/**
 * Represents an placeholder renderer for monaco editor
 * Roughly based on https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/codeEditor/browser/untitledTextEditorHint/untitledTextEditorHint.ts
 *
 * @original https://github.com/microsoft/monaco-editor/issues/568#issuecomment-1499966160
 */
export class PlaceholderContentWidget implements monaco.editor.IContentWidget {
    static ID = "editor.widget.placeholderHint";

    private domNode: HTMLElement | undefined;

    private placeholder: string;

    private editor: monaco.editor.ICodeEditor;

    constructor(placeholder: string, editor: monaco.editor.ICodeEditor) {
        this.placeholder = placeholder;
        this.editor = editor;
        // register a listener for editor code changes
        editor.onDidChangeModelContent(() => this.onDidChangeModelContent());
        // ensure that on initial load the placeholder is shown
        this.onDidChangeModelContent();
    }

    onDidChangeModelContent(): void {
        if (this.editor.getValue() === "") {
            this.editor.addContentWidget(this);
        } else {
            this.editor.removeContentWidget(this);
        }
    }

    getId(): string {
        return PlaceholderContentWidget.ID;
    }

    getDomNode(): HTMLElement {
        if (!this.domNode) {
            this.domNode = document.createElement("div");
            this.domNode.style.width = "max-content";
            this.domNode.style.pointerEvents = "none";
            const text = document.createElement("div");
            text.textContent = this.placeholder;
            text.style.color = "#999";
            text.style.whiteSpace = "break-spaces";
            this.domNode.appendChild(text);
            this.editor.applyFontInfo(this.domNode);
        }

        return this.domNode;
    }

    getPosition(): monaco.editor.IContentWidgetPosition | null {
        return {
            position: { lineNumber: 1, column: 1 },
            preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
        };
    }

    dispose(): void {
        this.editor.removeContentWidget(this);
    }
}

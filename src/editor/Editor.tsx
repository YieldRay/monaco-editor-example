import { type FC, useRef, useEffect, useState } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { registerCompletion } from "../monaco/code-completion";

import "./monaco-features";
import "./monaco-languages";
import "./monaco-workers";
import { chatCompletionsDemo } from "../monaco/code-completion/completion";

interface Props {
    value?: string;
    onChange?: (value: string) => void;
    onState?: (state: string) => void;
}

export const Editor: FC<Props> = ({ value = "", onChange, onState }: Props) => {
    const monacoEl = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    const [state, setState] = useState("typing");

    useEffect(() => {
        if (!monacoEl.current) return;

        // A model represents a file that has been opened.
        const model = monaco.editor.createModel(
            value,
            "typescript",
            // Each model is identified by a URI.
            monaco.Uri.parse("file:///tmp/main.ts")
        );

        // An editor is a user facing view of the model.
        const editor = monaco.editor.create(monacoEl.current!, {
            model,
            automaticLayout: true,
        });

        window.editor = editor;
        editorRef.current = editor;
        const completion = registerCompletion(editor, {
            provideInlineCompletions: chatCompletionsDemo(),
            loadingCursor: true,
        });

        completion.addEventListener("change", (event) => {
            setState(event.detail);
            onState?.(event.detail);
        });
        editor.onDidChangeModelContent(() => onChange?.(editor.getValue()));

        // Turn off the default typescript diagnostics
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true, // This line disables errors in jsx tags like <div>, etc.
        });

        return () => {
            completion.dispose();
            model.dispose();
            editor.dispose();
        };
    }, []);

    return <div style={{ width: "100%", height: "100%" }} ref={monacoEl} data-state={state}></div>;
};

declare global {
    interface Window {
        monaco: any;
        editor: any;
    }
}

window.monaco = monaco;

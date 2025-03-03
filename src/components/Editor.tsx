import { FC, useRef, useEffect } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { registerCompletion } from "../monaco/register";

declare global {
    interface Window {
        monaco: any;
        editor: any;
    }
}

window.monaco = monaco;

interface Props {
    value?: string;
    onChange?: (value: string) => void;
}

export const Editor: FC<Props> = ({ value = "", onChange }: Props) => {
    const monacoEl = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        if (!monacoEl.current) return;

        // A model represents a file that has been opened.
        const model = monaco.editor.createModel(
            value,
            "typescript",
            // Each model is identified by a URI.
            monaco.Uri.parse("file:///main.tsx")
        );

        // An editor is a user facing view of the model.
        const editor = monaco.editor.create(monacoEl.current!, {
            model,
            automaticLayout: true,
        });

        window.editor = editor;
        editorRef.current = editor;
        registerCompletion(editor);

        editor.onDidChangeModelContent(() => onChange?.(editor.getValue()));

        // Turn off the default typescript diagnostics
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true, // This line disables errors in jsx tags like <div>, etc.
        });

        return () => {
            model.dispose();
            editor.dispose();
        };
    }, []);

    return <div style={{ width: "100%", height: "100%" }} ref={monacoEl}></div>;
};

import { FC, useRef, useState, useEffect } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

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

export const Editor: FC<Props> = (props: Props) => {
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoEl = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (monacoEl) {
            setEditor((editor) => {
                if (editor) return editor;
                const newEditor = monaco.editor.create(monacoEl.current!, {
                    value: props.value,
                    language: "typescript",
                    automaticLayout: true,
                });

                window.editor = newEditor;

                // 监听文本内容变化事件
                newEditor.onDidChangeModelContent(() => props.onChange?.(newEditor.getValue()));

                // 关闭错误
                monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: true,
                    noSyntaxValidation: true, // This line disables errors in jsx tags like <div>, etc.
                });

                return newEditor;
            });
        }

        return () => editor?.dispose();
    }, [monacoEl.current]);

    return <div style={{ width: "100%", height: "100%" }} ref={monacoEl}></div>;
};

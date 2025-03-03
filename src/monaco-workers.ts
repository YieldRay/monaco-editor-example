/**
 * @link https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md#using-vite
 */
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import "monaco-editor/esm/vs/language/json/monaco.contribution";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";

import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TSWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import JSONWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";

self.MonacoEnvironment = {
    getWorker(_: any, label: string) {
        if (label === "json") {
            return new JSONWorker();
        }

        if (label === "typescript" || label === "javascript") {
            return new TSWorker();
        }
        return new EditorWorker();
    },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

/**
 * @link https://vite.dev/guide/features.html#web-workers
 */
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
// import JSONWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
// import TSWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
    //@ts-ignore
    getWorker(_: any, label: string) {
        // if (label === "json") return new JSONWorker();
        // if (label === "typescript" || label === "javascript") return new TSWorker();
        return new EditorWorker();
    },
};

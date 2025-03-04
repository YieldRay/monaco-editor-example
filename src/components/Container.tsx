import { useState } from "react";
import { useKey } from "react-use";
import { Editor } from "../editor/Editor";
import { runCode } from "../utils/runcode";
import { ICON_HIDE, ICON_RUN, ICON_SHOW, ICON_FORMAT } from "../utils/icon";

const INIT_CODE = `console.log(Deno.version)`;

export function Container() {
    const [value, setValue] = useState(INIT_CODE);
    const [show, setShow] = useState(true);
    const [result, setResult] = useState({ success: true, output: "" });
    const [running, setRunning] = useState(false);

    const toggle = () => setShow((show) => !show);

    const formatOutput = () => {
        if (!result.success) return;
        let output = result.output;
        try {
            output = JSON.stringify(JSON.parse(result.output), null, 4);
        } catch {
            return;
        }
        if (result.output !== output) setResult((r) => ({ ...r, output }));
        else setResult((r) => ({ ...r, output: JSON.stringify(JSON.parse(r.output)) }));
    };

    const run = async () => {
        setRunning(true);
        try {
            const output = await runCode(value);
            setResult({ success: true, output });
        } catch (e) {
            setResult({ success: false, output: (e as Error).message });
        } finally {
            setRunning(false);
        }
    };

    useKey((event) => event.ctrlKey && event.altKey && event.key === "n", run);
    useKey((event) => event.ctrlKey && event.altKey && event.key === "l", formatOutput);
    useKey((event) => event.ctrlKey && event.key === "\\", toggle);

    return (
        <div className="h-[100vh]">
            <div className={`${show ? "h-[80vh]" : "h-[calc(80vh+calc(20vh-2rem))]"}`}>
                <Editor value={value} onChange={setValue}></Editor>
            </div>
            <div
                className={`box-border overflow-clip ${
                    show ? "h-[20vh]" : "h-8"
                } grid grid-rows-[auto_1fr]`}
                style={{
                    background: "#f8f7f6",
                    color: "#3b444f",
                    border: "rgba(229,231,235) 1px solid",
                }}
            >
                <header className="px-2 py-1 flex items-center justify-between">
                    <span className="underline">output</span>
                    <div className="flex gap-4">
                        <span className="cursor-pointer" onClick={formatOutput} title="Ctrl+Alt+L">
                            {ICON_FORMAT}
                        </span>
                        <span className="cursor-pointer" onClick={run} title="Ctrl+Alt+N">
                            {ICON_RUN}
                        </span>
                        <span className="cursor-pointer" onClick={toggle} title="Ctrl+\">
                            {show ? ICON_HIDE : ICON_SHOW}
                        </span>
                    </div>
                </header>
                <pre
                    className="scrollbar overflow-auto h-full mx-1 mb-4 whitespace-pre-wrap break-all"
                    style={{
                        height: show ? undefined : "0",
                        fontFamily: `ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace`,
                    }}
                >
                    <Output success={result.success} output={result.output} running={running} />
                </pre>
            </div>
        </div>
    );
}

function Output({
    success,
    output,
    running,
}: {
    running: boolean;
    success: boolean;
    output: string;
}) {
    if (running) return <i style={{ color: "#008080" }}>running...</i>;
    if (success) return output;
    return <i style={{ color: "#ff4081" }}>{output}</i>;
}

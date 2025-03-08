import { useState } from "react";
import { useKey } from "react-use";
import { Editor } from "../editor/Editor";
import { ICON_HIDE, ICON_RUN, ICON_SHOW, ICON_FORMAT } from "./icons";
import { ResizablePanes } from "./ResizablePanes";

const INIT_CODE = `console.log(Deno.version)`;

/**
 * @example
 * const result: string = await runCode(`console.log('Hello, World!')`);
 * console.assert(result === `Hello, World!\n\n[Execution complete with exit code 0]`);
 */
async function runCode(code: string) {
    /**
     * This API is for demo ONLY, DO NOT USE in production.
     */
    const res = await fetch("https://yieldray-mycompiler.web.val.run/", {
        method: "POST",
        body: code,
    });
    return await res.text();
}

export function Container() {
    const [value, setValue] = useState(INIT_CODE);
    const [result, setResult] = useState({ success: true, output: "" });
    const [running, setRunning] = useState(false);
    const [state, setState] = useState("idle");
    const [size, setSize] = useState(window.innerHeight * 0.2);
    const MIN_SIZE = 32;
    const show = size > MIN_SIZE;

    const toggle = () => setSize(() => (show ? MIN_SIZE : window.innerHeight * 0.2));

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
        <ResizablePanes
            className="h-full"
            direction="bottom"
            size={size}
            onSizeChange={(size) => setSize(Math.max(MIN_SIZE, size))}
            firstPane={<Editor value={value} onChange={setValue} onState={setState} />}
            secondPaneProps={{
                style: {
                    background: "#f8f7f6",
                    color: "#3b444f",
                    border: "rgba(229,231,235) 1px solid",
                    paddingBottom: `${MIN_SIZE}px`,
                },
                className: "box-border overflow-clip",
            }}
            secondPane={
                <>
                    <header className="px-2 py-1 flex items-center justify-between">
                        <span className="underline">output ({state})</span>
                        <div className="flex gap-4">
                            <span
                                className="cursor-pointer"
                                onClick={formatOutput}
                                title="Ctrl+Alt+L"
                            >
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
                            overflow: "auto",
                        }}
                    >
                        <Output success={result.success} output={result.output} running={running} />
                    </pre>
                </>
            }
        />
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

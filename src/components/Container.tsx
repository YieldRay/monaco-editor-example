import { useEffect, useState } from "react";
import { Editor } from "./Editor";
import { runCode } from "../utils/runcode";
import { ICON_HIDE, ICON_RUN, ICON_SHOW, ICON_FORMAT } from "../utils/icon";

const INIT_CODE = `console.log(Deno.version)`;

export function Container() {
    const [value, setValue] = useState(INIT_CODE);
    const [show, setShow] = useState(true);
    const [result, setResult] = useState({ success: true, output: "" });
    const [running, setRunning] = useState(false);

    const OutputFinish = result.success ? (
        result.output
    ) : (
        <i style={{ color: "#ff4081" }}>{result.output}</i>
    );
    const OutputRunning = <i style={{ color: "#008080" }}>running...</i>;
    const Output = running ? OutputRunning : OutputFinish;

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

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.altKey && event.key === "n") {
                run();
            }
            if (event.ctrlKey && event.altKey && event.key === "l") {
                formatOutput();
            }
            if (event.ctrlKey && event.key === "\\") {
                toggle();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    });

    return (
        <div style={{ height: "100vh" }}>
            <div style={{ height: show ? "80vh" : "calc(80vh + calc(20vh - 2rem))" }}>
                <Editor value={value} onChange={setValue}></Editor>
            </div>
            <div
                style={{
                    boxSizing: "border-box",
                    overflow: "hidden",
                    height: show ? "20vh" : "2rem",
                    background: "#f8f7f6",
                    color: "#3b444f",
                    border: "rgba(229,231,235) 1px solid",
                }}
            >
                <header
                    style={{
                        padding: "0.25rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <span style={{ textDecoration: "underline" }}>output</span>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <span
                            style={{ cursor: "pointer" }}
                            onClick={formatOutput}
                            title="Ctrl+Alt+L"
                        >
                            {ICON_FORMAT}
                        </span>
                        <span style={{ cursor: "pointer" }} onClick={run} title="Ctrl+Alt+N">
                            {ICON_RUN}
                        </span>
                        <span style={{ cursor: "pointer" }} onClick={toggle} title="Ctrl+\">
                            {show ? ICON_HIDE : ICON_SHOW}
                        </span>
                    </div>
                </header>
                <div style={{ height: show ? "calc(20vh - 2rem)" : "0vh", overflow: "hidden" }}>
                    <pre
                        style={{
                            overflow: "auto",
                            height: "100%",
                            margin: "0 0.25rem 0.25rem 1rem",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-all",
                            fontFamily: `ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace`,
                        }}
                    >
                        {Output}
                    </pre>
                </div>
            </div>
        </div>
    );
}

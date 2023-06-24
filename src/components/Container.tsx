import { useState } from "react";
import { Editor } from "./Editor";
import { valTownEvalComplex, valTownEvalURL } from "../utils/valtown";
import { ICON_HIDE, ICON_LINK, ICON_RUN, ICON_SHOW } from "../utils/icon";

const INIT_CODE = `(async function () {
    const _ = await import("npm:lodash-es");
    return _.shuffle(_.zip([1, 2, 3, 4], [5, 6, 7, 8]));
    // return any value, and it will appear to the output
}())`;

export function Container() {
    const [value, setValue] = useState(INIT_CODE);
    const [show, setShow] = useState(true);
    const [result, setResult] = useState({ success: true, output: "" });
    const [running, setRunning] = useState(false);
    const [link, setLink] = useState(valTownEvalURL());

    const OutputFinish = result.success ? result.output : <i style={{ color: "#ff4081" }}>{result.output}</i>;
    const OutputRunning = <i style={{ color: "#008080" }}>running...</i>;
    const Output = running ? OutputRunning : OutputFinish;

    const run = async () => {
        setRunning(true);
        setLink(valTownEvalURL(value));
        try {
            const output = await valTownEvalComplex(value);
            setResult({ success: true, output });
        } catch (e) {
            setResult({ success: false, output: String(e) });
        } finally {
            setRunning(false);
        }
    };

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
                        <span>
                            <a href={link} target="_blank">
                                {ICON_LINK}
                            </a>
                        </span>
                        <span style={{ cursor: "pointer" }} onClick={run}>
                            {ICON_RUN}
                        </span>
                        <span style={{ cursor: "pointer" }} onClick={() => setShow((show) => !show)}>
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

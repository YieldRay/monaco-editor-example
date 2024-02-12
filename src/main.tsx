import React from "react";
import { createRoot } from "react-dom/client";
import { Container } from "./components/Container";
import "./style.css";
import "./userWorker";

declare global {
    const __DEBUG_INFO__: any;
}

console.info(__DEBUG_INFO__.HEAD);
console.table(__DEBUG_INFO__.dependencies);

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Container />
    </React.StrictMode>
);

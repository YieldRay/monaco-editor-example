import React from "react";
import { createRoot } from "react-dom/client";
import { Container } from "./components/Container";
import "./style.css";

declare global {
    const __HEAD__: any;
    const __DEPS__: any;
}

console.info(__HEAD__);
console.table(__DEPS__.dependencies);
console.table(__DEPS__.devDependencies);

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Container />
    </React.StrictMode>
);

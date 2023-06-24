import React from "react";
import ReactDOM from "react-dom";
import "./style.css";
import { Container } from "./components/Container";
import "./userWorker";

ReactDOM.render(
    <React.StrictMode>
        <Container />
    </React.StrictMode>,
    document.getElementById("root")
);

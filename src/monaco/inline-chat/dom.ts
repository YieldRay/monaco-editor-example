import { addStyle } from "../css";

const svgStop = /*html*/ `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="#888888" d="M9 16h6q.425 0 .713-.288T16 15V9q0-.425-.288-.712T15 8H9q-.425 0-.712.288T8 9v6q0 .425.288.713T9 16m3 6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>`;

const svgSend = /*html*/ `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="#888888" d="m19.8 12.925l-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5l-6 1.5zm0 0V7z"/></svg>`;

const innerHTML = /*html*/ `\ 
<header class="monaco-inline-chat__header">
    <div class="monaco-inline-chat__header__prompt"></div>
    <div class="monaco-inline-chat__header__error"></div>
</header>

<div class="monaco-inline-chat__body">
    <div contenteditable="plaintext-only" class="monaco-inline-chat__body__input monaco-inline-chat-scrollbar" placeholder="Ask Copilot..."></div>
    <button disabled class="monaco-inline-chat__body__button" title="Send And Dispatch (Enter)">${svgSend}</button>
</div>

<footer class="monaco-inline-chat__footer"></footer>
`;

// TODO: use css variables
const css = /* css */ `\ 
.monaco-inline-chat {
    padding-left: 64px;
    padding-right: 84px;
    display: flex;
    flex-direction: column;
    border: 1px solid #888;
}
.monaco-inline-chat * {
    overscroll-behavior: none;
}
.monaco-inline-chat__header, .monaco-inline-chat__footer {
    display: grid;
    padding: 4px;
}
.monaco-inline-chat__header__prompt:not(:empty)::after {
      display: inline-block;
      animation: monaco-inline-chat__dotty steps(1,end) 1s infinite;
      content: '';
}
@keyframes monaco-inline-chat__dotty {
    0%,100% { content: '\\2008\\2008\\2008'; }
    25%     { content: '.\\2008\\2008'; }
    50%     { content: '..\\2008'; }
    75%     { content: '...'; }
}
.monaco-inline-chat__header__error {
    color: red;
}
.monaco-inline-chat__body {
    display: flex;
    gap: 8px;
    min-height: 24px;
}
.monaco-inline-chat__body__input {
    flex: 1;
    padding: 4px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: none;
    box-sizing: content-box;
    line-height: 1em;
    max-height: 4em; /* max 4 lines */
    font-size: 14px;
    overflow-x: auto;
    overflow-y: auto;
}
.monaco-inline-chat__body__input:focus {
    outline: none;
    border-color: #888;
}
.monaco-inline-chat__body__button {
    all: unset;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #888;
}
.monaco-inline-chat__body__button[disabled] {
    cursor: not-allowed;
    opacity: 0.5;
}
.monaco-inline-chat__body__button svg {
    width: 24px;
    height: 24px;
}

.monaco-inline-chat-scrollbar {
    scrollbar-gutter: stable;
    /* The size of scroll bar */
    &::-webkit-scrollbar {
        width: 12px;
        height: 8px;
        transition: all 0.3s;
    }
    /* The track of scroll bar */
    &::-webkit-scrollbar-track {
        background: transparent;
    }

    /* The thumb of scroll bar */
    &::-webkit-scrollbar-thumb {
        border-radius: 12px;
    }

    &:hover::-webkit-scrollbar-thumb {
        border: 3px solid transparent;
        background-color: rgba(0, 0, 0, 0.1);
        background-clip: content-box;
    }

    &::-webkit-scrollbar-corner {
        background: transparent;
    }
}
`;

class AbortError extends Error {
    constructor() {
        super("aborted");
        this.name = "AbortError";
    }
}

export function createInlineChat({
    onSend,
}: {
    onSend: (text: string, signal: AbortSignal) => Promise<void>;
}) {
    const domNode = document.createElement("div");
    domNode.className = "monaco-inline-chat";
    domNode.innerHTML = innerHTML;

    const removeStyle = addStyle(css);

    const prompt = domNode.querySelector(".monaco-inline-chat__header__prompt") as HTMLDivElement;
    const error = domNode.querySelector(".monaco-inline-chat__header__error") as HTMLDivElement;
    const button = domNode.querySelector(".monaco-inline-chat__body__button") as HTMLButtonElement;
    const input = domNode.querySelector(".monaco-inline-chat__body__input") as HTMLDivElement;

    let sendAbortController: AbortController | undefined;
    const send = async () => {
        // show the prompt
        const text = input.textContent;
        prompt.textContent = text;
        input.textContent = null;
        error.textContent = null;

        button.innerHTML = svgStop;
        button.dataset.disabled = "true";
        sendAbortController = new AbortController();
        const abortPromise = new Promise((_, reject) => {
            sendAbortController?.signal.addEventListener("abort", () => reject(new AbortError()));
        });
        try {
            await Promise.race([onSend(text || "", sendAbortController.signal), abortPromise]);
            prompt.textContent = null;
        } catch (e) {
            if (!(e instanceof AbortError)) {
                if (e) {
                    console.error(e);
                    error.textContent = String(e);
                } else error.textContent = "Unknown error";
            }
            input.textContent = prompt.textContent;
            prompt.textContent = null;
            stop();
        } finally {
            button.innerHTML = svgSend;
            delete button.dataset.disabled;
        }
    };

    const stop = () => {
        sendAbortController?.abort();
        sendAbortController = undefined;
        button.innerHTML = svgSend;
        delete button.dataset.disabled;
    };

    button.addEventListener("click", () => {
        if (button.dataset.disabled) {
            stop();
        } else {
            send();
        }
    });

    input.addEventListener("input", () => {
        button.disabled = !input.textContent?.trim();
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
            return;
        }

        // Ctrl-A, not provided for contenteditable by default
        if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            const range = document.createRange();
            range.selectNodeContents(input);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            return;
        }
    });

    // must manually support scroll
    input.addEventListener("wheel", (e) => {
        e.preventDefault();
        input.scrollTop += e.deltaY;
        input.scrollLeft += e.deltaX;
    });

    const dispose = () => {
        removeStyle();
        stop();
        domNode.remove();
    };

    return {
        /** contains only single HTMLElement */
        domNode,
        button,
        input,
        dispose,
    };
}

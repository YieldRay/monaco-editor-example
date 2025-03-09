import { addStyle } from "../css";

const svgStop = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="#888888" d="M9 16h6q.425 0 .713-.288T16 15V9q0-.425-.288-.712T15 8H9q-.425 0-.712.288T8 9v6q0 .425.288.713T9 16m3 6q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>`;

const svgSend = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="#888888" d="m19.8 12.925l-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5l-6 1.5zm0 0V7z"/></svg>`;

const innerHTML = /*html*/ `\ 
<header class="monaco-inline-chat__header">
    <div class="monaco-inline-chat__header__prompt"></div>
</header>

<div class="monaco-inline-chat__body">
    <div contenteditable="plaintext-only" class="monaco-inline-chat__body__input monaco-inline-chat-scrollbar" placeholder="Ask Copilot..."></div>
    <button class="monaco-inline-chat__body__button" title="Send And Dispatch (Enter)">${svgSend}</button>
</div>

<footer class="monaco-inline-chat__footer"></footer>
`;

const css = /* css */ `\ 
.monaco-inline-chat__header {
    display: grid;
}
.monaco-inline-chat__body {
    display: flex;
    gap: 8px;
    padding: 8px;
    min-height: 24px;
}
.monaco-inline-chat__body__input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: none;
    box-sizing: content-box;
    max-height: 3em;
    font-size: 14px;
    line-height: 1em;
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
    /* The track of scrooll bar */
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

export function createInlineChat({ onSend }: { onSend: (text: string) => Promise<void> }) {
    const dom = new DocumentFragment();
    const container = document.createElement("div");
    container.className = "monaco-inline-chat";
    container.innerHTML = innerHTML;
    dom.append(container);
    const removeStyle = addStyle(css);

    const prompt = dom.querySelector(".monaco-inline-chat__header__prompt") as HTMLDivElement;
    const button = dom.querySelector(".monaco-inline-chat__body__button") as HTMLButtonElement;
    const input = dom.querySelector(".monaco-inline-chat__body__input") as HTMLDivElement;
    const close = dom.querySelector(".monaco-inline-chat__header__close") as HTMLDivElement;

    let sendAbortController: AbortController | undefined;
    const send = async () => {
        // show the prompt
        prompt.textContent = input.textContent;
        input.textContent = "";

        button.innerHTML = svgStop;
        button.dataset.disabled = "true";
        sendAbortController = new AbortController();
        const abortPromise = new Promise((_, reject) => {
            sendAbortController?.signal.addEventListener("abort", () =>
                reject(new Error("aborted"))
            );
        });
        try {
            await Promise.race([onSend(input.textContent || ""), abortPromise]);
        } catch {
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

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    });

    return {
        dom,
        button,
        input,
        close,
        removeStyle,
    };
}

/* const { dom } = createInlineChat({
    onSend: async (text) => {
        console.log("onSend", text);
        await new Promise((r) => setTimeout(r, 1000));
    },
});
document.body.appendChild(dom);
 */

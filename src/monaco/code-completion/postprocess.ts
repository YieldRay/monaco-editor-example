// LLMs may reply markdown code block, we need to strip it out

export function formatMaybeMarkdownSyntax(text: string) {
    let result = "";

    for (let line of text.split("\n")) {
        if (line.startsWith("```")) {
            continue; // remove code blocks
        }
        result += line + "\n";
    }

    return result.trimEnd();
}

export function extractFirstCodeBlockContent(text: string) {
    let result = "";
    let inFirstCodeBlock = false;

    for (let line of text.split("\n")) {
        if (line.startsWith("```") && !inFirstCodeBlock) {
            inFirstCodeBlock = true;
            continue;
        }

        if (inFirstCodeBlock) {
            if (line.startsWith("```")) {
                break; // end of first code block
            }

            result += line + "\n";
        }
    }

    if (!inFirstCodeBlock) {
        // no code block found
        return text.trimEnd();
    }

    return result.trimEnd();
}

/**
 * Fill in the middle MODE
 *
 * The paper: https://arxiv.org/pdf/2207.14255
 *
 * @link https://github.com/continuedev/continue/blob/main/core/autocomplete/templating/AutocompleteTemplate.ts
 */
export function createFIMPayload(prefix: string, suffix: string) {
    return {
        max_tokens: 4096,
        temperature: 0.01,
        stop: [
            "<fim_prefix>",
            "<fim_suffix>",
            "<fim_middle>",
            "<file_sep>",
            "<|endoftext|>",
            "</fim_middle>",
            "</code>",
            "```",
        ],
        prompt: `<fim_prefix>${prefix}<fim_suffix>${suffix}<fim_middle>`,
    };
}

/**
 * postprocess
 */
export function stripFIM(text: string) {
    let label: string;
    label = "<fim_separator>";
    if (text.endsWith(label)) text = text.slice(0, -label.length);
    label = "</fim_middle></fim_suffix>";
    if (text.endsWith(label)) text = text.slice(0, -label.length);
    label = "<fim_sep>";
    if (text.endsWith(label)) text = text.slice(0, -label.length);
    label = "<fim_empty>";
    if (text.endsWith(label)) text = text.slice(0, -label.length);
    return text;
}

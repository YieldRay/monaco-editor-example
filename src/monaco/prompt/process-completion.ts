/**
 * The /v1/completions endpoint
 *
 * Some model providers supports FIM directly from the API, for example:
 * https://docs.siliconflow.cn/cn/userguide/guides/fim
 * https://api-docs.deepseek.com/zh-cn/guides/fim_completion/
 */
export function createCompletionPayload(prefix: string, suffix: string) {
    return {
        prompt: prefix,
        suffix,
        max_tokens: 4096,
        temperature: 0.01,
    };
}

// const res = await fetch("https://yieldray-openrouter.web.val.run/v1/completions", {
//     method: "POST",
//     body: JSON.stringify({
//         model: "qwen/qwen-2.5-coder-32b-instruct:free",
//         ...createCompletionPayload("function add(a: number, b: number){\n", "\n}"),
//     }),
// });
// console.log(await res.json());

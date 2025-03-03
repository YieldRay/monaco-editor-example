/**
 * @example
 * const result: string = await runCode(`console.log('Hello, World!')`);
 * console.assert(result === `Hello, World!\n\n[Execution complete with exit code 0]`);
 */
export async function runCode(code: string) {
    /**
     * This API is for demo ONLY, DO NOT USE in production.
     */
    const res = await fetch("https://yieldray-mycompiler.web.val.run/", {
        method: "POST",
        body: code,
    });
    return await res.text();
}

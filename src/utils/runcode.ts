export async function runCode(code: string) {
    const res = await fetch("https://yieldray-mycompiler.web.val.run/", {
        method: "POST",
        body: code,
    });
    return await res.text();
}

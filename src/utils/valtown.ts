export async function valTownEval(code: string, args?: any[]) {
    const res = await fetch("https://api.val.town/v1/eval", {
        method: "POST",
        body: JSON.stringify({ code, args }),
    });
    return await res.text();
}

export async function valTownEvalComplex(code: string, args?: any[]) {
    const res = await fetch("https://api.val.town/v1/eval", {
        method: "POST",
        body: JSON.stringify({ code, args }),
    });
    if (res.ok) {
        return await res.text();
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const { message, val } = await res.json();
    throw new Error(message);
}

export function valTownEvalURL(code = "") {
    return "https://api.val.town/v1/eval/" + encodeURIComponent(code);
}

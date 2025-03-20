export function setStyle(
    el: { style: CSSStyleDeclaration },
    style: Partial<CSSStyleDeclaration>
): VoidFunction {
    const saved: Partial<CSSStyleDeclaration> = {};
    for (const [k, v] of Object.entries(style)) {
        Reflect.set(saved, k, Reflect.get(el, k));
        Reflect.set(el, k, v);
    }
    return () => {
        for (const [k, v] of Object.entries(saved)) {
            Reflect.set(el, k, v);
        }
    };
}

export function addStyle(css: string): VoidFunction {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets.push(sheet);
    return () => {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
    };
}

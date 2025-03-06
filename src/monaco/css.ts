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

export function adoptStyleSheet(css: string) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    document.adoptedStyleSheets.push(sheet);
    return sheet;
}

export function mergeStyles(
    ...styles: Array<React.CSSProperties | boolean | void>
): React.CSSProperties {
    const s: React.CSSProperties = {};
    for (const style of styles) {
        if (typeof style === "object") {
            Object.assign(s, style);
        }
    }
    return s;
}

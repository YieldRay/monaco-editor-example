import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

/**
 * monaco editor does not provide zone widget. we want such a zone widget,
 * that is both interactable like OverlayWidget and can span multiple lines like ViewZone.
 */
export class ZoneWidget implements monaco.IDisposable {
    editor: monaco.editor.ICodeEditor;
    constructor(editor: monaco.editor.ICodeEditor, domNode: HTMLElement, afterLineNumber = 0) {
        this.editor = editor;
        // Create a zone over the margin. Uses the trick explained
        // at https://github.com/Microsoft/monaco-editor/issues/373

        // overlay that will be placed over the zone.
        const overlayDom = document.createElement("div");
        overlayDom.id = "overlayId";
        overlayDom.style.width = "100%";

        //! inject the domNode
        overlayDom.appendChild(domNode);

        // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ioverlaywidget.html
        const overlayWidget: monaco.editor.IOverlayWidget = {
            getId: () => "overlay.zone.widget",
            getDomNode: () => overlayDom,
            getPosition: () => null,
        };
        editor.addOverlayWidget(overlayWidget);

        // Used only to compute the position.
        const zoneNode = document.createElement("div");
        zoneNode.id = "zoneId";

        const zone: monaco.editor.IViewZone & { id?: string } = {
            afterLineNumber,
            heightInPx: 0,
            domNode: zoneNode,
            marginDomNode: null,
            onDomNodeTop: (top) => {
                overlayDom.style.top = top + "px";
            },
            onComputedHeight: (height) => {
                overlayDom.style.height = height + "px";
            },
        };
        const layoutZone: VoidFunction = () => {
            editor.changeViewZones((changeAccessor) => {
                changeAccessor.layoutZone(zone.id!);
            });
        };
        const ro = new ResizeObserver((elements) => {
            const element = elements[0];
            if (!element) return;
            const { height } = element.contentRect;
            zone.heightInPx = height; // update the height
            layoutZone();
        });
        ro.observe(domNode, { box: "border-box" });

        editor.changeViewZones((changeAccessor) => {
            zone.id = changeAccessor.addZone(zone);
        });

        Object.defineProperty(this, "afterLineNumber", {
            get() {
                return zone.afterLineNumber;
            },
            set(afterLineNumber: number) {
                zone.afterLineNumber = afterLineNumber;
                layoutZone();
            },
        });

        this.hide = () => {
            overlayDom.style.display = "none";
        };

        this.show = () => {
            overlayDom.style.display = "block";
        };

        this.dispose = () => {
            editor.changeViewZones((changeAccessor) => {
                changeAccessor.removeZone(zone.id!);
            });
            overlayDom.remove();
            domNode.remove();
            ro.disconnect();
        };
    }
    dispose: VoidFunction;
    //@ts-ignore
    afterLineNumber: number;
    hide: VoidFunction;
    show: VoidFunction;
}

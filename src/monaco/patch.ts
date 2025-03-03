//@ts-ignore
import * as actions from "monaco-editor/esm/vs/platform/actions/common/actions";

const menus = actions.MenuRegistry._menuItems as Map<any, any>;
const contextMenuEntry = Array.from(menus, ([key, value]) => ({
    key,
    value,
})).find((entry) => entry.key.id == "EditorContext")!;

const patchMap: Record<string, string> = {
    "editor.action.clipboardCutAction": "剪切",
    "editor.action.clipboardCopyAction": "复制",
    "editor.action.clipboardPasteAction": "粘贴",
    "editor.action.formatDocument": "格式化全部",
    "editor.action.formatSelection": "格式化选中",
    "editor.action.quickCommand": "命令面板",
};

const warkThroughList = (list: any) => {
    let node = list._first;
    do {
        const id = node.element?.command?.id;

        if (id === "editor.action.changeAll") {
            list._remove(node);
        } else {
            const patched = patchMap[id];
            if (patched) {
                node.element.command.title = patched;
            }
        }
    } while ((node = node.next));
};

warkThroughList(contextMenuEntry.value);

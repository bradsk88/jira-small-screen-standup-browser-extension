import {
    contextMenus,
    runtime,
    tabs,
} from "webextension-polyfill";

runtime.onInstalled.addListener(function () {
    contextMenus.create({
        title: "Stand Up!",
        id: "stand-up-start",
    });

    contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === "stand-up-start") {
            tabs.sendMessage(tab!.id!, {"action": "start"});
        }
    });
});

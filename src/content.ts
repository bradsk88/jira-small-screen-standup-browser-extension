import {runtime} from "webextension-polyfill";

console.log('content script');

runtime.onMessage.addListener(async (message) => {
    if (message.action !== "start") {
        return false;
    }
    setTimeout(() => alert('worked'));
    return true;
})

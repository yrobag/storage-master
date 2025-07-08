import { getAllStorage, onMessageListener } from "./utils/messageHandler";

chrome.runtime.onMessage.addListener(onMessageListener);

window.addEventListener("storage", (event) => {
  const tab =
    event.storageArea === window.localStorage
      ? "localStorage"
      : "sessionStorage";
  const items = getAllStorage(tab);
  chrome.runtime.sendMessage({
    namespace: "storage-master",
    action: "storageChanged",
    tab,
    items,
  });
});

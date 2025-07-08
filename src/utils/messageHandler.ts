export const onMessageListener = (
  msg: Message,
  _sender: unknown,
  sendResponse: (response: unknown) => void
) => {
  if (!msg || msg.namespace !== "storage-master") return;
  const { action, tab, key, value, data } = msg;
  const storage =
    tab === "localStorage" ? window.localStorage : window.sessionStorage;
  if (action === "set") {
    storage.setItem(key, value);
    sendResponse({ success: true });
  } else if (action === "remove") {
    storage.removeItem(key);
    sendResponse({ success: true });
  } else if (action === "clear") {
    storage.clear();
    sendResponse({ success: true });
  } else if (action === "import") {
    Object.entries(data).forEach(([k, v]) => storage.setItem(k, String(v)));
    sendResponse({ success: true });
  } else if (action === "sync") {
    // do nothing, items will be synced by storage event
  }
  const items = getAllStorage(tab);
  chrome.runtime.sendMessage({
    namespace: "storage-master",
    action: "storageChanged",
    tab,
    items,
  });
  return true;
};

export function getAllStorage(type: "localStorage" | "sessionStorage") {
  const storage =
    type === "localStorage" ? window.localStorage : window.sessionStorage;
  return Object.keys(storage).map((key) => ({
    key,
    value: storage.getItem(key) ?? "",
  }));
}

interface Message {
  namespace: string;
  action: string;
  tab: "localStorage" | "sessionStorage";
  key: string;
  value: string;
  data: Record<string, string>;
}

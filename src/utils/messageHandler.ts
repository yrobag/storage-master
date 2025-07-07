export const onMessageListener = (
  msg: Message,
  _sender: unknown,
  sendResponse: (response: unknown) => void
) => {
  if (!msg || msg.namespace !== "storage-master") return;
  const { action, tab, key, value, data } = msg;
  const storage =
    tab === "localStorage" ? window.localStorage : window.sessionStorage;
  if (action === "getAll") {
    sendResponse({ items: getAllStorage(tab) });
  } else if (action === "set") {
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
  }
  return true;
};

function getAllStorage(type: "localStorage" | "sessionStorage") {
  const storage =
    type === "localStorage" ? window.localStorage : window.sessionStorage;
  const data: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)!;
    data[key] = storage.getItem(key) ?? "";
  }
  return data;
}

interface Message {
  namespace: string;
  action: string;
  tab: "localStorage" | "sessionStorage";
  key: string;
  value: string;
  data: Record<string, string>;
}

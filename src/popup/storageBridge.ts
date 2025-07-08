// Bridge for popup <-> content script communication
export type StorageAction =
  | {
      namespace: "storage-master";
      action: "sync";
      tab: "localStorage" | "sessionStorage";
    }
  | {
      namespace: "storage-master";
      action: "set";
      tab: "localStorage" | "sessionStorage";
      key: string;
      value: string;
    }
  | {
      namespace: "storage-master";
      action: "remove";
      tab: "localStorage" | "sessionStorage";
      key: string;
    }
  | {
      namespace: "storage-master";
      action: "clear";
      tab: "localStorage" | "sessionStorage";
    }
  | {
      namespace: "storage-master";
      action: "import";
      tab: "localStorage" | "sessionStorage";
      data: Record<string, string>;
    };

export function sendToContentScript<T>(msg: StorageAction): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return reject("No active tab");
      chrome.tabs.sendMessage(tabId, msg, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  });
}

import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { StorageItem } from "../utils/types";
import { syncStorage } from "../utils/storageApi";

export type StorageItemsState = {
  localStorage: StorageItem[];
  sessionStorage: StorageItem[];
};

type StorageChangedMessage = {
  namespace: "storage-master";
  action: "storageChanged";
  tab: "localStorage" | "sessionStorage";
  items: StorageItem[];
};

const StorageItemsContext = createContext<StorageItemsState | undefined>(
  undefined
);

export const StorageItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItemsState] = useState<StorageItemsState>({
    localStorage: [],
    sessionStorage: [],
  });

  useEffect(() => {
    Promise.all([syncStorage("localStorage"), syncStorage("sessionStorage")]);
  }, []);

  useEffect(() => {
    function handleMessage(msg: StorageChangedMessage) {
      if (
        msg &&
        msg.namespace === "storage-master" &&
        msg.action === "storageChanged" &&
        (msg.tab === "localStorage" || msg.tab === "sessionStorage")
      ) {
        setItemsState((prev) => ({ ...prev, [msg.tab]: msg.items }));
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  return (
    <StorageItemsContext.Provider value={items}>
      {children}
    </StorageItemsContext.Provider>
  );
};

export { StorageItemsContext };

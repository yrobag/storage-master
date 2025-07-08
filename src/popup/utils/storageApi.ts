import type { Tab } from "./types";
import { sendToContentScript } from "../storageBridge";

export const syncStorage = async (tab: Tab) => {
  await sendToContentScript({
    namespace: "storage-master",
    action: "sync",
    tab,
  });
};

export const setStorageItemOnPage = async (
  tab: Tab,
  key: string,
  value: string
) => {
  await sendToContentScript({
    namespace: "storage-master",
    action: "set",
    tab,
    key,
    value,
  });
};

export const removeStorageItemOnPage = async (tab: Tab, key: string) => {
  await sendToContentScript({
    namespace: "storage-master",
    action: "remove",
    tab,
    key,
  });
};

export const clearStorageOnPage = async (tab: Tab) => {
  await sendToContentScript({
    namespace: "storage-master",
    action: "clear",
    tab,
  });
};

export const importStorageOnPage = async (
  tab: Tab,
  data: Record<string, string>
) => {
  await sendToContentScript({
    namespace: "storage-master",
    action: "import",
    tab,
    data,
  });
};

export const TABS = ["localStorage", "sessionStorage"] as const;
export type Tab = (typeof TABS)[number];
export type StorageItem = { key: string; value: string };

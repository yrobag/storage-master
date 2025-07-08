import { useContext } from "react";
import { StorageStateContext, StorageDispatchContext } from "./contexts";
import { StorageItemsContext } from "./StorageItemsContext";

export function useStorageState() {
  const context = useContext(StorageStateContext);
  if (context === undefined) {
    throw new Error("useStorageState must be used within StorageProvider");
  }
  return context;
}

export function useStorageDispatch() {
  const context = useContext(StorageDispatchContext);
  if (context === undefined) {
    throw new Error("useStorageDispatch must be used within StorageProvider");
  }
  return context;
}

export function useStorageItems() {
  const context = useContext(StorageItemsContext);
  if (!context)
    throw new Error(
      "useStorageItems must be used within a StorageItemsProvider"
    );
  return context;
}

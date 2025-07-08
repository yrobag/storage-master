import { createContext } from "react";
import type { StorageState, StorageAction } from "./storageReducer";

export const StorageStateContext = createContext<StorageState | undefined>(
  undefined
);
export const StorageDispatchContext = createContext<
  React.Dispatch<StorageAction> | undefined
>(undefined);

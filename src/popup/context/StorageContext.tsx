import React, { useReducer } from "react";
import { storageReducer, initialStorageState } from "./storageReducer";
import { StorageStateContext, StorageDispatchContext } from "./contexts";

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(storageReducer, initialStorageState);
  return (
    <StorageStateContext.Provider value={state}>
      <StorageDispatchContext.Provider value={dispatch}>
        {children}
      </StorageDispatchContext.Provider>
    </StorageStateContext.Provider>
  );
};

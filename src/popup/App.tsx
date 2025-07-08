import React from "react";
import { StorageProvider } from "./context/StorageContext";
import { StorageItemsProvider } from "./context/StorageItemsContext";
import TabSelector from "./components/TabSelector";
import StorageToolbar from "./components/StorageToolbar";
import StorageTable from "./components/StorageTable";

const App: React.FC = () => (
  <StorageProvider>
    <StorageItemsProvider>
      <div className="p-4 min-w-[700px]">
        <h1 className="text-xl font-bold mb-4">Storage Master</h1>
        <TabSelector />
        <StorageToolbar />
        <StorageTable />
      </div>
    </StorageItemsProvider>
  </StorageProvider>
);

export default App;

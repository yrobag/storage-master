import React from "react";
import {
  useStorageState,
  useStorageItems,
  useStorageDispatch,
} from "../context/hooks";
import { clearStorageOnPage, importStorageOnPage } from "../utils/storageApi";

const StorageToolbar: React.FC = () => {
  const { addMode, search, activeTab } = useStorageState();
  const items = useStorageItems();
  const dispatch = useStorageDispatch();

  const handleClearStorage = async () => {
    if (
      window.confirm(
        `Are you sure you want to clear all items in ${activeTab}?`
      )
    ) {
      await clearStorageOnPage(activeTab);
    }
  };

  const handleExport = async () => {
    const exportItems = items[activeTab];
    const data: Record<string, string> = {};
    for (const { key, value } of exportItems) {
      data[key] = value;
    }
    let domain = "unknown";
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        domain = url.hostname
          .replace(/^www\./, "")
          .replace(/[^a-zA-Z0-9.-]/g, "_");
      }
    } catch {
      domain = "";
    }
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${domain}_${activeTab}_${ts}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (typeof data !== "object" || data === null) throw new Error();
        await importStorageOnPage(activeTab, data);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center mb-2 gap-2">
      <button
        className="bg-green-500 text-white px-2 py-1 rounded cursor-pointer"
        onClick={() => dispatch({ type: "SET_ADD_MODE", value: true })}
        disabled={addMode}
      >
        Add
      </button>
      <input
        className="border p-1 rounded flex-1 min-w-[200px]"
        type="text"
        placeholder="Search by key or value..."
        value={search}
        onChange={(e) =>
          dispatch({ type: "SET_SEARCH", value: e.target.value })
        }
      />
      <div className="flex gap-2 items-center">
        <button
          className="bg-red-500 text-white px-2 py-1 rounded cursor-pointer"
          onClick={handleClearStorage}
        >
          Clear storage
        </button>
        <label className="bg-blue-500 text-white px-2 py-1 rounded cursor-pointer">
          Import
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </label>
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded cursor-pointer"
          onClick={handleExport}
        >
          Export
        </button>
      </div>
    </div>
  );
};

export default StorageToolbar;

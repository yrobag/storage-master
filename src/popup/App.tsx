import React, { useState, useEffect } from "react";
import { isJSON, prettyPrintJSON } from "../utils/jsonUtils";
import { sendToContentScript } from "./storageBridge";

const TABS = ["localStorage", "sessionStorage"] as const;
type Tab = (typeof TABS)[number];

type StorageItem = { key: string; value: string };

const getStorageItemsFromPage = async (tab: Tab): Promise<StorageItem[]> => {
  const resp = await sendToContentScript<{ items: Record<string, string> }>({
    namespace: "storage-master",
    action: "getAll",
    tab,
  });
  return Object.entries(resp.items).map(([key, value]) => ({ key, value }));
};

const setStorageItemOnPage = async (tab: Tab, key: string, value: string) => {
  await sendToContentScript({
    namespace: "storage-master",
    action: "set",
    tab,
    key,
    value,
  });
};

const removeStorageItemOnPage = async (tab: Tab, key: string) => {
  await sendToContentScript({
    namespace: "storage-master",
    action: "remove",
    tab,
    key,
  });
};

const clearStorageOnPage = async (tab: Tab) => {
  await sendToContentScript({
    namespace: "storage-master",
    action: "clear",
    tab,
  });
};

const importStorageOnPage = async (tab: Tab, data: Record<string, string>) => {
  await sendToContentScript({
    namespace: "storage-master",
    action: "import",
    tab,
    data,
  });
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("localStorage");
  const [items, setItems] = useState<StorageItem[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [addError, setAddError] = useState("");
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const [editIsJson, setEditIsJson] = useState(false);
  const [search, setSearch] = useState("");

  const [expandedJsonKey, setExpandedJsonKey] = useState<string | null>(null);

  useEffect(() => {
    getStorageItemsFromPage(activeTab).then(setItems);
    setAddMode(false);
    setEditKey(null);
  }, [activeTab]);

  const handleDelete = async (key: string) => {
    await removeStorageItemOnPage(activeTab, key);
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleEdit = (key: string, value: string) => {
    setEditKey(key);
    if (isJSON(value)) {
      setEditValue(prettyPrintJSON(value));
      setEditIsJson(true);
    } else {
      setEditValue(value);
      setEditIsJson(false);
    }
    setEditError("");
  };

  const handleEditSave = async (key: string) => {
    if (editKey == null) return;
    let valueToSave = editValue;
    if (editIsJson) {
      try {
        // Validate and minify JSON
        valueToSave = JSON.stringify(JSON.parse(editValue));
      } catch {
        setEditError("Invalid JSON");
        return;
      }
    }
    try {
      await setStorageItemOnPage(activeTab, key, valueToSave);
      setItems((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, value: valueToSave } : item
        )
      );
      setEditKey(null);
    } catch {
      setEditError("Failed to update value");
    }
  };

  const handleAdd = () => {
    setAddMode(true);
    setNewKey("");
    setNewValue("");
    setAddError("");
  };

  const handleAddSave = async () => {
    try {
      if (!newKey) {
        setAddError("Key is required");
        return;
      }
      if (items.some((item) => item.key === newKey)) {
        setAddError("Key already exists");
        return;
      }
      await setStorageItemOnPage(activeTab, newKey, newValue);
      setItems((prev) => [...prev, { key: newKey, value: newValue }]);
      setAddMode(false);
    } catch (error) {
      console.error("Error saving new item:", error);
      return;
    }
  };

  const handleClearStorage = async () => {
    if (
      window.confirm(
        `Are you sure you want to clear all items in ${activeTab}?`
      )
    ) {
      await clearStorageOnPage(activeTab);
      setItems([]);
    }
  };

  const handleExport = async () => {
    const items = await getStorageItemsFromPage(activeTab);
    const data: Record<string, string> = {};
    for (const { key, value } of items) {
      data[key] = value;
    }
    // Get current tab's domain
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
    // Get timestamp
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
        const items = await getStorageItemsFromPage(activeTab);
        setItems(items);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Filter items by search
  const filteredItems = items.filter(
    (item) =>
      item.key.toLowerCase().includes(search.toLowerCase()) ||
      item.value.toLowerCase().includes(search.toLowerCase())
  );

  // Helper to highlight search matches
  function highlight(text: string) {
    if (search.length <= 2) return text;
    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 p-0 m-0 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <div className="p-4 min-w-[700px]">
      <h1 className="text-xl font-bold mb-4">Storage Master</h1>
      <div className="flex mb-4 gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`px-3 py-1 rounded ${activeTab === tab ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex items-center mb-2 gap-2">
        <button
          className="bg-green-500 text-white px-2 py-1 rounded"
          onClick={handleAdd}
          disabled={addMode}
        >
          Add
        </button>
        <input
          className="border p-1 rounded flex-1 min-w-[200px]"
          type="text"
          placeholder="Search by key or value..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
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
            className="bg-blue-500 text-white px-2 py-1 rounded"
            onClick={handleExport}
          >
            Export
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left w-1/4 max-w-[120px] truncate">
                Key
              </th>
              <th className="p-2 text-left w-1/2 max-w-[250px] truncate">
                Value
              </th>
              <th className="p-2 w-1/4 max-w-[100px]"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 && !addMode ? (
              <tr>
                <td className="p-2 text-gray-400" colSpan={3}>
                  No items{search ? " match your search" : ` in ${activeTab}`}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isJson = isJSON(item.value);
                let pretty = "";
                let lines = 0;
                if (isJson) {
                  pretty = prettyPrintJSON(item.value);
                  lines = pretty.split("\n").length;
                }
                const expanded = expandedJsonKey === item.key;
                const isLongNonJson = !isJson && item.value.length > 220;
                return (
                  <tr
                    key={item.key}
                    onDoubleClick={() => handleEdit(item.key, item.value)}
                    className="hover:bg-gray-100 border-b border-gray-200"
                  >
                    <td className="p-2 break-all w-1/4 max-w-[120px] truncate">
                      {highlight(item.key)}
                    </td>
                    <td className="p-2 break-all w-1/2 max-w-[250px]">
                      {editKey === item.key ? (
                        <form
                          className="flex flex-col gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditSave(item.key);
                          }}
                        >
                          {editIsJson ? (
                            <textarea
                              className="border p-1 rounded w-full font-mono"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              rows={6}
                              autoFocus
                            />
                          ) : (
                            <input
                              className="border p-1 rounded w-full"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                            />
                          )}
                          <div className="flex gap-2 mt-1">
                            <button
                              type="submit"
                              className="px-2 py-1 rounded bg-blue-500 text-white"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 rounded bg-gray-200"
                              onClick={() => setEditKey(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : isJson ? (
                        <div>
                          <span className="font-mono text-xs text-gray-700 whitespace-pre-wrap">
                            {lines > 6 && !expanded
                              ? highlight(
                                  pretty.split("\n").slice(0, 5).join("\n") +
                                    "\n..."
                                )
                              : highlight(pretty)}
                          </span>{" "}
                          {lines > 6 && (
                            <button
                              className="text-blue-500 text-xs mt-1 underline"
                              onClick={() =>
                                setExpandedJsonKey(expanded ? null : item.key)
                              }
                              type="button"
                            >
                              {expanded ? "Collapse JSON" : "Expand JSON"}
                            </button>
                          )}
                        </div>
                      ) : isLongNonJson ? (
                        <div>
                          <span className="font-mono text-xs text-gray-700 whitespace-pre-wrap">
                            {!expanded
                              ? highlight(item.value.slice(0, 200) + "...")
                              : highlight(item.value)}
                          </span>{" "}
                          <button
                            className="text-blue-500 text-xs mt-1 underline"
                            onClick={() =>
                              setExpandedJsonKey(expanded ? null : item.key)
                            }
                            type="button"
                          >
                            {expanded ? "Collapse" : "Expand"}
                          </button>
                        </div>
                      ) : (
                        highlight(item.value)
                      )}
                    </td>
                    <td className="p-2 flex gap-2 w-1/4 max-w-[100px]">
                      {editKey === item.key ? (
                        <>
                          {editError && (
                            <span className="text-red-500 text-xs ml-2">
                              {editError}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            className="text-blue-500 mr-2"
                            onClick={() => handleEdit(item.key, item.value)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-500"
                            onClick={() => handleDelete(item.key)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            {addMode && (
              <>
                <tr>
                  <td className="p-2 w-1/4 max-w-[120px]">
                    <input
                      className="border p-1 rounded w-full"
                      placeholder="Key"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      autoFocus
                    />
                  </td>
                  <td className="p-2 w-1/2 max-w-[250px]">
                    <input
                      className="border p-1 rounded w-full"
                      placeholder="Value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                  </td>
                  <td className="p-2 flex gap-2 w-1/4 max-w-[100px]">
                    <button
                      className="px-2 py-1 rounded bg-green-500 text-white"
                      onClick={handleAddSave}
                    >
                      Save
                    </button>
                    <button
                      className="px-2 py-1 rounded bg-gray-200"
                      onClick={() => setAddMode(false)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
                {addError && (
                  <tr>
                    <td colSpan={3} className="text-red-500 text-sm p-2">
                      {addError}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;

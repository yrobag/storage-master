import React, { useMemo } from "react";
import {
  useStorageState,
  useStorageDispatch,
  useStorageItems,
} from "../context/hooks";
import { isJSON, prettyPrintJSON } from "../utils/jsonUtils";
import {
  setStorageItemOnPage,
  removeStorageItemOnPage,
} from "../utils/storageApi";

const StorageTable: React.FC = () => {
  const state = useStorageState();
  const dispatch = useStorageDispatch();
  const items = useStorageItems();
  const {
    addMode,
    newKey,
    newValue,
    addError,
    editKey,
    editValue,
    editError,
    editIsJson,
    expandedJsonKey,
    activeTab,
    search,
  } = state;

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

  const handleEdit = (key: string, value: string) => {
    const displayValue = isJSON(value) ? prettyPrintJSON(value) : value;
    dispatch({ type: "HANDLE_EDIT", key, value: displayValue });
  };
  const handleEditSave = async () => {
    const key = state.editKey;
    if (key === null) return;
    let valueToSave = state.editValue;
    if (state.editIsJson) {
      try {
        valueToSave = JSON.stringify(JSON.parse(state.editValue));
      } catch {
        dispatch({ type: "SET_EDIT_ERROR", value: "Invalid JSON" });
        return;
      }
    }
    try {
      await setStorageItemOnPage(state.activeTab, key, valueToSave);
      dispatch({
        type: "HANDLE_EDIT_SAVE",
        key,
        value: valueToSave,
        isJson: state.editIsJson,
      });
    } catch {
      dispatch({ type: "SET_EDIT_ERROR", value: "Failed to update value" });
    }
  };

  const handleDelete = async (key: string) => {
    await removeStorageItemOnPage(state.activeTab, key);
  };

  const handleAddSave = async () => {
    try {
      if (!state.newKey) {
        dispatch({ type: "SET_ADD_ERROR", value: "Key is required" });
        return;
      }
      if (items[activeTab].some((item) => item.key === state.newKey)) {
        dispatch({ type: "SET_ADD_ERROR", value: "Key already exists" });
        return;
      }
      await setStorageItemOnPage(state.activeTab, state.newKey, state.newValue);
      dispatch({
        type: "HANDLE_ADD_SAVE",
        key: state.newKey,
        value: state.newValue,
      });
    } catch (error) {
      console.error("Error saving new item:", error);
      return;
    }
  };

  const filteredItems = useMemo(() => {
    const filtered = items[activeTab].filter(
      (item) =>
        item.key.toLowerCase().includes(search.toLowerCase()) ||
        item.value.toLowerCase().includes(search.toLowerCase())
    );
    return filtered.sort((a, b) => a.key.localeCompare(b.key));
  }, [items, activeTab, search]);

  return (
    <div className="overflow-x-auto">
      <TableWrapper
        isFormMode={addMode || editKey !== null}
        onSubmit={editKey ? handleEditSave : handleAddSave}
      >
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
                        <>
                          {editIsJson ? (
                            <textarea
                              className="border p-1 rounded w-full font-mono"
                              value={editValue}
                              onChange={(e) =>
                                dispatch({
                                  type: "SET_EDIT_VALUE",
                                  value: e.target.value,
                                })
                              }
                              rows={6}
                              autoFocus
                            />
                          ) : (
                            <input
                              className="border p-1 rounded w-full"
                              value={editValue}
                              onChange={(e) =>
                                dispatch({
                                  type: "SET_EDIT_VALUE",
                                  value: e.target.value,
                                })
                              }
                              autoFocus
                            />
                          )}
                        </>
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
                              className="text-blue-500 text-xs mt-1 underline cursor-pointer"
                              onClick={() =>
                                dispatch({
                                  type: "SET_EXPANDED_JSON_KEY",
                                  value: expanded ? null : item.key,
                                })
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
                            className="text-blue-500 text-xs mt-1 underline cursor-pointer"
                            onClick={() =>
                              dispatch({
                                type: "SET_EXPANDED_JSON_KEY",
                                value: expanded ? null : item.key,
                              })
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
                        <div className="flex flex-col">
                          <div className="p-2 flex gap-2">
                            <button
                              type="submit"
                              className="px-2 py-1 rounded bg-blue-500 text-white cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 rounded bg-gray-200 cursor-pointer"
                              onClick={() =>
                                dispatch({ type: "HANDLE_EDIT_CANCEL" })
                              }
                            >
                              Cancel
                            </button>
                          </div>
                          {editError && (
                            <span className="text-red-500 text-xs ml-2">
                              {editError}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="text-blue-500 mr-2 cursor-pointer"
                            onClick={() => handleEdit(item.key, item.value)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-red-500 cursor-pointer"
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
                      onChange={(e) =>
                        dispatch({ type: "SET_NEW_KEY", value: e.target.value })
                      }
                      autoFocus
                    />
                  </td>
                  <td className="p-2 w-1/2 max-w-[250px]">
                    <input
                      className="border p-1 rounded w-full"
                      placeholder="Value"
                      value={newValue}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_NEW_VALUE",
                          value: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="p-2 flex gap-2 w-1/4 max-w-[100px]">
                    <button
                      type="submit"
                      className="px-2 py-1 rounded bg-green-500 text-white cursor-pointer"
                      onClick={handleAddSave}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded bg-gray-200 cursor-pointer"
                      onClick={() =>
                        dispatch({ type: "SET_ADD_MODE", value: false })
                      }
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
      </TableWrapper>
    </div>
  );
};

function TableWrapper({
  isFormMode,
  onSubmit,
  children,
}: {
  isFormMode: boolean;
  onSubmit: () => Promise<void>;
  children: React.ReactNode;
}) {
  if (!isFormMode) {
    return children;
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}

export default StorageTable;

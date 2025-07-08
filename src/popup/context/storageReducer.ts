import type { Tab } from "../utils/types";

export interface StorageState {
  activeTab: Tab;
  addMode: boolean;
  newKey: string;
  newValue: string;
  addError: string;
  editKey: string | null;
  editValue: string;
  editError: string;
  editIsJson: boolean;
  search: string;
  expandedJsonKey: string | null;
}

export type StorageAction =
  | { type: "CHANGE_TAB"; tab: Tab }
  | { type: "SET_ADD_MODE"; value: boolean }
  | { type: "SET_NEW_KEY"; value: string }
  | { type: "SET_NEW_VALUE"; value: string }
  | { type: "SET_ADD_ERROR"; value: string }
  | { type: "HANDLE_EDIT"; key: string; value: string }
  | { type: "SET_EDIT_VALUE"; value: string }
  | { type: "SET_EDIT_ERROR"; value: string }
  | { type: "HANDLE_EDIT_SAVE"; key: string; value: string; isJson: boolean }
  | { type: "HANDLE_EDIT_CANCEL" }
  | { type: "HANDLE_ADD_SAVE"; key: string; value: string }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_EXPANDED_JSON_KEY"; value: string | null };

export const initialStorageState: StorageState = {
  activeTab: "localStorage",
  addMode: false,
  newKey: "",
  newValue: "",
  addError: "",
  editKey: null,
  editValue: "",
  editError: "",
  editIsJson: false,
  search: "",
  expandedJsonKey: null,
};

export function storageReducer(
  state: StorageState,
  action: StorageAction
): StorageState {
  switch (action.type) {
    case "CHANGE_TAB":
      return {
        ...state,
        activeTab: action.tab,
        addMode: false,
        editKey: null,
        editError: "",
        addError: "",
      };
    case "SET_ADD_MODE":
      return { ...state, addMode: action.value };
    case "SET_NEW_KEY":
      return { ...state, newKey: action.value };
    case "SET_NEW_VALUE":
      return { ...state, newValue: action.value };
    case "SET_ADD_ERROR":
      return { ...state, addError: action.value };
    case "HANDLE_EDIT":
      return {
        ...state,
        editKey: action.key,
        editValue: action.value,
        editIsJson:
          action.value.startsWith("{") &&
          action.value.endsWith("}") &&
          (action.value.includes('"') || action.value.includes("[")),
        editError: "",
      };
    case "SET_EDIT_VALUE":
      return { ...state, editValue: action.value };
    case "SET_EDIT_ERROR":
      return { ...state, editError: action.value };
    case "HANDLE_EDIT_SAVE":
      return {
        ...state,
        editKey: null,
        editError: "",
      };
    case "HANDLE_EDIT_CANCEL":
      return {
        ...state,
        editKey: null,
        editError: "",
      };
    case "HANDLE_ADD_SAVE":
      return {
        ...state,
        addMode: false,
        newKey: "",
        newValue: "",
        addError: "",
      };
    case "SET_SEARCH":
      return { ...state, search: action.value };
    case "SET_EXPANDED_JSON_KEY":
      return { ...state, expandedJsonKey: action.value };
    default:
      return state;
  }
}

import "@testing-library/jest-dom";
import { vi } from "vitest";
import { onMessageListener } from "./utils/messageHandler";

// Mock chrome.tabs.query for tests
if (!globalThis.chrome) {
  globalThis.chrome = {} as unknown as typeof chrome;
}
if (!globalThis.chrome.runtime) {
  globalThis.chrome.runtime = {} as unknown as typeof chrome.runtime;
}
if (!globalThis.chrome.tabs) {
  globalThis.chrome.tabs = {
    query: vi.fn((_opt, cb) => {
      cb([{ id: 1, url: "https://example.com" }]);
    }),
    sendMessage: vi.fn((_tabId, msg, callback) => {
      new Promise((resolve) => {
        resolve(onMessageListener(msg, {}, callback));
      });
    }),
  } as unknown as typeof chrome.tabs;
}

import "@testing-library/jest-dom";
import { vi } from "vitest";
import { onMessageListener } from "./utils/messageHandler";

if (!globalThis.chrome) {
  globalThis.chrome = {} as unknown as typeof chrome;
}
let runtimeListeners: Array<
  (msg: unknown, sender?: unknown, sendResponse?: unknown) => void
> = [];

if (!globalThis.chrome.runtime) {
  globalThis.chrome.runtime = {
    sendMessage: vi.fn((msg, callback) => {
      const promises = runtimeListeners.map(
        (
          fn: (msg: unknown, sender?: unknown, sendResponse?: unknown) => void
        ) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              fn(msg, {}, callback);
              resolve(true);
            }, 0);
          });
        }
      );
      Promise.all(promises);
    }),
    onMessage: {
      listeners: [],
      addListener: vi.fn((fn) => {
        runtimeListeners.push(fn);
      }),
      removeListener: vi.fn((fn) => {
        runtimeListeners = runtimeListeners.filter((f) => f !== fn);
      }),
    },
  } as unknown as typeof chrome.runtime;
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

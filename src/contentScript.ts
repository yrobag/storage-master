// Content script for Storage Master
// Listens for messages from the popup and interacts with the page's storage

import { onMessageListener } from "./utils/messageHandler";

chrome.runtime.onMessage.addListener(onMessageListener);

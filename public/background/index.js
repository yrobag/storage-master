chrome.runtime.onMessage.addListener((msg) => {
  if (
    msg &&
    msg.namespace === "storage-master" &&
    msg.action === "storageChanged"
  ) {
    chrome.runtime.sendMessage(msg);
  }
});

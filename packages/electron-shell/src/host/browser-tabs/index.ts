/**
 * Onglets sites externes génériques (N7) — gold TempoFlow.
 * Les marques hors TF consomment ce module ; TF conserve electron/supplier-tabs.
 */
export {
  configureBrowserTabs,
  SupplierTabManager,
  BrowserTabManager,
  type BrowserTabManagerDeps,
  type SupplierTab,
  type BrowserTab,
  type SupplierTabManagerOptions,
  type TabInfo,
  type TabLoadState,
  type ContentRect,
} from "./browser-tab-manager.js";

export {
  executeSupplierAction,
  captureScreenshot,
} from "./browser-tab-driver.js";

export {
  reduceTabNativeLoadState,
  type TabLoadPhase,
  type TabLoadSignal,
} from "./tab-load-state.js";

export {
  normalizeTabDocumentUrl,
  isSameTabDocument,
  isSameTabOrigin,
} from "./tab-url.js";

export { CHROME_UA, installUserAgent } from "./chrome-ua.js";

export { FAKE_CURSOR_INJECT } from "./fake-cursor-inject.js";

export { browserTabPreloadPath } from "./browser-tab-preload-path.js";

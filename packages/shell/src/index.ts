export { IpcChannels } from "./ipc-channels.js";
export type { IpcChannelGroup } from "./ipc-channels.js";

export type {
  DesktopAppKind,
  DesktopBridge,
  DesktopConnectionProfile,
  DesktopContentRect,
  DesktopInfo,
  DesktopSupplierTabOpened,
  DesktopTabInfo,
  DesktopTabLoadState,
  DesktopUpdateState,
  DesktopUpdateStatus,
} from "./types.js";

export { getDesktopBridge } from "./types.js";

export type { ContextBridgeLike, IpcRendererLike } from "./create-desktop-api.js";
export { createDesktopApi, exposeDesktopApi } from "./create-desktop-api.js";

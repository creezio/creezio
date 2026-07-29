/**
 * Déclarations minimales Electron / electron-updater pour compiler le kit
 * sans installer le binaire Electron (peerDependency côté apps marques).
 */

declare module "electron" {
  export interface WebContents {
    isDestroyed(): boolean;
    send(channel: string, ...args: unknown[]): void;
    loadURL(url: string): Promise<void>;
  }

  export interface NativeImage {
    isEmpty(): boolean;
  }

  export type Menu = unknown;

  export interface MenuItemConstructorOptions {
    label?: string;
    type?: string;
    click?: () => void;
    submenu?: MenuItemConstructorOptions[];
  }

  export const app: {
    getVersion: () => string;
    isPackaged: boolean;
    getPath: (name: string) => string;
    setPath: (name: string, path: string) => void;
    setName: (name: string) => void;
    setAppUserModelId: (id: string) => void;
    quit: () => void;
    setLoginItemSettings: (settings: {
      openAtLogin: boolean;
      args?: string[];
    }) => void;
  };

  export const ipcMain: {
    handle: (
      channel: string,
      listener: (...args: unknown[]) => unknown,
    ) => void;
  };

  export const session: {
    fromPartition: (partition: string) => {
      clearStorageData: () => Promise<void>;
      clearCache: () => Promise<void>;
    };
  };

  export const safeStorage: {
    isEncryptionAvailable: () => boolean;
    encryptString: (plain: string) => Buffer;
    decryptString: (buffer: Buffer) => string;
  };

  export const Menu: {
    buildFromTemplate: (template: MenuItemConstructorOptions[]) => Menu;
  };

  export const nativeImage: {
    createFromPath: (p: string) => NativeImage;
    createFromDataURL: (dataUrl: string) => NativeImage;
  };

  export class Tray {
    constructor(image: NativeImage);
    setToolTip(tip: string): void;
    setContextMenu(menu: Menu): void;
    on(event: string, listener: () => void): void;
    destroy(): void;
  }

  export class BaseWindow {
    constructor(opts: Record<string, unknown>);
    show(): void;
    hide(): void;
    focus(): void;
    isDestroyed(): boolean;
    getContentBounds(): {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    contentView: { addChildView: (view: WebContentsView) => void };
    on(event: string, listener: (...args: never[]) => void): void;
  }

  export class WebContentsView {
    constructor(opts: Record<string, unknown>);
    setBounds(bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    }): void;
    webContents: WebContents;
  }
}

declare module "electron-updater" {
  export const autoUpdater: {
    logger: unknown;
    autoDownload: boolean;
    autoInstallOnAppQuit: boolean;
    allowDowngrade: boolean;
    setFeedURL?: (opts: { provider: string; url: string }) => void;
    on: (event: string, listener: (...args: never[]) => void) => void;
    checkForUpdates: () => Promise<unknown>;
    downloadUpdate: () => Promise<unknown>;
    quitAndInstall: (isSilent?: boolean, isForceRunAfter?: boolean) => void;
  };
}

declare namespace NodeJS {
  interface Process {
    resourcesPath: string;
  }
}

import { BrowserWindow, BrowserWindowConstructorOptions, WebContents } from 'electron';
import {
  getPreloadPath,
  getSendEventJS,
  startDevToolsIfNeed,
} from "@/helpers/web";
import TabPageContainer from "@/pages/TabPageContainer";
import { BrowserView } from 'electron';

export interface YWindowOptions extends BrowserWindowConstructorOptions {
  /**
   * 是否使用tabs
   */
  useTabs?: boolean;
}

export class YBrowserWindow extends BrowserWindow {
  public useTabs: boolean;
  public tabContainer: TabPageContainer;
  constructor(options: YWindowOptions) {
    super(options);
    this.useTabs = options.useTabs;
  }

  setTabContainer(tabContainer: TabPageContainer) {
    this.tabContainer = tabContainer;
  }
}

export class YWindowManager {
  private static instance: YWindowManager;

  static get shared(): YWindowManager {
    if (!YWindowManager.instance) {
      YWindowManager.instance = new YWindowManager();
    }
    return YWindowManager.instance;
  }

  /**
   * 已存在的窗口, 暂时考虑子窗口的管理，主窗口涉及问题太多
   */
  private readonly windows: Map<number, YBrowserWindow>;

  /**
   * 全局配置
   */
  private globalOptions: YWindowOptions;

  constructor() {
    this.configGlobalOptions();
    this.windows = new Map();
  }

  /**
   * 创建一个窗口
   */
  public createWindow(options?: YWindowOptions) {
    const opts = {
      ...options,
      ...this.globalOptions,
    };
    const newWindow = new YBrowserWindow(opts);
    newWindow.setTabContainer(new TabPageContainer(newWindow));

    newWindow.on("closed", () => {});

    newWindow.on("focus", () => {});

    // 是否开启调试工具
    startDevToolsIfNeed(newWindow.webContents);
    if (this.windows.has(newWindow.id)) {
      this.windows.delete(newWindow.id);
    }
    this.windows.set(newWindow.id, newWindow);

    return newWindow;
  }
  /**
   * 通过 ID 获取 window
   * @param id 窗口 ID
   */
  public getWindow(id: number): YBrowserWindow | null {
    return this.windows.get(id) || null;
  }

  /**
   * 从event sender中获取到窗口
   * @param event
   * @returns
   */
  public getWindowFromSender(sender: any): YBrowserWindow | null {
    try {
      const win = BrowserWindow.fromWebContents(sender);
      return this.getWindow(win.id);
    } catch (error) {
      return null;
    }
  }

  /**
   * 从webContents获取窗口
   * @param webContents
   * @returns 
   */
  public getWindowFromWebContents(webContents: WebContents): YBrowserWindow | null {
    try {
      const win = BrowserWindow.fromWebContents(webContents);
      return this.getWindow(win.id);
    } catch (error) {
      return null;
    }
  }
  /**
   * 从browserView获取窗口
   * @param browserView 
   * @returns 
   */
  public getWindowFromBrowserView(browserView: BrowserView): YBrowserWindow | null {
    try {
      const win = BrowserWindow.fromBrowserView(browserView);
      console.log("🚀 ~ YWindowManager ~ getWindowFromBrowserView ~ win:", win)
      return this.getWindow(win.id);
    } catch (error) {
      return null;
    }
  }

  /**
   * 移除 window
   * @param url
   */
  public removeWindow(id: number): void {
    if (this.windows.has(id)) {
      const win = this.windows.get(id);
      // 清空窗口上的tabs
      if (win.useTabs) {
        win.tabContainer.close();
        win.tabContainer = null;
      }
      this.windows.delete(id);
    }
  }

  /**
   * 移除所有 window
   */
  public removeAllWindows() {
    this.windows.forEach((window) => {
      this.removeWindow(window.id);
      window.close();
      window.destroy();
      window.removeAllListeners();
      window.webContents.removeAllListeners();
      window.webContents.clearHistory();
    });
  }
  /**
   * 配置全局选项
   */
  private configGlobalOptions() {
    this.globalOptions = {
      useTabs: true,
      webPreferences: {
        preload: getPreloadPath(),
        nodeIntegrationInSubFrames: true,
      },
    };
  }
}

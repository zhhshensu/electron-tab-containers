import { EventEmitter } from "events";
import {
  BrowserView,
  BrowserWindow,
  session,
  ipcMain,
  WebPreferences,
  ContextMenuParams,
  Menu,
  MenuItemConstructorOptions,
  WebContents,
} from "electron";
import { YNBEventBus } from "../helpers/event-bus";
import YContainerManager from "../container";
import { YWebContainer, YWebContainerOptions } from "../container/container";
import { YBrowserWindow, YWindowManager } from "../window";
/**
 * Tab 栏高度
 */
const subPageTabHeight = 40;

const FRAME_READY = "FRAME_READY";

export interface TabPageContainerOptions {
  attachedWindow: YBrowserWindow;
}

export class TabPageContainer {
  private static instance: TabPageContainer;
  /**
   * 存储的tabs <url, id>
   */
  private tabs: Map<string, number>;
  /**
   * 记录当前的URL集合
   */
  public urls: string[];

  /**
   * 是否初始化完成
   */
  private initialized = false;
  /**
   * 回调事件
   */
  private emitter: EventEmitter;
  /**
   * 主窗口
   */
  private _mainWindow: YBrowserWindow;

  constructor(attachedWindow: YBrowserWindow) {
    this.emitter = new EventEmitter();
    this.tabs = new Map<string, number>();
    this.urls = [];
    this._mainWindow = attachedWindow;
    this._mainWindow.on("resize", () => {
      this.setContainerBounds(this.getCurrentTabContainer());
    });
  }

  public async switchTab(
    url: string,
    windowId?: number,
    options?: YWebContainerOptions
  ) {
    await this.initFrameIfNeed();
    let id = this.tabs.get(url);
    if (!id) {
      id = this.createTab(url, (windowId = null), (options = {})).id;
      this.urls.push(url);
    }
    return this.switchTabWithId(id);
  }

  /**
   * 切换 Tab 页
   * @param id 容器 ID
   */
  public switchTabWithId(id: number, notify = true) {
    console.log(`触发 Tab 切换 id: ${id}`);
    const container = YContainerManager.shared.getContainer(id)!;
    const attachedWindow =
      this.window || BrowserWindow.fromBrowserView(container.context);
    if (notify) {
      YNBEventBus.shared.emit({
        eventName: "desktop.onSwitchTab",
        data: { id: id, windowId: attachedWindow.id },
      });
    }
    this.attachContainerIfNeed(container);
    if (attachedWindow) {
      attachedWindow.setTopBrowserView(container.context);
      this.removeAllWithoutTab(id);
      attachedWindow.show();
      attachedWindow.focus();
      container.context.webContents.focus();
    }
    return container;
  }

  /**
   * 创建 Tab 页
   * @param url URL
   */
  public createTab(
    url: string,
    windowId?: number,
    options?: YWebContainerOptions
  ) {
    let id = this.tabs.get(url);
    if (id) {
      return this.switchTabWithId(id);
    }
    const opts = options || {};
    const win = YWindowManager.shared.getWindow(windowId) || this.window;
    const container = YContainerManager.shared.createContainer(url, {
      useHTMLTitleAndIcon: true,
      useErrorView: true,
      ...opts,
    });
    win.addBrowserView(container.context);
    this.setContainerBounds(container);
    this.tabs.set(url, container.id);
    this.urls.push(url);
    YNBEventBus.shared.emit({
      eventName: "desktop.onCreateTab",
      data: { id: container.id, windowId: win.id },
    });
    return container;
  }

  /**
   * 关闭标签页
   * @param id ID
   */
  public closeTab(id: number, { needNotifyView = false } = {}): void {
    const container = YContainerManager.shared.getContainer(id);
    if (container) {
      const attachedWindow = BrowserWindow.fromBrowserView(container.context);
      if (attachedWindow) {
        attachedWindow.removeBrowserView(container.context);
        container.context.webContents?.close();
      }
      if (needNotifyView) {
        YNBEventBus.shared.emit({
          eventName: "desktop.onCloseTab",
          data: { id: id, windowId: attachedWindow.id },
        });
      }
      YContainerManager.shared.removeContainer(id);
      const url = this.getURLById(id);
      if (url) {
        this.deleteURL(url);
        this.tabs.delete(url);
      }
    }
  }

  /**
   * 通过 URL 关闭标签页
   * @param url URL
   */
  public closeTabByURL(url: string): void {
    const id = this.tabs.get(url);
    if (id) {
      this.closeTab(id, {
        needNotifyView: true,
      });
    }
  }

  /**
   * 关闭当前标签
   */
  public closeCurrentTab() {
    const id = this.currentTab?.webContents.id;
    if (id) {
      this.closeTab(id, {
        needNotifyView: true,
      });
    }
  }

  /**
   * 关闭所有标签页
   */
  public closeAllTabs(): void {
    for (const [_key, id] of this.tabs) {
      this.closeTab(id);
    }
    this.tabs.clear();
    const views = this.window.getBrowserViews() || [];
    console.log(views.length);
    for (const view of views) {
      this.window.removeBrowserView(view);
      const id = view.webContents.id;
      YContainerManager.shared.removeContainer(id);
      const url = this.getURLById(id);
      if (url) {
        this.deleteURL(url);
        this.tabs.delete(url);
      }
      // 当前electron 版本不支持close这个方法
      // view.webContents?.close();
    }
  }

  /**
   * 刷新当前 Tab
   */
  public reloadCurrentTab() {
    const container = this.getCurrentTabContainer();
    container?.reload();
  }

  /**
   * 当前 Tab
   */
  public get currentTab(): BrowserView | undefined {
    const views = this.window.getBrowserViews();
    return views.length ? views[views.length - 1] : undefined;
  }

  /**
   * 聚焦
   */
  public focus() {
    this.window.focus();
  }

  /**
   * 设置框架准备完毕
   */
  public setFrameReady() {
    this.emitter.emit(FRAME_READY);
  }

  private get window(): YBrowserWindow {
    return this._mainWindow;
  }

  private async initFrameIfNeed(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    return new Promise((resolve) => {
      this.emitter.once(FRAME_READY, () => {
        resolve();
      });
    });
  }

  /**
   * 在 window 上移除其他 BrowserView
   */
  private removeAllWithoutTab(containerId: number) {
    this.tabs.forEach((id) => {
      if (id !== containerId) {
        const container = YContainerManager.shared.getContainer(id)!;
        this.window.removeBrowserView(container.context as BrowserView);
      }
    });
  }

  private attachContainerIfNeed(container: YWebContainer) {
    const exists = this.window.getBrowserViews() || [];
    for (const view of exists) {
      if (view === container.context) {
        return;
      }
    }
    this.window.addBrowserView(container.context as BrowserView);
    this.setContainerBounds(container);
  }

  /**
   * 通过容器 ID 获取 URL
   */
  private getURLById(id: number): string | undefined {
    for (const [key, value] of this.tabs.entries()) {
      if (value === id) {
        return key;
      }
    }
    return undefined;
  }

  /**
   * 移除 URL
   */
  private deleteURL(element: string) {
    const index = this.urls.findIndex((ele) => ele == element);
    this.urls.splice(index, 1);
  }

  /**
   * 获取当前 Tab 容器
   */
  private getCurrentTabContainer() {
    const id = this.currentTab?.webContents.id;
    if (id) {
      const container = YContainerManager.shared.getContainer(id);
      return container;
    }
    return undefined;
  }

  private setContainerBounds(container: YWebContainer) {
    container.context.setBounds({
      x: 0,
      y: subPageTabHeight,
      width: this.window.getBounds().width || 1024,
      height: (this.window.getBounds().height || 768) - subPageTabHeight,
    });
  }
  /**
   * 关闭tabPage容器
   */
  public close() {
    this.closeAllTabs();
  }
}
export default TabPageContainer;

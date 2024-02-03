import {
  BrowserView,
  BrowserWindow,
  BrowserViewConstructorOptions,
} from "electron";
import { YNBEventBus } from "../helpers/event-bus";
import {
  startDevToolsIfNeed,
  getErrorPagePath,
  getErrorPageUrl,
  handleOpenWindow,
} from "../helpers/web";

/**
 * Web 容器选项
 */
export interface YWebContainerOptions extends BrowserViewConstructorOptions {
  /**
   * 是否使用错误视图
   */
  useErrorView?: boolean;
  /**
   * 是否需要使用网页标题和图标
   */
  useHTMLTitleAndIcon?: boolean;
}

/**
 * Web 容器
 */
export class YWebContainer {
  /**
   * 唯一 ID
   */
  public readonly id: number;
  /**
   * 封装的视图，可以是view或者window
   */
  public readonly context: BrowserView;
  /**
   * 禁用关闭能力
   */
  public disableClose = false;
  /**
   * 配置项
   */
  private options: YWebContainerOptions;
  /**
   * 加载地址
   */
  private url?: string;
  /**
   * 是否已初始化
   */
  private initialized = false;

  constructor(options: YWebContainerOptions = {}) {
    const defaultOptions: YWebContainerOptions = {
      useErrorView: false,
      useHTMLTitleAndIcon: false,
    };
    this.options = {
      ...defaultOptions,
      ...options,
    };
    this.context = new BrowserView(this.options);
    this.context.setBackgroundColor("rgba(255, 255, 255, 0)");
    this.id = this.context.webContents.id;
  }

  /**
   * 加载链接
   * @param url 链接
   */
  public async loadURL(url: string): Promise<void> {
    this.url = url;
    if (!this.initialized) {
      this.setup();
      this.initialized = true;
    }
    this.context.webContents.loadURL(this.url);
  }

  /**
   * 重新加载
   */
  public reload() {
    if (this.url) {
      this.context.webContents.loadURL(this.url);
    } else {
      this.context.webContents.reload();
    }
  }

  /**
   * 设置选项
   * @param options 选项
   */
  public async setOptions(options: YWebContainerOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * 执行 JS 方法
   */
  public executeJavaScript(script: string) {
    if (this.context?.webContents?.isDestroyed()) {
      return;
    }
    return this.context?.webContents
      ?.executeJavaScript(script)
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * 获取当前 URL
   */
  public getURL() {
    return this.url;
  }

  private _title = "";
  private _icon = "";

  /**
   * 标题
   */
  public get title() {
    return this._title;
  }

  public set title(value: string) {
    this._title = value;
    this.options.useHTMLTitleAndIcon &&
      YNBEventBus.shared.emit({
        eventName: "desktop.onTabTitle",
        data: { id: this.id, title: this.title },
      });
  }

  public get icon() {
    return this._icon;
  }

  public set icon(value: string) {
    this._icon = value;
    this.options.useHTMLTitleAndIcon &&
      YNBEventBus.shared.emit({
        eventName: "desktop.onTabIcon",
        data: { id: this.id, iconUrl: this.icon },
      });
  }

  // ================ Private Methods ================= //
  private setup() {
    // 配置页面信息
    this.configDocumentInfo();

    // 监听容器事件
    this.listenContainerEvents();

    handleOpenWindow(this.context.webContents);

    // 打开调试工具
    startDevToolsIfNeed(this.context.webContents);
  }

  private configDocumentInfo() {
    this.context.webContents.on("dom-ready", async () => {
      const title = this.context.webContents.getTitle();
      if (!this.title && title) {
        this.title = title;
      }
      this.icon = await this.executeJavaScript(
        `
          (function() {
          const icon = document.querySelector('link[rel~="icon"]');
          return icon && icon.href || undefined;
          })()
        `
      );
    });
    // 这里可以获取到真实的title
    this.context.webContents.on("page-title-updated", (event, newTitle) => {
      if (newTitle) {
        this.title = newTitle;
      }
    });
  }

  /**
   * 监听容器事件
   */
  private listenContainerEvents(): void {
    this.context.webContents.on("render-process-gone", (_event, details) => {
      console.error(details);
    });
    // 加载失败
    this.context.webContents.on(
      "did-fail-load",
      (_event, errorCode, errorDescription) => {
        console.error(
          `YWebContainer 加载失败，错误代码: ${errorCode}，错误描述: ${errorDescription}`
        );
        if (this.options.useErrorView) {
          if (process.env._ENV === "local") {
            this.context.webContents.loadURL(getErrorPageUrl());
          } else {
            this.context.webContents.loadFile(getErrorPagePath());
          }
        }
      }
    );
  }
}

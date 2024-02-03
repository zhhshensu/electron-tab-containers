import { YWebContainer, YWebContainerOptions } from "./container";
import { BrowserViewConstructorOptions, BrowserWindow } from "electron";
import {
  getSendEventJS,
  getPreloadPath,
  kContainerIdsKey,
} from "../helpers/web";
import { YNBEventBus } from "../helpers/event-bus";
import { eventKey } from "../helpers/const";

/**
 * 容器管理器
 */
class YContainerManager {
  private static instance: YContainerManager;

  static get shared(): YContainerManager {
    if (!YContainerManager.instance) {
      YContainerManager.instance = new YContainerManager();
    }
    return YContainerManager.instance;
  }
  /**
   * 已存在的 containers <id, GDWebContainer>
   */
  private readonly containers: Map<number, YWebContainer>;
  /**
   * 全局选项
   */
  private globalOptions?: BrowserViewConstructorOptions;

  constructor() {
    this.configGlobalOptions();
    this.containers = new Map();
    this.listenYNBEvents();
  }

  /**
   * 创建一个 Container
   */
  public createContainer(
    url: string,
    options?: YWebContainerOptions
  ): YWebContainer {
    const opts = {
      ...(options || {}),
      ...this.globalOptions,
    };
    const webContainer = new YWebContainer(opts);
    options && webContainer.setOptions(options);
    this.containers.set(webContainer.id, webContainer);
    webContainer.loadURL(url);
    return webContainer;
  }

  /**
   * 通过 ID 获取容器
   * @param id 容器 ID
   */
  public getContainer(id: number): YWebContainer | undefined {
    return this.containers.get(id);
  }

  /**
   * 移除 Container
   * @param url
   */
  public removeContainer(id: number): void {
    const findView = this.containers.get(id);
    if (findView && findView.context.webContents) {
      findView.context.webContents.stop();
      findView.context.webContents.removeAllListeners();
      findView.context.webContents.forcefullyCrashRenderer();
    }
    this.containers.delete(id);
  }

  /**
   * 移除所有 Container
   */
  public removeAllContainers() {
    this.containers.clear();
  }

  /**
   * 发送事件通知容器
   */
  public listenYNBEvents() {
    YNBEventBus.shared.subscribe((data: any) => {
      for (const [id, container] of this.containers) {
        const dataInfo = data?.data || {};
        const containerIds = dataInfo[kContainerIdsKey];
        if (!containerIds || containerIds?.includes(id)) {
          // 如果是定向传输，过滤不在容器列表里的
          const win = BrowserWindow.fromWebContents(
            container.context.webContents
          );
          if (
            !dataInfo?.windowId ||
            (dataInfo.windowId && win && win.id === dataInfo.windowId)
          ) {
            container?.executeJavaScript(getSendEventJS(eventKey, data));
          }
        }
      }
    });
  }

  /**
   * 配置全局选项
   */
  private configGlobalOptions() {
    this.globalOptions = {
      webPreferences: {
        preload: getPreloadPath(),
        nodeIntegrationInSubFrames: true,
      },
    };
  }
}

export default YContainerManager;

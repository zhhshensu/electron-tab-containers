import { BrowserWindow, WebContents } from "electron";
import path from "path";
import { app } from "electron/main";
import { DEV_SERVER_URL } from "./const";
import { YWindowManager } from "@/window";
import YContainerManager from "@/container";

/**
 * 容器 ID 集合字段
 */
export const kContainerIdsKey = "kDesktopContainerIdsKey";

/**
 * 发送事件 JS
 * @param eventName 事件名
 * @param eventData 事件内容
 */
export const getSendEventJS = (eventName: string, eventData: any) => {
  const eventDataStr = JSON.stringify(eventData);
  return `window.dispatchEvent(new CustomEvent('${eventName}', { detail: ${eventDataStr} }))`;
};

/**
 * 获取 preload 路径
 */
export function getPreloadPath(): string {
  return path.join(__dirname, "./preload.js");
}

/**
 * 拦截打开 window 事件
 * @param webContents
 */
export function handleOpenWindow(webContents: WebContents): void {
  webContents.setWindowOpenHandler(({ url }) => {
    const container = YContainerManager.shared.getContainer(webContents.id);
    const win = YWindowManager.shared.getWindowFromBrowserView(
      container.context
    );
    win.tabContainer.createTab(url);
    return {
      action: "deny",
    };
  });
}

/**
 * 如果需要，开启开发工具
 * 界面操作：连击左边 control 3 次
 */
export function startDevToolsIfNeed(webContents: WebContents) {
  if (!app.isPackaged) {
    let clicks = 0;
    let previousClickTime = 0;
    webContents.addListener("before-input-event", (_event, input) => {
      if (input.type === "keyDown" && input.code === "ControlLeft") {
        const now = +new Date();
        if (now - previousClickTime < 300) {
          clicks++;
        } else {
          clicks = 1;
        }
        previousClickTime = now;

        if (clicks >= 3) {
          webContents.openDevTools({
            mode: "detach",
            activate: true,
          });
          webContents.devToolsWebContents?.focus();
          clicks = 0;
        }
      }
    });
  }
}

/**
 * 获取错误页面地址
 * @returns
 */
export function getErrorPagePath(): string {
  return path.join(__dirname, "../pages/error/index.html");
}
/**
 * 获取tabs页面地址
 * @returns
 */
export function getTabsPagePath(): string {
  return path.join(__dirname, "../pages/tabs/index.html");
}

export function getTabsPageUrl(): string {
  return `${DEV_SERVER_URL}/tabs/index.html`;
}

export function getErrorPageUrl(): string {
  return `${DEV_SERVER_URL}/error/index.html`;
}

import { YBEventManager } from "./event-manager";

declare global {
  interface Window {
    $ynb: any;
  }
}

/**
 * 刷新容器
 */
export function reload(): void {
  window.$ynb?.$desktop({ type: "reloadWebContainer" });
}

/**
 * 关闭所有标签页
 */
export function closeAllTabsOnWindow() {
  window.$ynb?.$desktop({
    type: "closeAllTabsOnWindow",
  });
}

/**
 * 关闭标签页
 * @param id 容器 ID
 */
export function closeTabOnTabPage(id: number): void {
  window.$ynb?.$desktop({ type: "closeTabOnTabPage", data: { id: id } });
}

/**
 * 框架准备完毕
 */
export function frameDidReadyOnTabPage(): void {
  window.$ynb?.$desktop({ type: "frameDidReadyOnTabPage" });
}

/**
 * 切换 Tab
 * @param id 容器 ID
 */
export async function switchTabOnWindow(id: number): Promise<any> {
  window.$ynb?.$desktop({ type: "switchTabOnWindow", data: { id: id } });
}

/**
 * 创建 Tab
 * @param url URL
 */
export async function createTabOnWindow(url: string): Promise<any> {
  window.$ynb?.$desktop({ type: "createTabOnWindow", data: { url: url } });
}

/**
 * 「监听」创建 Tab
 */
export function onCreateTab(source: any, callback: (id: number) => void): any {
  YBEventManager.shared.on(source, "desktop.onCreateTab", ({ id }) => {
    callback(id);
  });
}

/**
 * 「监听」切换 Tab
 */
export function onSwitchTab(source: any, callback: (id: number) => void): any {
  YBEventManager.shared.on(source, "desktop.onSwitchTab", ({ id }) => {
    callback(id);
  });
}

/**
 * 「监听」关闭 Tab
 */
export function onCloseTab(source: any, callback: (id: number) => void): any {
  YBEventManager.shared.on(source, "desktop.onCloseTab", ({ id }) => {
    callback(id);
  });
}

/**
 * 「监听」Tab Title 变化
 */
export function onTabTitle(
  source: any,
  callback: (id: number, title: string) => void
): any {
  YBEventManager.shared.on(source, "desktop.onTabTitle", ({ id, title }) => {
    callback(id, title);
  });
}

/**
 * 「监听」Tab icon 变化
 */
export function onTabIcon(
  source: any,
  callback: (id: number, iconUrl: string) => void
): any {
  YBEventManager.shared.on(source, "desktop.onTabIcon", ({ id, iconUrl }) => {
    callback(id, iconUrl);
  });
}

import { IpcMainEvent, ipcMain } from "electron";
import { YWindowManager } from "@/window";
import YContainerManager from "@/container";
export class DesktopService {
  private static instance: DesktopService;

  static get shared(): DesktopService {
    if (!DesktopService.instance) {
      DesktopService.instance = new DesktopService();
    }
    return DesktopService.instance;
  }

  public init() {
    ipcMain.handle("desktop:service", async (event: any, params?: any) => {
      const win = YWindowManager.shared.getWindowFromSender(event.sender);
      const type = params["type"];
      const data = params["data"] || {};
      data.windowId = win?.id ?? "";
      const func = functionMap[type];
      if (!func) {
        throw new Error(type + " 方法未实现");
      }
      return func(event, data);
    });
  }
}

const createTabOnWindow = async (
  _: IpcMainEvent,
  { windowId = -1, url = "" }
) => {
  const win = YWindowManager.shared.getWindow(windowId);
  win.tabContainer.createTab(url, windowId);
};

const closeTabOnTabPage = async (_event: any, { windowId = -1, id = -1 }) => {
  const win = YWindowManager.shared.getWindow(windowId);
  win.tabContainer.closeTab(id);
  return {};
};

const frameDidReadyOnTabPage = async (_event: any, { windowId = -1 }) => {
  const win = YWindowManager.shared.getWindow(windowId);
  win.tabContainer.setFrameReady();
  return {};
};

const switchTabOnWindow = (_: IpcMainEvent, { windowId = -1, id = -1 }) => {
  const win = YWindowManager.shared.getWindow(windowId);
  win.tabContainer.switchTabWithId(id, false);
};

const closeAllTabsOnWindow = (_: IpcMainEvent, { windowId = -1 }) => {
  const win = YWindowManager.shared.getWindow(windowId);
  win.tabContainer.closeAllTabs();
};

const reloadWebContainer = (_: IpcMainEvent) => {
  const webContents = _.sender;
  const container = YContainerManager.shared.getContainer(webContents.id);
  container.reload();
};

const functionMap: any = {
  closeTabOnTabPage: closeTabOnTabPage,
  frameDidReadyOnTabPage: frameDidReadyOnTabPage,
  switchTabOnWindow: switchTabOnWindow,
  createTabOnWindow: createTabOnWindow,
  closeAllTabsOnWindow: closeAllTabsOnWindow,
  reloadWebContainer,
};

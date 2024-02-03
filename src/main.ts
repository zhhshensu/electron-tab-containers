import { app } from "electron";
import { DesktopService } from "./service";
import { YWindowManager } from "./window";
import { getSendEventJS, getTabsPagePath, getTabsPageUrl } from "./helpers/web";
import { eventKey } from "./helpers/const";
import { YNBEventBus } from "./helpers/event-bus";

app.whenReady().then(() => {
  DesktopService.shared.init();
  console.log('12345')

  const win = YWindowManager.shared.createWindow({
    show: true,
    width: 800,
    height: 600,
    modal: false,
    title: "多标签页实例",
  });
  if (app.isPackaged) {
    win.loadFile(getTabsPagePath());
  } else {
    win.loadURL(getTabsPageUrl());
  }
  // 订阅自定义事件，渲染进程需要设置监听事件
  const handler = (data: any) => {
    const dataInfo = data?.data || {};
    if (!dataInfo?.windowId || (win && dataInfo.windowId === win.id)) {
      win?.webContents?.executeJavaScript(getSendEventJS(eventKey, data));
    }
  };
  const handlerId = YNBEventBus.shared.subscribe(handler);

  win.on("close", () => {
    if (win.id) {
      YNBEventBus.shared.unsubscribe(handlerId);
      YWindowManager.shared.removeWindow(win.id);
    }
    app.quit();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

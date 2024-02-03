import { Tab, TabGroup } from "./tabs";
import "./tabs";
import { YBEventManager } from "../utils/event-manager";
import {
  closeTabOnTabPage,
  createTabOnWindow,
  frameDidReadyOnTabPage,
  onCloseTab,
  onCreateTab,
  onSwitchTab,
  onTabTitle,
  onTabIcon,
  switchTabOnWindow,
} from "../utils/ynb.desktop";

YBEventManager.shared.register();

const tabGroup: TabGroup = document.querySelector(".tab-group")!;
tabGroup.on("ready", () => {
  console.info("TabGroup is ready");
});

const onCreate = (tabGroup: any) => {
  onCreateTab(this, (id) => {
    let tab = tabGroup.tabs.find(
      (item: { containerId: number }) => item.containerId == id
    );
    if (!tab) {
      tab = tabGroup.addTab({
        containerId: id,
        closable: true,
      });
      tab.on("closing", (_: any, __: any) => {
        closeTabOnTabPage(tab.containerId);
      });
    }
    tab.activate();
  });
};

const onClose = (tabGroup: any) => {
  onCloseTab(this, (id) => {
    let tab = tabGroup.tabs.find(
      (item: { containerId: number }) => item.containerId == id
    );
    if (tab) {
      tab.close(true, false);
    }
  });
};

const onSwitch = (tabGroup: any) => {
  onSwitchTab(this, (id) => {
    // 监听到需要切换标签
    let tab = tabGroup.tabs.find(
      (item: { containerId: number }) => item.containerId == id
    );
    if (tab && !tab.isActivated) {
      tab.activate();
    }
  });
};

const onTabContentChange = (tabGroup: any) => {
  onTabTitle(this, (id, title) => {
    let tab: Tab = tabGroup.tabs.find((item) => item.containerId == id);
    if (tab && title.length > 0) {
      tab.setTitle(title);
    }
  });
  onTabIcon(this, (id, iconUrl) => {
    let tab: Tab = tabGroup.tabs.find((item) => item.containerId == id);
    if (tab && iconUrl) {
      tab.setIcon(iconUrl, "");
    }
  });
};

onCreate(tabGroup);
onSwitch(tabGroup);
onClose(tabGroup);
onTabContentChange(tabGroup);
frameDidReadyOnTabPage();

tabGroup.on("tab-active", (tab: Tab) => {
  // 用户主动切换标签
  tab.containerId && switchTabOnWindow(tab.containerId);
});

tabGroup.on("click-add-button", () => {
  createTabOnWindow("https://juejin.cn/");
});

createTabOnWindow("https://juejin.cn/");
createTabOnWindow("https://juejin.cn/frontend");

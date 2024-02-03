import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("$ynb", {
  $desktop: ({ type, data }) =>
    ipcRenderer.invoke("desktop:service", { type, data }),
});

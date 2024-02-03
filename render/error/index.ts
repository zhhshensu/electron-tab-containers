import { reload } from "../utils/ynb.desktop";

const reloadBtn = document.getElementById("reloadButton");
reloadBtn &&
  reloadBtn.addEventListener("click", () => {
    reload();
  });

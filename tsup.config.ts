import { defineConfig } from "tsup";
import { globSync } from "glob";
import path from "path";

export default defineConfig({
  entry: globSync("./src/**/*.ts"),
  format: ["cjs"],
  tsconfig: path.join(__dirname, "tsconfig.json"),
  bundle: false, // 禁止捆绑
});

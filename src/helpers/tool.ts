import path from "path";

export function isLocalFilePath(filePath) {
  return filePath.startsWith("file://") || path.isAbsolute(filePath);
}

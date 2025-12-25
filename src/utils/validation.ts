import fs from "fs";
import { resolveFilePath } from "./path.js";

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    const resolvedPath = resolveFilePath(filePath);
    const stats = await fs.promises.stat(resolvedPath);
    return stats.isFile();
  } catch {
    return false;
  }
};

export const directoryExists = async (dirPath: string): Promise<boolean> => {
  try {
    const resolvedPath = resolveFilePath(dirPath);
    const stats = await fs.promises.stat(resolvedPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
};

export const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    const resolvedPath = resolveFilePath(targetPath);
    await fs.promises.access(resolvedPath);
    return true;
  } catch {
    return false;
  }
};

export const isReadable = async (targetPath: string): Promise<boolean> => {
  try {
    const resolvedPath = resolveFilePath(targetPath);
    await fs.promises.access(resolvedPath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

export const isWritable = async (targetPath: string): Promise<boolean> => {
  try {
    const resolvedPath = resolveFilePath(targetPath);
    await fs.promises.access(resolvedPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

export const isValidFileName = (fileName: string): boolean => {
  if (!fileName || fileName.length === 0) {
    return false;
  }

  // Windows has strictest restrictions, so we use those for cross-platform safety
  const illegalChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (illegalChars.test(fileName)) {
    return false;
  }

  // Reserved names on Windows
  const reservedNames = [
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
  ];
  const nameWithoutExt = fileName.split(".")[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    return false;
  }

  // Disallow names that are only dots or spaces
  if (/^[\s.]+$/.test(fileName)) {
    return false;
  }

  return true;
};

export const getFileStats = async (
  filePath: string
): Promise<fs.Stats | null> => {
  try {
    const resolvedPath = resolveFilePath(filePath);
    return await fs.promises.stat(resolvedPath);
  } catch {
    return null;
  }
};

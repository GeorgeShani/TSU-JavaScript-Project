import path from "path";
import os from "os";

// Cache home directory for boundary checking
const HOME_DIR = path.resolve(os.homedir());

// Resolve relative paths to absolute, normalize path separators
export const resolveFilePath = (
  inputPath: string,
  basePath?: string
): string => {
  if (path.isAbsolute(inputPath)) {
    return path.normalize(inputPath);
  }

  // Resolve relative to base path or current working directory
  const base = basePath ?? process.cwd();
  return path.resolve(base, inputPath);
};

export const getHomeDir = (): string => HOME_DIR;

export const isWithinHomeDir = (targetPath: string): boolean => {
  const resolved = resolveFilePath(targetPath);
  return resolved.startsWith(HOME_DIR) || resolved === HOME_DIR;
};

export const getParentDir = (targetPath: string): string => {
  return path.dirname(resolveFilePath(targetPath));
};

export const getFileName = (filePath: string): string => {
  return path.basename(filePath);
};

// Returns extension including dot (e.g., ".txt")
export const getFileExtension = (filePath: string): string => {
  return path.extname(filePath);
};

// Join path segments with proper separators
export const joinPaths = (...segments: string[]): string => {
  return path.join(...segments);
};

export const getRelativePath = (from: string, to: string): string => {
  return path.relative(from, to);
};

// Resolve . and .. segments, normalize slashes
export const normalizePath = (inputPath: string): string => {
  return path.normalize(inputPath);
};

import os from "os";
import path from "path";
import fs from "fs";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import {
  createBrotliCompress,
  createBrotliDecompress,
  createGzip,
  createGunzip,
  createDeflate,
  createInflate,
} from "zlib";
import crypto from "crypto";

import {
  resolveFilePath,
  getHomeDir,
  joinPaths,
  getFileName,
} from "../utils/path.js";
import {
  fileExists,
  directoryExists,
  pathExists,
  getFileStats,
  isValidFileName,
} from "../utils/validation.js";
import { MESSAGES } from "../constants/index.js";
import type {
  DirectoryEntry,
  FileInfo,
  SearchResult,
  GrepMatch,
  HashResult,
} from "../types/index.js";

export class FileManager {
  private _username: string;
  private _homeDir: string;

  constructor(username: string = "Anonymous") {
    this._username = username;
    this._homeDir = getHomeDir();
    // Set initial working directory to user's home
    process.chdir(this._homeDir);
  }

  get username(): string {
    return this._username;
  }

  set username(value: string) {
    this._username = value || "Anonymous";
  }

  get homeDir(): string {
    return this._homeDir;
  }

  get currentDir(): string {
    return process.cwd();
  }

  navigateUp(): boolean {
    const currentDir = process.cwd();
    const parentDir = path.dirname(currentDir);

    // Prevent navigating above home directory or at filesystem root
    if (
      currentDir === this._homeDir ||
      currentDir === parentDir ||
      !currentDir.startsWith(this._homeDir)
    ) {
      return false;
    }

    process.chdir(parentDir);
    return true;
  }

  async changeDirectory(targetPath: string): Promise<void> {
    const newPath = resolveFilePath(targetPath);

    if (!(await directoryExists(newPath))) {
      throw new Error(MESSAGES.errors.directoryNotFound(targetPath));
    }

    process.chdir(newPath);
  }

  async listDirectory(): Promise<DirectoryEntry[]> {
    const directoryPath = process.cwd();
    // withFileTypes returns Dirent objects with type info
    const entries = await fs.promises.readdir(directoryPath, {
      withFileTypes: true,
    });

    const detailedInfo: DirectoryEntry[] = [];

    for (const entry of entries) {
      const fullPath = joinPaths(directoryPath, entry.name);
      // lstat doesn't follow symlinks, showing actual file info
      const stats = await fs.promises.lstat(fullPath);

      detailedInfo.push({
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
        size: this.formatSize(stats.size),
        modified: stats.mtime.toLocaleString(),
      });
    }

    // Sort: directories first, then files, both alphabetically
    detailedInfo.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return detailedInfo;
  }

  pwd(): string {
    return process.cwd();
  }

  async readFile(filePath: string, signal?: AbortSignal): Promise<string> {
    const resolvedPath = resolveFilePath(filePath);

    if (!(await fileExists(resolvedPath))) {
      throw new Error(MESSAGES.errors.fileNotFound(filePath));
    }

    // Use streams for memory-efficient reading of large files
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const readStream = createReadStream(resolvedPath);

      // Handle abort signal
      const onAbort = () => {
        readStream.destroy();
        reject(new DOMException("Operation aborted", "AbortError"));
      };

      if (signal?.aborted) {
        reject(new DOMException("Operation aborted", "AbortError"));
        return;
      }

      signal?.addEventListener("abort", onAbort, { once: true });

      // Collect data chunks as they arrive
      readStream.on("data", (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      // Concatenate all chunks when stream ends
      readStream.on("end", () => {
        signal?.removeEventListener("abort", onAbort);
        resolve(Buffer.concat(chunks).toString("utf-8"));
      });

      readStream.on("error", (err) => {
        signal?.removeEventListener("abort", onAbort);
        reject(err);
      });
    });
  }

  async createFile(fileName: string): Promise<string> {
    if (!isValidFileName(fileName)) {
      throw new Error("Invalid file name");
    }

    const filePath = joinPaths(process.cwd(), fileName);

    if (await pathExists(filePath)) {
      throw new Error(MESSAGES.errors.fileExists(fileName));
    }

    // Create empty file
    await fs.promises.writeFile(filePath, "");
    return filePath;
  }

  async writeFile(fileName: string, content: string): Promise<string> {
    if (!isValidFileName(fileName)) {
      throw new Error("Invalid file name");
    }

    const filePath = joinPaths(process.cwd(), fileName);
    await fs.promises.writeFile(filePath, content, "utf-8");
    return filePath;
  }

  async createDirectory(dirName: string): Promise<string> {
    if (!isValidFileName(dirName)) {
      throw new Error("Invalid directory name");
    }

    const dirPath = joinPaths(process.cwd(), dirName);

    if (await pathExists(dirPath)) {
      throw new Error(MESSAGES.errors.directoryExists(dirName));
    }

    // recursive: false means parent must exist
    await fs.promises.mkdir(dirPath, { recursive: false });
    return dirPath;
  }

  async renameFile(oldPath: string, newFileName: string): Promise<void> {
    if (!isValidFileName(newFileName)) {
      throw new Error("Invalid file name");
    }

    const sourcePath = resolveFilePath(oldPath);

    if (!(await fileExists(sourcePath))) {
      throw new Error(MESSAGES.errors.fileNotFound(oldPath));
    }

    // Keep file in same directory, just change name
    const dirPath = path.dirname(sourcePath);
    const destPath = joinPaths(dirPath, newFileName);

    if (await pathExists(destPath)) {
      throw new Error(MESSAGES.errors.fileExists(newFileName));
    }

    await fs.promises.rename(sourcePath, destPath);
  }

  async copyFile(sourcePath: string, destDirPath: string, signal?: AbortSignal): Promise<string> {
    const resolvedSource = resolveFilePath(sourcePath);
    const resolvedDestDir = resolveFilePath(destDirPath);

    if (signal?.aborted) {
      throw new DOMException("Operation aborted", "AbortError");
    }

    if (!(await fileExists(resolvedSource))) {
      throw new Error(MESSAGES.errors.fileNotFound(sourcePath));
    }

    if (!(await directoryExists(resolvedDestDir))) {
      throw new Error(MESSAGES.errors.directoryNotFound(destDirPath));
    }

    const fileName = getFileName(resolvedSource);
    const destPath = joinPaths(resolvedDestDir, fileName);

    if (await fileExists(destPath)) {
      throw new Error(MESSAGES.errors.fileExists(destPath));
    }

    // Use stream pipeline for efficient copying of large files
    const readStream = createReadStream(resolvedSource);
    const writeStream = createWriteStream(destPath);

    // Handle abort signal
    if (signal) {
      const onAbort = () => {
        readStream.destroy();
        writeStream.destroy();
      };
      signal.addEventListener("abort", onAbort, { once: true });
      
      try {
        await pipeline(readStream, writeStream, { signal });
      } catch (error) {
        // Clean up partially written file on abort
        if (signal.aborted) {
          try {
            await fs.promises.unlink(destPath);
          } catch {
            // Ignore cleanup errors
          }
          throw new DOMException("Operation aborted", "AbortError");
        }
        throw error;
      } finally {
        signal.removeEventListener("abort", onAbort);
      }
    } else {
      await pipeline(readStream, writeStream);
    }

    return destPath;
  }

  async moveFile(sourcePath: string, destDirPath: string, signal?: AbortSignal): Promise<string> {
    // Move = copy + delete original
    const destPath = await this.copyFile(sourcePath, destDirPath, signal);
    await this.deleteFile(sourcePath);
    return destPath;
  }

  async deleteFile(filePath: string): Promise<void> {
    const resolvedPath = resolveFilePath(filePath);

    if (!(await fileExists(resolvedPath))) {
      throw new Error(MESSAGES.errors.fileNotFound(filePath));
    }

    // unlink removes files (not directories)
    await fs.promises.unlink(resolvedPath);
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    const resolvedPath = resolveFilePath(dirPath);

    if (!(await directoryExists(resolvedPath))) {
      throw new Error(MESSAGES.errors.directoryNotFound(dirPath));
    }

    // rmdir only removes empty directories
    await fs.promises.rmdir(resolvedPath);
  }

  async findFiles(
    pattern: string,
    searchPath?: string,
    signal?: AbortSignal
  ): Promise<SearchResult[]> {
    const basePath = searchPath ? resolveFilePath(searchPath) : process.cwd();
    const results: SearchResult[] = [];

    // Convert glob pattern to regex: . -> \., * -> .*, ? -> .
    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    const regex = new RegExp(regexPattern, "i");

    await this.searchRecursive(basePath, regex, results, signal);
    return results;
  }

  private async searchRecursive(
    dirPath: string,
    pattern: RegExp,
    results: SearchResult[],
    signal?: AbortSignal
  ): Promise<void> {
    try {
      // Check if operation was aborted
      if (signal?.aborted) {
        throw new DOMException("Operation aborted", "AbortError");
      }

      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Check if operation was aborted before processing each entry
        if (signal?.aborted) {
          throw new DOMException("Operation aborted", "AbortError");
        }

        const fullPath = joinPaths(dirPath, entry.name);

        // Check if name matches pattern
        if (pattern.test(entry.name)) {
          results.push({
            path: fullPath,
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
          });
        }

        // Recurse into subdirectories
        if (entry.isDirectory()) {
          await this.searchRecursive(fullPath, pattern, results, signal);
        }
      }
    } catch (error) {
      // Re-throw AbortError
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      // Skip directories we can't access (permission denied, etc.)
    }
  }

  async grep(searchPattern: string, filePath: string, signal?: AbortSignal): Promise<SearchResult[]> {
    const resolvedPath = resolveFilePath(filePath);
    const results: SearchResult[] = [];
    // Case-insensitive, global match
    const regex = new RegExp(searchPattern, "gi");

    const stats = await getFileStats(resolvedPath);
    if (!stats) {
      throw new Error(MESSAGES.errors.fileNotFound(filePath));
    }

    if (stats.isFile()) {
      const matches = await this.grepFile(resolvedPath, regex);
      if (matches.length > 0) {
        results.push({
          path: resolvedPath,
          name: getFileName(resolvedPath),
          type: "file",
          matches,
        });
      }
    } else if (stats.isDirectory()) {
      await this.grepRecursive(resolvedPath, regex, results, signal);
    }

    return results;
  }

  private async grepFile(filePath: string, pattern: RegExp): Promise<GrepMatch[]> {
    const matches: GrepMatch[] = [];

    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const lines = content.split("\n");

      // Check each line for pattern match
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          matches.push({
            line: index + 1, // 1-based line numbers
            content: line.trim(),
          });
        }
      });
    } catch {
      // Skip files we can't read (binary files, permission denied, etc.)
    }

    return matches;
  }

  private async grepRecursive(
    dirPath: string,
    pattern: RegExp,
    results: SearchResult[],
    signal?: AbortSignal
  ): Promise<void> {
    try {
      // Check if operation was aborted
      if (signal?.aborted) {
        throw new DOMException("Operation aborted", "AbortError");
      }

      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Check if operation was aborted before processing each entry
        if (signal?.aborted) {
          throw new DOMException("Operation aborted", "AbortError");
        }

        const fullPath = joinPaths(dirPath, entry.name);

        if (entry.isFile()) {
          const matches = await this.grepFile(fullPath, pattern);
          if (matches.length > 0) {
            results.push({
              path: fullPath,
              name: entry.name,
              type: "file",
              matches,
            });
          }
        } else if (entry.isDirectory()) {
          await this.grepRecursive(fullPath, pattern, results, signal);
        }
      }
    } catch (error) {
      // Re-throw AbortError
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      // Skip directories we can't access
    }
  }

  async calculateHash(
    filePath: string,
    algorithm: string = "sha256",
    signal?: AbortSignal
  ): Promise<HashResult> {
    const resolvedPath = resolveFilePath(filePath);

    if (signal?.aborted) {
      throw new DOMException("Operation aborted", "AbortError");
    }

    if (!(await fileExists(resolvedPath))) {
      throw new Error(MESSAGES.errors.fileNotFound(filePath));
    }

    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const fileStream = createReadStream(resolvedPath);

      // Handle abort signal
      const onAbort = () => {
        fileStream.destroy();
        reject(new DOMException("Operation aborted", "AbortError"));
      };

      signal?.addEventListener("abort", onAbort, { once: true });

      // Feed file data into hash incrementally
      fileStream.on("data", (chunk) => {
        hash.update(chunk);
      });

      // Finalize hash when file is fully read
      fileStream.on("end", () => {
        signal?.removeEventListener("abort", onAbort);
        resolve({
          algorithm,
          hash: hash.digest("hex"),
          filePath: resolvedPath,
        });
      });

      fileStream.on("error", (err) => {
        signal?.removeEventListener("abort", onAbort);
        reject(err);
      });
    });
  }

  async compressFile(
    sourcePath: string,
    destPath: string,
    algorithm: "brotli" | "gzip" | "deflate" = "brotli",
    signal?: AbortSignal
  ): Promise<{ originalSize: number; compressedSize: number }> {
    const resolvedSource = resolveFilePath(sourcePath);
    const resolvedDest = resolveFilePath(destPath);

    if (signal?.aborted) {
      throw new DOMException("Operation aborted", "AbortError");
    }

    if (!(await fileExists(resolvedSource))) {
      throw new Error(MESSAGES.errors.fileNotFound(sourcePath));
    }

    const sourceStats = await fs.promises.stat(resolvedSource);
    const originalSize = sourceStats.size;

    // Get appropriate compression transform stream
    const compressionStream = this.createCompressionStream(algorithm);

    const readStream = createReadStream(resolvedSource);
    const writeStream = createWriteStream(resolvedDest);

    // Handle abort signal
    if (signal) {
      const onAbort = () => {
        readStream.destroy();
        writeStream.destroy();
      };
      signal.addEventListener("abort", onAbort, { once: true });
      
      try {
        await pipeline(readStream, compressionStream, writeStream, { signal });
      } catch (error) {
        // Clean up partially written file on abort
        if (signal.aborted) {
          try {
            await fs.promises.unlink(resolvedDest);
          } catch {
            // Ignore cleanup errors
          }
          throw new DOMException("Operation aborted", "AbortError");
        }
        throw error;
      } finally {
        signal.removeEventListener("abort", onAbort);
      }
    } else {
      await pipeline(readStream, compressionStream, writeStream);
    }

    const destStats = await fs.promises.stat(resolvedDest);
    const compressedSize = destStats.size;

    return { originalSize, compressedSize };
  }

  async decompressFile(
    sourcePath: string,
    destPath: string,
    algorithm: "brotli" | "gzip" | "deflate" = "brotli",
    signal?: AbortSignal
  ): Promise<void> {
    const resolvedSource = resolveFilePath(sourcePath);
    const resolvedDest = resolveFilePath(destPath);

    if (signal?.aborted) {
      throw new DOMException("Operation aborted", "AbortError");
    }

    if (!(await fileExists(resolvedSource))) {
      throw new Error(MESSAGES.errors.fileNotFound(sourcePath));
    }

    // Get appropriate decompression transform stream
    const decompressionStream = this.createDecompressionStream(algorithm);

    const readStream = createReadStream(resolvedSource);
    const writeStream = createWriteStream(resolvedDest);

    // Handle abort signal
    if (signal) {
      const onAbort = () => {
        readStream.destroy();
        writeStream.destroy();
      };
      signal.addEventListener("abort", onAbort, { once: true });
      
      try {
        await pipeline(readStream, decompressionStream, writeStream, { signal });
      } catch (error) {
        // Clean up partially written file on abort
        if (signal.aborted) {
          try {
            await fs.promises.unlink(resolvedDest);
          } catch {
            // Ignore cleanup errors
          }
          throw new DOMException("Operation aborted", "AbortError");
        }
        throw error;
      } finally {
        signal.removeEventListener("abort", onAbort);
      }
    } else {
      await pipeline(readStream, decompressionStream, writeStream);
    }
  }

  // Factory method for compression streams
  private createCompressionStream(algorithm: "brotli" | "gzip" | "deflate") {
    switch (algorithm) {
      case "brotli":
        return createBrotliCompress();
      case "gzip":
        return createGzip();
      case "deflate":
        return createDeflate();
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
  }

  // Factory method for decompression streams
  private createDecompressionStream(algorithm: "brotli" | "gzip" | "deflate") {
    switch (algorithm) {
      case "brotli":
        return createBrotliDecompress();
      case "gzip":
        return createGunzip();
      case "deflate":
        return createInflate();
      default:
        throw new Error(`Unsupported decompression algorithm: ${algorithm}`);
    }
  }

  // Detect algorithm based on file extension
  detectCompressionAlgorithm(filePath: string): "brotli" | "gzip" | "deflate" | null {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case ".br":
        return "brotli";
      case ".gz":
        return "gzip";
      case ".zz":
      case ".deflate":
        return "deflate";
      default:
        return null;
    }
  }

  getCompressionExtension(algorithm: "brotli" | "gzip" | "deflate"): string {
    switch (algorithm) {
      case "brotli":
        return ".br";
      case "gzip":
        return ".gz";
      case "deflate":
        return ".zz";
      default:
        return ".compressed";
    }
  }

  getOSInfo(flag: string): string {
    switch (flag) {
      case "--EOL":
        // JSON.stringify shows the actual escape sequence
        return `EOL character: ${JSON.stringify(os.EOL)}`;

      case "--cpus": {
        const cpus = os.cpus();
        let result = `Total CPUs: ${cpus.length}\n`;
        cpus.forEach((cpu, index) => {
          // Convert MHz to GHz
          result += `CPU ${index + 1}: ${cpu.model} (${(cpu.speed / 1000).toFixed(2)} GHz)\n`;
        });
        return result.trim();
      }

      case "--homedir":
        return `Home directory: ${os.homedir()}`;

      case "--username":
        return `System Username: ${os.userInfo().username}`;

      case "--architecture":
        return `CPU Architecture: ${process.arch}`;

      case "--platform":
        return `Platform: ${os.platform()}`;

      case "--memory": {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        return `Total Memory: ${this.formatSize(totalMem)}\nFree Memory: ${this.formatSize(freeMem)}`;
      }

      default:
        throw new Error(`Invalid OS info parameter: ${flag}`);
    }
  }

  // Convert bytes to human-readable format (KB, MB, GB, etc.)
  private formatSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    // No decimals for bytes, 2 decimals for larger units
    return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
  }

  async getFileInfo(filePath: string): Promise<FileInfo> {
    const resolvedPath = resolveFilePath(filePath);
    const stats = await getFileStats(resolvedPath);

    if (!stats) {
      throw new Error(MESSAGES.errors.fileNotFound(filePath));
    }

    return {
      path: resolvedPath,
      name: getFileName(resolvedPath),
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      created: stats.birthtime,
      modified: stats.mtime,
      // Convert mode to octal string, take last 3 digits (rwx permissions)
      permissions: stats.mode.toString(8).slice(-3),
    };
  }
}

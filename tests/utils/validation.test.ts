/**
 * Validation Utility Tests
 * Tests for file system validation functions
 * 
 * Demonstrates: Async testing, file system mocking,
 * beforeAll/afterAll for setup/teardown
 */

import fs from "fs";
import path from "path";
import os from "os";

import {
  fileExists,
  directoryExists,
  pathExists,
  isReadable,
  isWritable,
  isValidFileName,
  getFileStats,
} from "../../src/utils/validation";

describe("Validation Utilities", () => {
  // Test directory and files
  let testDir: string;
  let testFile: string;
  let testSubDir: string;

  // Set up test environment before all tests
  beforeAll(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `fm-test-${Date.now()}`);
    testSubDir = path.join(testDir, "subdir");
    testFile = path.join(testDir, "test-file.txt");

    await fs.promises.mkdir(testDir, { recursive: true });
    await fs.promises.mkdir(testSubDir);
    await fs.promises.writeFile(testFile, "Test content");
  });

  // Clean up after all tests
  afterAll(async () => {
    try {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  // ==================== fileExists Tests ====================
  describe("fileExists", () => {
    describe("success cases", () => {
      it("should return true for existing file", async () => {
        const result = await fileExists(testFile);
        expect(result).toBe(true);
      });

      it("should work with absolute paths", async () => {
        const result = await fileExists(testFile);
        expect(result).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false for non-existent file", async () => {
        const result = await fileExists(path.join(testDir, "non-existent.txt"));
        expect(result).toBe(false);
      });

      it("should return false for directory", async () => {
        const result = await fileExists(testSubDir);
        expect(result).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should return false for empty path", async () => {
        const result = await fileExists("");
        expect(result).toBe(false);
      });
    });
  });

  // ==================== directoryExists Tests ====================
  describe("directoryExists", () => {
    describe("success cases", () => {
      it("should return true for existing directory", async () => {
        const result = await directoryExists(testDir);
        expect(result).toBe(true);
      });

      it("should return true for subdirectory", async () => {
        const result = await directoryExists(testSubDir);
        expect(result).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false for non-existent directory", async () => {
        const result = await directoryExists(
          path.join(testDir, "non-existent-dir")
        );
        expect(result).toBe(false);
      });

      it("should return false for file", async () => {
        const result = await directoryExists(testFile);
        expect(result).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should resolve empty path to cwd (which is a directory)", async () => {
        // Empty path resolves to current working directory
        const result = await directoryExists("");
        // This returns true because cwd is a valid directory
        expect(result).toBe(true);
      });
    });
  });

  // ==================== pathExists Tests ====================
  describe("pathExists", () => {
    describe("success cases", () => {
      it("should return true for existing file", async () => {
        const result = await pathExists(testFile);
        expect(result).toBe(true);
      });

      it("should return true for existing directory", async () => {
        const result = await pathExists(testDir);
        expect(result).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false for non-existent path", async () => {
        const result = await pathExists(path.join(testDir, "non-existent"));
        expect(result).toBe(false);
      });
    });
  });

  // ==================== isReadable Tests ====================
  describe("isReadable", () => {
    describe("success cases", () => {
      it("should return true for readable file", async () => {
        const result = await isReadable(testFile);
        expect(result).toBe(true);
      });

      it("should return true for readable directory", async () => {
        const result = await isReadable(testDir);
        expect(result).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false for non-existent path", async () => {
        const result = await isReadable(path.join(testDir, "non-existent"));
        expect(result).toBe(false);
      });
    });
  });

  // ==================== isWritable Tests ====================
  describe("isWritable", () => {
    describe("success cases", () => {
      it("should return true for writable file", async () => {
        const result = await isWritable(testFile);
        expect(result).toBe(true);
      });

      it("should return true for writable directory", async () => {
        const result = await isWritable(testDir);
        expect(result).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false for non-existent path", async () => {
        const result = await isWritable(path.join(testDir, "non-existent"));
        expect(result).toBe(false);
      });
    });
  });

  // ==================== isValidFileName Tests ====================
  describe("isValidFileName", () => {
    describe("success cases", () => {
      it("should return true for simple file name", () => {
        expect(isValidFileName("file.txt")).toBe(true);
      });

      it("should return true for file name with numbers", () => {
        expect(isValidFileName("file123.txt")).toBe(true);
      });

      it("should return true for file name with hyphens", () => {
        expect(isValidFileName("my-file.txt")).toBe(true);
      });

      it("should return true for file name with underscores", () => {
        expect(isValidFileName("my_file.txt")).toBe(true);
      });

      it("should return true for hidden files", () => {
        expect(isValidFileName(".gitignore")).toBe(true);
      });

      it("should return true for multiple extensions", () => {
        expect(isValidFileName("archive.tar.gz")).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false for empty string", () => {
        expect(isValidFileName("")).toBe(false);
      });

      it("should return false for names with <", () => {
        expect(isValidFileName("file<name.txt")).toBe(false);
      });

      it("should return false for names with >", () => {
        expect(isValidFileName("file>name.txt")).toBe(false);
      });

      it("should return false for names with :", () => {
        expect(isValidFileName("file:name.txt")).toBe(false);
      });

      it("should return false for names with double quotes", () => {
        expect(isValidFileName('file"name.txt')).toBe(false);
      });

      it("should return false for names with |", () => {
        expect(isValidFileName("file|name.txt")).toBe(false);
      });

      it("should return false for names with ?", () => {
        expect(isValidFileName("file?name.txt")).toBe(false);
      });

      it("should return false for names with *", () => {
        expect(isValidFileName("file*name.txt")).toBe(false);
      });

      it("should return false for names with forward slash", () => {
        expect(isValidFileName("file/name.txt")).toBe(false);
      });

      it("should return false for names with backslash", () => {
        expect(isValidFileName("file\\name.txt")).toBe(false);
      });

      it("should return false for reserved names (Windows)", () => {
        expect(isValidFileName("CON")).toBe(false);
        expect(isValidFileName("PRN")).toBe(false);
        expect(isValidFileName("AUX")).toBe(false);
        expect(isValidFileName("NUL")).toBe(false);
        expect(isValidFileName("COM1")).toBe(false);
        expect(isValidFileName("LPT1")).toBe(false);
      });

      it("should return false for reserved names with extensions", () => {
        expect(isValidFileName("CON.txt")).toBe(false);
        expect(isValidFileName("NUL.doc")).toBe(false);
      });

      it("should return false for only dots", () => {
        expect(isValidFileName(".")).toBe(false);
        expect(isValidFileName("..")).toBe(false);
        expect(isValidFileName("...")).toBe(false);
      });

      it("should return false for only spaces", () => {
        expect(isValidFileName("   ")).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should handle case-insensitive reserved names", () => {
        expect(isValidFileName("con")).toBe(false);
        expect(isValidFileName("Con")).toBe(false);
        expect(isValidFileName("CON")).toBe(false);
      });

      it("should allow similar but not exact reserved names", () => {
        expect(isValidFileName("CONSOLE")).toBe(true);
        expect(isValidFileName("COM10")).toBe(true);
        expect(isValidFileName("LPT10")).toBe(true);
      });
    });
  });

  // ==================== getFileStats Tests ====================
  describe("getFileStats", () => {
    describe("success cases", () => {
      it("should return stats for existing file", async () => {
        const result = await getFileStats(testFile);
        expect(result).not.toBeNull();
        expect(result?.isFile()).toBe(true);
      });

      it("should return stats for existing directory", async () => {
        const result = await getFileStats(testDir);
        expect(result).not.toBeNull();
        expect(result?.isDirectory()).toBe(true);
      });

      it("should return size property", async () => {
        const result = await getFileStats(testFile);
        expect(result).not.toBeNull();
        expect(typeof result?.size).toBe("number");
        expect(result?.size).toBeGreaterThan(0);
      });

      it("should return modification time", async () => {
        const result = await getFileStats(testFile);
        expect(result).not.toBeNull();
        // Check that mtime is a Date-like object with getTime method
        expect(typeof result?.mtime?.getTime).toBe("function");
        expect(typeof result?.mtime?.getTime()).toBe("number");
      });
    });

    describe("negative cases", () => {
      it("should return null for non-existent path", async () => {
        const result = await getFileStats(path.join(testDir, "non-existent"));
        expect(result).toBeNull();
      });
    });

    describe("edge cases", () => {
      it("should return stats for empty path (resolves to cwd)", async () => {
        // Empty path resolves to current working directory
        const result = await getFileStats("");
        // cwd is a valid path, so stats are returned
        expect(result).not.toBeNull();
        expect(result?.isDirectory()).toBe(true);
      });
    });
  });
});

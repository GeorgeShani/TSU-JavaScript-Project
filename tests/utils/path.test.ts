/**
 * Path Utility Tests
 * Tests for path resolution functions
 * 
 * Demonstrates: Jest testing with file system operations,
 * mocking, beforeEach/afterEach hooks
 */

import path from "path";
import os from "os";

import {
  resolveFilePath,
  getHomeDir,
  isWithinHomeDir,
  getParentDir,
  getFileName,
  getFileExtension,
  joinPaths,
  getRelativePath,
  normalizePath,
} from "../../src/utils/path";

describe("Path Utilities", () => {
  const originalCwd = process.cwd();
  const homeDir = os.homedir();

  afterEach(() => {
    // Restore original working directory after each test
    process.chdir(originalCwd);
  });

  // ==================== resolveFilePath Tests ====================
  describe("resolveFilePath", () => {
    describe("success cases", () => {
      it("should return absolute path unchanged", () => {
        const absolutePath = path.join(homeDir, "Documents", "file.txt");
        const result = resolveFilePath(absolutePath);
        expect(result).toBe(path.normalize(absolutePath));
      });

      it("should resolve relative path from cwd", () => {
        const result = resolveFilePath("file.txt");
        expect(result).toBe(path.join(process.cwd(), "file.txt"));
      });

      it("should resolve relative path from custom base", () => {
        const result = resolveFilePath("file.txt", "/custom/base");
        expect(result).toBe(path.resolve("/custom/base", "file.txt"));
      });

      it("should handle parent directory references", () => {
        const result = resolveFilePath("../file.txt");
        const expected = path.resolve(process.cwd(), "..", "file.txt");
        expect(result).toBe(expected);
      });

      it("should handle current directory references", () => {
        const result = resolveFilePath("./file.txt");
        expect(result).toBe(path.join(process.cwd(), "file.txt"));
      });
    });

    describe("edge cases", () => {
      it("should handle empty string", () => {
        const result = resolveFilePath("");
        expect(result).toBe(process.cwd());
      });

      it("should normalize redundant separators", () => {
        const result = resolveFilePath("folder//subfolder///file.txt");
        expect(result).not.toContain("//");
      });
    });
  });

  // ==================== getHomeDir Tests ====================
  describe("getHomeDir", () => {
    describe("success cases", () => {
      it("should return home directory", () => {
        const result = getHomeDir();
        expect(result).toBe(path.resolve(homeDir));
      });

      it("should return absolute path", () => {
        const result = getHomeDir();
        expect(path.isAbsolute(result)).toBe(true);
      });
    });
  });

  // ==================== isWithinHomeDir Tests ====================
  describe("isWithinHomeDir", () => {
    describe("success cases", () => {
      it("should return true for path inside home directory", () => {
        const testPath = path.join(homeDir, "Documents");
        expect(isWithinHomeDir(testPath)).toBe(true);
      });

      it("should return true for home directory itself", () => {
        expect(isWithinHomeDir(homeDir)).toBe(true);
      });

      it("should return true for deeply nested path in home", () => {
        const testPath = path.join(homeDir, "a", "b", "c", "d");
        expect(isWithinHomeDir(testPath)).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false for path outside home directory", () => {
        // Use a path that's definitely outside home
        const outsidePath = path.parse(homeDir).root;
        if (outsidePath !== homeDir) {
          expect(isWithinHomeDir(outsidePath)).toBe(false);
        }
      });
    });
  });

  // ==================== getParentDir Tests ====================
  describe("getParentDir", () => {
    describe("success cases", () => {
      it("should return parent directory", () => {
        const testPath = path.join(homeDir, "Documents", "file.txt");
        const result = getParentDir(testPath);
        expect(result).toBe(path.join(homeDir, "Documents"));
      });

      it("should handle relative paths", () => {
        const result = getParentDir("folder/subfolder/file.txt");
        expect(result).toBe(path.resolve("folder/subfolder"));
      });
    });

    describe("edge cases", () => {
      it("should return same path for root directory", () => {
        const root = path.parse(homeDir).root;
        const result = getParentDir(root);
        expect(result).toBe(root);
      });
    });
  });

  // ==================== getFileName Tests ====================
  describe("getFileName", () => {
    describe("success cases", () => {
      it("should return file name from path", () => {
        expect(getFileName("/path/to/file.txt")).toBe("file.txt");
      });

      it("should return file name with extension", () => {
        expect(getFileName("document.pdf")).toBe("document.pdf");
      });

      it("should handle paths without extension", () => {
        expect(getFileName("/path/to/README")).toBe("README");
      });

      it("should handle hidden files", () => {
        expect(getFileName("/path/to/.gitignore")).toBe(".gitignore");
      });
    });

    describe("edge cases", () => {
      it("should return folder name for directory path ending with separator", () => {
        // path.basename normalizes the trailing slash
        const result = getFileName("/path/to/folder/");
        expect(result).toBe("folder");
      });

      it("should handle Windows paths", () => {
        expect(getFileName("C:\\Users\\file.txt")).toBe("file.txt");
      });
    });
  });

  // ==================== getFileExtension Tests ====================
  describe("getFileExtension", () => {
    describe("success cases", () => {
      it("should return extension with dot", () => {
        expect(getFileExtension("file.txt")).toBe(".txt");
      });

      it("should return last extension for multiple dots", () => {
        expect(getFileExtension("archive.tar.gz")).toBe(".gz");
      });

      it("should handle uppercase extensions", () => {
        expect(getFileExtension("image.PNG")).toBe(".PNG");
      });
    });

    describe("edge cases", () => {
      it("should return empty string for files without extension", () => {
        expect(getFileExtension("README")).toBe("");
      });

      it("should return empty string for hidden files without extension", () => {
        expect(getFileExtension(".gitignore")).toBe("");
      });

      it("should return extension for hidden files with extension", () => {
        expect(getFileExtension(".config.json")).toBe(".json");
      });
    });
  });

  // ==================== joinPaths Tests ====================
  describe("joinPaths", () => {
    describe("success cases", () => {
      it("should join multiple path segments", () => {
        const result = joinPaths("folder", "subfolder", "file.txt");
        expect(result).toBe(path.join("folder", "subfolder", "file.txt"));
      });

      it("should handle single segment", () => {
        expect(joinPaths("folder")).toBe("folder");
      });

      it("should normalize the result", () => {
        const result = joinPaths("folder", "..", "other", "file.txt");
        expect(result).toBe(path.join("other", "file.txt"));
      });
    });

    describe("edge cases", () => {
      it("should handle empty segments", () => {
        const result = joinPaths("folder", "", "file.txt");
        expect(result).toBe(path.join("folder", "file.txt"));
      });
    });
  });

  // ==================== getRelativePath Tests ====================
  describe("getRelativePath", () => {
    describe("success cases", () => {
      it("should return relative path between directories", () => {
        const from = path.join(homeDir, "folder1");
        const to = path.join(homeDir, "folder2", "file.txt");
        const result = getRelativePath(from, to);
        expect(result).toBe(path.join("..", "folder2", "file.txt"));
      });

      it("should return just filename for same directory", () => {
        const dir = path.join(homeDir, "folder");
        const file = path.join(homeDir, "folder", "file.txt");
        const result = getRelativePath(dir, file);
        expect(result).toBe("file.txt");
      });
    });
  });

  // ==================== normalizePath Tests ====================
  describe("normalizePath", () => {
    describe("success cases", () => {
      it("should remove redundant separators", () => {
        const result = normalizePath("folder//subfolder///file.txt");
        expect(result).not.toContain("//");
      });

      it("should resolve . references", () => {
        const result = normalizePath("folder/./file.txt");
        expect(result).toBe(path.normalize("folder/file.txt"));
      });

      it("should resolve .. references", () => {
        const result = normalizePath("folder/subfolder/../file.txt");
        expect(result).toBe(path.normalize("folder/file.txt"));
      });
    });

    describe("edge cases", () => {
      it("should handle empty string", () => {
        expect(normalizePath("")).toBe(".");
      });

      it("should handle single dot", () => {
        expect(normalizePath(".")).toBe(".");
      });
    });
  });
});

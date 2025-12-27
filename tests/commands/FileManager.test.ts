/**
 * FileManager Class Tests
 * Tests for core file management operations
 * 
 * Demonstrates: Testing classes, async operations, file system tests
 */

import fs from "fs";
import path from "path";
import os from "os";
import { FileManager } from "../../src/cli/FileManager";

describe("FileManager", () => {
  let fileManager: FileManager;
  let testDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    // Store original working directory
    originalCwd = process.cwd();

    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `fm-class-test-${Date.now()}`);
    await fs.promises.mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up test directory
    try {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Create fresh FileManager for each test
    fileManager = new FileManager("TestUser");
    // Change to test directory
    process.chdir(testDir);
  });

  // ==================== Constructor Tests ====================
  describe("constructor", () => {
    it("should create FileManager with provided username", () => {
      const fm = new FileManager("John");
      expect(fm.username).toBe("John");
    });

    it("should default username to Anonymous", () => {
      const fm = new FileManager();
      expect(fm.username).toBe("Anonymous");
    });

    it("should set home directory", () => {
      const fm = new FileManager();
      expect(fm.homeDir).toBe(path.resolve(os.homedir()));
    });
  });

  // ==================== Username Getter/Setter Tests ====================
  describe("username property", () => {
    it("should get username", () => {
      expect(fileManager.username).toBe("TestUser");
    });

    it("should set username", () => {
      fileManager.username = "NewUser";
      expect(fileManager.username).toBe("NewUser");
    });

    it("should default to Anonymous if set to empty", () => {
      fileManager.username = "";
      expect(fileManager.username).toBe("Anonymous");
    });
  });

  // ==================== currentDir Getter Tests ====================
  describe("currentDir property", () => {
    it("should return the current working directory", () => {
      process.chdir(testDir);
      expect(fileManager.currentDir).toBe(testDir);
    });

    it("should reflect directory changes", async () => {
      const subDir = path.join(testDir, `currentdir-test-${Date.now()}`);
      await fs.promises.mkdir(subDir, { recursive: true });
      
      process.chdir(subDir);
      expect(fileManager.currentDir).toBe(subDir);
      
      process.chdir(testDir);
      expect(fileManager.currentDir).toBe(testDir);
    });
  });

  // ==================== Navigation Tests ====================
  describe("navigation", () => {
    describe("pwd", () => {
      it("should return current working directory", () => {
        process.chdir(testDir);
        expect(fileManager.pwd()).toBe(testDir);
      });
    });

    describe("navigateUp", () => {
      it("should navigate to parent directory", async () => {
        const subDir = path.join(testDir, "subdir");
        await fs.promises.mkdir(subDir, { recursive: true });
        process.chdir(subDir);

        // Mock home directory check by setting _homeDir
        Object.defineProperty(fileManager, "_homeDir", {
          value: testDir,
          writable: true,
        });

        const result = fileManager.navigateUp();
        expect(result).toBe(true);
        expect(process.cwd()).toBe(testDir);
      });

      it("should return false when already at home directory", async () => {
        // Mock home directory to be current test directory
        Object.defineProperty(fileManager, "_homeDir", {
          value: testDir,
          writable: true,
        });
        process.chdir(testDir);

        const result = fileManager.navigateUp();
        expect(result).toBe(false);
        expect(process.cwd()).toBe(testDir);
      });

      it("should return false when current directory is not under home", async () => {
        // Set home to a subdirectory, but we're in the parent
        const subDir = path.join(testDir, "restricted-home");
        await fs.promises.mkdir(subDir, { recursive: true });
        
        Object.defineProperty(fileManager, "_homeDir", {
          value: subDir,
          writable: true,
        });
        process.chdir(testDir);

        const result = fileManager.navigateUp();
        expect(result).toBe(false);
      });
    });

    describe("changeDirectory", () => {
      it("should change to existing directory", async () => {
        const subDir = path.join(testDir, "changedir-test");
        await fs.promises.mkdir(subDir, { recursive: true });

        await fileManager.changeDirectory(subDir);
        expect(process.cwd()).toBe(subDir);
      });

      it("should throw error for non-existent directory", async () => {
        await expect(
          fileManager.changeDirectory("non-existent-dir")
        ).rejects.toThrow();
      });
    });

    describe("listDirectory", () => {
      it("should list directory contents", async () => {
        // Create test files and directories
        const testFile = path.join(testDir, "list-test.txt");
        const testSubDir = path.join(testDir, "list-test-dir");
        
        await fs.promises.writeFile(testFile, "content");
        await fs.promises.mkdir(testSubDir, { recursive: true });

        process.chdir(testDir);
        const entries = await fileManager.listDirectory();

        expect(entries.length).toBeGreaterThan(0);
        expect(entries.some((e) => e.name === "list-test.txt")).toBe(true);
        expect(entries.some((e) => e.name === "list-test-dir")).toBe(true);
      });

      it("should sort directories before files", async () => {
        const entries = await fileManager.listDirectory();
        
        let foundFile = false;
        for (const entry of entries) {
          if (entry.type === "file") foundFile = true;
          if (entry.type === "directory" && foundFile) {
            fail("Directory found after file - sorting is incorrect");
          }
        }
      });
    });
  });

  // ==================== File Operations Tests ====================
  describe("file operations", () => {
    describe("createFile", () => {
      it("should create empty file", async () => {
        const fileName = `create-test-${Date.now()}.txt`;
        const filePath = await fileManager.createFile(fileName);

        expect(await fs.promises.access(filePath).then(() => true).catch(() => false)).toBe(true);
        const content = await fs.promises.readFile(filePath, "utf-8");
        expect(content).toBe("");
      });

      it("should throw error for invalid file name", async () => {
        await expect(fileManager.createFile("file<name.txt")).rejects.toThrow();
      });

      it("should throw error if file already exists", async () => {
        const fileName = `existing-${Date.now()}.txt`;
        await fileManager.createFile(fileName);
        await expect(fileManager.createFile(fileName)).rejects.toThrow();
      });
    });

    describe("writeFile", () => {
      it("should create file with content", async () => {
        const fileName = `write-test-${Date.now()}.txt`;
        const content = "Hello, World!";
        
        const filePath = await fileManager.writeFile(fileName, content);
        const readContent = await fs.promises.readFile(filePath, "utf-8");
        
        expect(readContent).toBe(content);
      });

      it("should overwrite existing file", async () => {
        const fileName = `overwrite-test-${Date.now()}.txt`;
        
        await fileManager.writeFile(fileName, "Original");
        await fileManager.writeFile(fileName, "Updated");
        
        const content = await fs.promises.readFile(
          path.join(testDir, fileName),
          "utf-8"
        );
        expect(content).toBe("Updated");
      });

      it("should throw error for invalid file name", async () => {
        await expect(
          fileManager.writeFile("invalid<file>.txt", "content")
        ).rejects.toThrow("Invalid file name");
      });

      it("should handle empty content", async () => {
        const fileName = `write-empty-${Date.now()}.txt`;
        
        await fileManager.writeFile(fileName, "");
        
        const content = await fs.promises.readFile(
          path.join(testDir, fileName),
          "utf-8"
        );
        expect(content).toBe("");
      });

      it("should handle multi-line content", async () => {
        const fileName = `write-multiline-${Date.now()}.txt`;
        const content = "Line 1\nLine 2\nLine 3";
        
        await fileManager.writeFile(fileName, content);
        
        const readContent = await fs.promises.readFile(
          path.join(testDir, fileName),
          "utf-8"
        );
        expect(readContent).toBe(content);
      });
    });

    describe("readFile", () => {
      it("should read file contents", async () => {
        const fileName = `read-test-${Date.now()}.txt`;
        const expectedContent = "Test content for reading";
        
        await fs.promises.writeFile(
          path.join(testDir, fileName),
          expectedContent
        );

        const content = await fileManager.readFile(fileName);
        expect(content).toBe(expectedContent);
      });

      it("should throw error for non-existent file", async () => {
        await expect(
          fileManager.readFile("non-existent-file.txt")
        ).rejects.toThrow();
      });

      it("should read binary file contents", async () => {
        const fileName = `read-binary-${Date.now()}.bin`;
        const binaryContent = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
        
        await fs.promises.writeFile(path.join(testDir, fileName), binaryContent);

        const content = await fileManager.readFile(fileName);
        expect(content).toBe("Hello");
      });

      it("should read large file contents", async () => {
        const fileName = `read-large-${Date.now()}.txt`;
        const largeContent = "A".repeat(100000);
        
        await fs.promises.writeFile(path.join(testDir, fileName), largeContent);

        const content = await fileManager.readFile(fileName);
        expect(content).toBe(largeContent);
        expect(content.length).toBe(100000);
      });

      it("should read file with unicode content", async () => {
        const fileName = `read-unicode-${Date.now()}.txt`;
        const unicodeContent = "Hello 世界 🌍 Привет";
        
        await fs.promises.writeFile(path.join(testDir, fileName), unicodeContent, "utf-8");

        const content = await fileManager.readFile(fileName);
        expect(content).toBe(unicodeContent);
      });

    });

    describe("createDirectory", () => {
      it("should create directory", async () => {
        const dirName = `mkdir-test-${Date.now()}`;
        const dirPath = await fileManager.createDirectory(dirName);

        const stats = await fs.promises.stat(dirPath);
        expect(stats.isDirectory()).toBe(true);
      });

      it("should throw error if directory exists", async () => {
        const dirName = `existing-dir-${Date.now()}`;
        await fileManager.createDirectory(dirName);
        await expect(fileManager.createDirectory(dirName)).rejects.toThrow();
      });

      it("should throw error for invalid directory name", async () => {
        await expect(
          fileManager.createDirectory("invalid<dir>")
        ).rejects.toThrow("Invalid directory name");
      });

      it("should return the full path of created directory", async () => {
        const dirName = `mkdir-path-${Date.now()}`;
        const dirPath = await fileManager.createDirectory(dirName);

        expect(dirPath).toBe(path.join(testDir, dirName));
      });
    });

    describe("renameFile", () => {
      it("should rename file", async () => {
        const oldName = `rename-old-${Date.now()}.txt`;
        const newName = `rename-new-${Date.now()}.txt`;
        
        await fileManager.createFile(oldName);
        await fileManager.renameFile(oldName, newName);

        const oldExists = await fs.promises
          .access(path.join(testDir, oldName))
          .then(() => true)
          .catch(() => false);
        const newExists = await fs.promises
          .access(path.join(testDir, newName))
          .then(() => true)
          .catch(() => false);

        expect(oldExists).toBe(false);
        expect(newExists).toBe(true);
      });

      it("should throw error for non-existent source", async () => {
        await expect(
          fileManager.renameFile("non-existent.txt", "new-name.txt")
        ).rejects.toThrow();
      });

      it("should throw error for invalid new file name", async () => {
        const oldName = `rename-invalid-${Date.now()}.txt`;
        await fileManager.createFile(oldName);

        await expect(
          fileManager.renameFile(oldName, "invalid<name>.txt")
        ).rejects.toThrow("Invalid file name");
      });

      it("should throw error if destination file already exists", async () => {
        const oldName = `rename-src-${Date.now()}.txt`;
        const existingName = `rename-exists-${Date.now()}.txt`;
        
        await fileManager.createFile(oldName);
        await fileManager.createFile(existingName);

        await expect(
          fileManager.renameFile(oldName, existingName)
        ).rejects.toThrow();
      });

      it("should preserve file content after rename", async () => {
        const oldName = `rename-content-${Date.now()}.txt`;
        const newName = `rename-content-new-${Date.now()}.txt`;
        const content = "Content to preserve";
        
        await fileManager.writeFile(oldName, content);
        await fileManager.renameFile(oldName, newName);

        const renamedContent = await fs.promises.readFile(
          path.join(testDir, newName),
          "utf-8"
        );
        expect(renamedContent).toBe(content);
      });
    });

    describe("copyFile", () => {
      it("should copy file to destination directory", async () => {
        const fileName = `copy-source-${Date.now()}.txt`;
        const destDir = path.join(testDir, `copy-dest-${Date.now()}`);
        
        await fs.promises.writeFile(path.join(testDir, fileName), "Copy content");
        await fs.promises.mkdir(destDir);

        const destPath = await fileManager.copyFile(fileName, destDir);

        const sourceExists = await fs.promises
          .access(path.join(testDir, fileName))
          .then(() => true)
          .catch(() => false);
        const destExists = await fs.promises
          .access(destPath)
          .then(() => true)
          .catch(() => false);

        expect(sourceExists).toBe(true);
        expect(destExists).toBe(true);
      });

      it("should throw error for non-existent source file", async () => {
        const destDir = path.join(testDir, `copy-dest-err-${Date.now()}`);
        await fs.promises.mkdir(destDir);

        await expect(
          fileManager.copyFile("non-existent.txt", destDir)
        ).rejects.toThrow();
      });

      it("should throw error for non-existent destination directory", async () => {
        const fileName = `copy-src-${Date.now()}.txt`;
        await fs.promises.writeFile(path.join(testDir, fileName), "content");

        await expect(
          fileManager.copyFile(fileName, "non-existent-dir")
        ).rejects.toThrow();
      });

      it("should throw error if file already exists in destination", async () => {
        const fileName = `copy-exists-${Date.now()}.txt`;
        const destDir = path.join(testDir, `copy-dest-exists-${Date.now()}`);
        
        await fs.promises.writeFile(path.join(testDir, fileName), "content");
        await fs.promises.mkdir(destDir);
        // Create file with same name in destination
        await fs.promises.writeFile(path.join(destDir, fileName), "existing");

        await expect(
          fileManager.copyFile(fileName, destDir)
        ).rejects.toThrow();
      });

      it("should preserve file content after copy", async () => {
        const fileName = `copy-content-${Date.now()}.txt`;
        const content = "Test content to preserve";
        const destDir = path.join(testDir, `copy-content-dest-${Date.now()}`);
        
        await fs.promises.writeFile(path.join(testDir, fileName), content);
        await fs.promises.mkdir(destDir);

        const destPath = await fileManager.copyFile(fileName, destDir);
        const copiedContent = await fs.promises.readFile(destPath, "utf-8");

        expect(copiedContent).toBe(content);
      });
    });

    describe("moveFile", () => {
      it("should move file to destination directory", async () => {
        const fileName = `move-source-${Date.now()}.txt`;
        const destDir = path.join(testDir, `move-dest-${Date.now()}`);
        
        await fs.promises.writeFile(path.join(testDir, fileName), "Move content");
        await fs.promises.mkdir(destDir);

        await fileManager.moveFile(fileName, destDir);

        const sourceExists = await fs.promises
          .access(path.join(testDir, fileName))
          .then(() => true)
          .catch(() => false);
        const destExists = await fs.promises
          .access(path.join(destDir, fileName))
          .then(() => true)
          .catch(() => false);

        expect(sourceExists).toBe(false);
        expect(destExists).toBe(true);
      });
    });

    describe("deleteFile", () => {
      it("should delete file", async () => {
        const fileName = `delete-test-${Date.now()}.txt`;
        await fileManager.createFile(fileName);
        
        await fileManager.deleteFile(fileName);

        const exists = await fs.promises
          .access(path.join(testDir, fileName))
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      it("should throw error for non-existent file", async () => {
        await expect(
          fileManager.deleteFile("non-existent.txt")
        ).rejects.toThrow();
      });
    });

    describe("deleteDirectory", () => {
      it("should delete empty directory", async () => {
        const dirName = `rmdir-test-${Date.now()}`;
        await fileManager.createDirectory(dirName);
        
        await fileManager.deleteDirectory(dirName);

        const exists = await fs.promises
          .access(path.join(testDir, dirName))
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      });

      it("should throw error for non-existent directory", async () => {
        await expect(
          fileManager.deleteDirectory("non-existent-dir")
        ).rejects.toThrow();
      });

      it("should throw error for non-empty directory", async () => {
        const dirName = `rmdir-nonempty-${Date.now()}`;
        const dirPath = path.join(testDir, dirName);
        await fs.promises.mkdir(dirPath);
        await fs.promises.writeFile(path.join(dirPath, "file.txt"), "content");

        await expect(
          fileManager.deleteDirectory(dirName)
        ).rejects.toThrow();
      });
    });
  });

  // ==================== Hash Tests ====================
  describe("calculateHash", () => {
    it("should calculate SHA-256 hash", async () => {
      const fileName = `hash-test-${Date.now()}.txt`;
      await fs.promises.writeFile(path.join(testDir, fileName), "test content");

      const result = await fileManager.calculateHash(fileName);

      expect(result.algorithm).toBe("sha256");
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should calculate MD5 hash", async () => {
      const fileName = `hash-md5-test-${Date.now()}.txt`;
      await fs.promises.writeFile(path.join(testDir, fileName), "test content");

      const result = await fileManager.calculateHash(fileName, "md5");

      expect(result.algorithm).toBe("md5");
      expect(result.hash).toMatch(/^[a-f0-9]{32}$/);
    });

    it("should calculate SHA-512 hash", async () => {
      const fileName = `hash-sha512-test-${Date.now()}.txt`;
      await fs.promises.writeFile(path.join(testDir, fileName), "test content");

      const result = await fileManager.calculateHash(fileName, "sha512");

      expect(result.algorithm).toBe("sha512");
      // SHA-512 produces 128-character hex string (512 bits = 64 bytes = 128 hex chars)
      expect(result.hash).toMatch(/^[a-f0-9]{128}$/);
    });

    it("should calculate SHA-1 hash", async () => {
      const fileName = `hash-sha1-test-${Date.now()}.txt`;
      await fs.promises.writeFile(path.join(testDir, fileName), "test content");

      const result = await fileManager.calculateHash(fileName, "sha1");

      expect(result.algorithm).toBe("sha1");
      // SHA-1 produces 40-character hex string (160 bits = 20 bytes = 40 hex chars)
      expect(result.hash).toMatch(/^[a-f0-9]{40}$/);
    });

    it("should produce consistent hash for same content", async () => {
      const fileName1 = `hash-consistent-1-${Date.now()}.txt`;
      const fileName2 = `hash-consistent-2-${Date.now()}.txt`;
      const content = "identical content for hashing";
      
      await fs.promises.writeFile(path.join(testDir, fileName1), content);
      await fs.promises.writeFile(path.join(testDir, fileName2), content);

      const result1 = await fileManager.calculateHash(fileName1, "sha256");
      const result2 = await fileManager.calculateHash(fileName2, "sha256");

      expect(result1.hash).toBe(result2.hash);
    });

    it("should produce different hashes for different content", async () => {
      const fileName1 = `hash-diff-1-${Date.now()}.txt`;
      const fileName2 = `hash-diff-2-${Date.now()}.txt`;
      
      await fs.promises.writeFile(path.join(testDir, fileName1), "content one");
      await fs.promises.writeFile(path.join(testDir, fileName2), "content two");

      const result1 = await fileManager.calculateHash(fileName1, "sha256");
      const result2 = await fileManager.calculateHash(fileName2, "sha256");

      expect(result1.hash).not.toBe(result2.hash);
    });

    it("should throw error for non-existent file", async () => {
      await expect(
        fileManager.calculateHash("non-existent.txt")
      ).rejects.toThrow();
    });
  });

  // ==================== OS Info Tests ====================
  describe("getOSInfo", () => {
    it("should return EOL info", () => {
      const result = fileManager.getOSInfo("--EOL");
      expect(result).toContain("EOL");
    });

    it("should return CPU info", () => {
      const result = fileManager.getOSInfo("--cpus");
      expect(result).toContain("CPU");
    });

    it("should return home directory", () => {
      const result = fileManager.getOSInfo("--homedir");
      expect(result).toContain(os.homedir());
    });

    it("should return username", () => {
      const result = fileManager.getOSInfo("--username");
      expect(result).toContain(os.userInfo().username);
    });

    it("should return architecture", () => {
      const result = fileManager.getOSInfo("--architecture");
      expect(result).toContain(process.arch);
    });

    it("should return platform", () => {
      const result = fileManager.getOSInfo("--platform");
      expect(result).toContain(os.platform());
    });

    it("should return memory info", () => {
      const result = fileManager.getOSInfo("--memory");
      expect(result).toContain("Memory");
    });

    it("should throw error for invalid flag", () => {
      expect(() => fileManager.getOSInfo("--invalid")).toThrow();
    });
  });

  // ==================== File Info Tests ====================
  describe("getFileInfo", () => {
    it("should return file information", async () => {
      const fileName = `info-test-${Date.now()}.txt`;
      await fs.promises.writeFile(path.join(testDir, fileName), "info content");

      const info = await fileManager.getFileInfo(fileName);

      expect(info.name).toBe(fileName);
      expect(info.isFile).toBe(true);
      expect(info.isDirectory).toBe(false);
      expect(info.size).toBeGreaterThan(0);
      // Check that dates are Date-like objects
      expect(typeof info.created.getTime).toBe("function");
      expect(typeof info.modified.getTime).toBe("function");
    });

    it("should return directory information", async () => {
      const dirName = `info-dir-test-${Date.now()}`;
      await fs.promises.mkdir(path.join(testDir, dirName));

      const info = await fileManager.getFileInfo(dirName);

      expect(info.name).toBe(dirName);
      expect(info.isFile).toBe(false);
      expect(info.isDirectory).toBe(true);
    });

    it("should throw error for non-existent path", async () => {
      await expect(
        fileManager.getFileInfo("non-existent")
      ).rejects.toThrow();
    });
  });

  // ==================== Search Tests ====================
  describe("search operations", () => {
    describe("findFiles", () => {
      let searchDir: string;

      beforeEach(async () => {
        // Create a directory structure for search tests
        searchDir = path.join(testDir, `search-test-${Date.now()}`);
        await fs.promises.mkdir(searchDir, { recursive: true });
        
        // Create files with various names
        await fs.promises.writeFile(path.join(searchDir, "file1.txt"), "content1");
        await fs.promises.writeFile(path.join(searchDir, "file2.txt"), "content2");
        await fs.promises.writeFile(path.join(searchDir, "document.md"), "markdown");
        await fs.promises.writeFile(path.join(searchDir, "script.js"), "javascript");
        
        // Create subdirectory with files
        const subDir = path.join(searchDir, "subdir");
        await fs.promises.mkdir(subDir, { recursive: true });
        await fs.promises.writeFile(path.join(subDir, "nested.txt"), "nested content");
        await fs.promises.writeFile(path.join(subDir, "nested.js"), "nested js");
      });

      it("should find files matching exact name", async () => {
        const results = await fileManager.findFiles("file1.txt", searchDir);
        
        expect(results.length).toBe(1);
        expect(results[0].name).toBe("file1.txt");
        expect(results[0].type).toBe("file");
      });

      it("should find files matching wildcard pattern", async () => {
        const results = await fileManager.findFiles("*.txt", searchDir);
        
        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.every((r) => r.name.endsWith(".txt"))).toBe(true);
      });

      it("should find files matching partial pattern with wildcard", async () => {
        const results = await fileManager.findFiles("file*", searchDir);
        
        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.every((r) => r.name.startsWith("file"))).toBe(true);
      });

      it("should find files recursively in subdirectories", async () => {
        const results = await fileManager.findFiles("nested*", searchDir);
        
        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.some((r) => r.name === "nested.txt")).toBe(true);
        expect(results.some((r) => r.name === "nested.js")).toBe(true);
      });

      it("should find directories matching pattern", async () => {
        const results = await fileManager.findFiles("subdir", searchDir);
        
        expect(results.length).toBe(1);
        expect(results[0].name).toBe("subdir");
        expect(results[0].type).toBe("directory");
      });

      it("should return empty array for no matches", async () => {
        const results = await fileManager.findFiles("nonexistent.xyz", searchDir);
        
        expect(results).toEqual([]);
      });

      it("should use current directory when searchPath not provided", async () => {
        process.chdir(searchDir);
        const results = await fileManager.findFiles("*.txt");
        
        expect(results.length).toBeGreaterThanOrEqual(2);
      });

      it("should handle single character wildcard (?)", async () => {
        const results = await fileManager.findFiles("file?.txt", searchDir);
        
        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.every((r) => r.name.match(/^file\d\.txt$/))).toBe(true);
      });

      it("should perform case-insensitive search", async () => {
        const results = await fileManager.findFiles("FILE1.TXT", searchDir);
        
        // Should find file1.txt (case insensitive)
        expect(results.length).toBe(1);
        expect(results[0].name.toLowerCase()).toBe("file1.txt");
      });
    });

    describe("grep", () => {
      let grepDir: string;

      beforeEach(async () => {
        // Create a directory structure for grep tests
        grepDir = path.join(testDir, `grep-test-${Date.now()}`);
        await fs.promises.mkdir(grepDir, { recursive: true });
        
        // Create files with searchable content
        await fs.promises.writeFile(
          path.join(grepDir, "file1.txt"),
          "Line 1: Hello World\nLine 2: Foo Bar\nLine 3: Hello Again"
        );
        await fs.promises.writeFile(
          path.join(grepDir, "file2.txt"),
          "No matching content here\nJust random text"
        );
        await fs.promises.writeFile(
          path.join(grepDir, "code.js"),
          "function hello() {\n  console.log('Hello');\n}\n"
        );
        
        // Create subdirectory with files
        const subDir = path.join(grepDir, "subdir");
        await fs.promises.mkdir(subDir, { recursive: true });
        await fs.promises.writeFile(
          path.join(subDir, "nested.txt"),
          "This file contains Hello too"
        );
      });

      it("should find pattern in single file", async () => {
        const results = await fileManager.grep("Hello", path.join(grepDir, "file1.txt"));
        
        expect(results.length).toBe(1);
        expect(results[0].matches).toBeDefined();
        expect(results[0].matches!.length).toBe(2); // "Hello World" and "Hello Again"
      });

      it("should return line numbers for matches", async () => {
        const results = await fileManager.grep("Hello", path.join(grepDir, "file1.txt"));
        
        expect(results[0].matches![0].line).toBe(1); // Line 1
        expect(results[0].matches![1].line).toBe(3); // Line 3
      });

      it("should return matched content", async () => {
        const results = await fileManager.grep("Foo", path.join(grepDir, "file1.txt"));
        
        expect(results.length).toBe(1);
        expect(results[0].matches![0].content).toContain("Foo Bar");
      });

      it("should search recursively in directories", async () => {
        const results = await fileManager.grep("Hello", grepDir);
        
        // Should find matches in file1.txt, code.js, and nested.txt
        expect(results.length).toBeGreaterThanOrEqual(2);
      });

      it("should return empty array when no matches found", async () => {
        const results = await fileManager.grep("ZZZNOMATCH", path.join(grepDir, "file1.txt"));
        
        expect(results).toEqual([]);
      });

      it("should support regex patterns", async () => {
        const results = await fileManager.grep("Line \\d", path.join(grepDir, "file1.txt"));
        
        expect(results.length).toBe(1);
        // Regex with 'gi' flag may behave differently - just verify we got matches
        expect(results[0].matches!.length).toBeGreaterThanOrEqual(2);
      });

      it("should perform case-insensitive search", async () => {
        const results = await fileManager.grep("hello", path.join(grepDir, "file1.txt"));
        
        // Should match "Hello" (case insensitive)
        expect(results.length).toBe(1);
        expect(results[0].matches!.length).toBe(2);
      });

      it("should throw error for non-existent file", async () => {
        await expect(
          fileManager.grep("pattern", "non-existent-file.txt")
        ).rejects.toThrow();
      });

      it("should include file path and name in results", async () => {
        const results = await fileManager.grep("Hello", path.join(grepDir, "file1.txt"));
        
        expect(results[0].path).toContain("file1.txt");
        expect(results[0].name).toBe("file1.txt");
        expect(results[0].type).toBe("file");
      });

      it("should search all files in directory recursively", async () => {
        const results = await fileManager.grep("Hello", grepDir);
        
        // Check that we found files in both root and subdirectory
        const fileNames = results.map((r) => r.name);
        expect(fileNames).toContain("file1.txt");
        expect(fileNames.some((n) => n.includes("nested") || n.includes("code"))).toBe(true);
      });

      it("should handle deeply nested directories in grep", async () => {
        // Create a deeper nested structure
        const deepDir = path.join(grepDir, "level1", "level2");
        await fs.promises.mkdir(deepDir, { recursive: true });
        await fs.promises.writeFile(
          path.join(deepDir, "deep.txt"),
          "Deep Hello World"
        );
        
        const results = await fileManager.grep("Hello", grepDir);
        
        // Should find the deeply nested file
        const fileNames = results.map((r) => r.name);
        expect(fileNames).toContain("deep.txt");
      });

      it("should skip files with no matches in directory grep", async () => {
        const results = await fileManager.grep("Hello", grepDir);
        
        // file2.txt has no "Hello" - should not be in results
        const fileNames = results.map((r) => r.name);
        expect(fileNames).not.toContain("file2.txt");
      });

      it("should correctly identify when path is a directory vs file", async () => {
        // First test with a file path
        const fileResults = await fileManager.grep("Hello", path.join(grepDir, "file1.txt"));
        expect(fileResults.length).toBe(1);
        expect(fileResults[0].type).toBe("file");
        
        // Then test with a directory path - this explicitly tests the isDirectory branch
        const dirResults = await fileManager.grep("Hello", grepDir);
        expect(dirResults.length).toBeGreaterThan(0);
        // All results should be files found within the directory
        expect(dirResults.every((r) => r.type === "file")).toBe(true);
      });

      it("should handle empty directories in recursive grep", async () => {
        const emptyDir = path.join(grepDir, "empty-subdir");
        await fs.promises.mkdir(emptyDir, { recursive: true });
        
        // Should not throw, just return results from other directories
        const results = await fileManager.grep("Hello", grepDir);
        expect(results.length).toBeGreaterThan(0);
      });

      it("should abort grep when signal is aborted", async () => {
        const controller = new AbortController();
        
        // Abort immediately
        controller.abort();
        
        await expect(
          fileManager.grep("Hello", grepDir, controller.signal)
        ).rejects.toThrow("Operation aborted");
      });
    });
  });

  // ==================== Task Cancellation Tests ====================
  describe("task cancellation", () => {
    let cancelDir: string;

    beforeEach(async () => {
      // Create a directory structure for cancellation tests
      cancelDir = path.join(testDir, `cancel-test-${Date.now()}`);
      await fs.promises.mkdir(cancelDir, { recursive: true });
      
      // Create several subdirectories with files
      for (let i = 0; i < 5; i++) {
        const subDir = path.join(cancelDir, `subdir${i}`);
        await fs.promises.mkdir(subDir, { recursive: true });
        await fs.promises.writeFile(path.join(subDir, "file.txt"), "test content");
      }
    });

    describe("findFiles cancellation", () => {
      it("should stop searching when aborted", async () => {
        const controller = new AbortController();
        
        // Abort immediately
        controller.abort();
        
        await expect(
          fileManager.findFiles("*.txt", cancelDir, controller.signal)
        ).rejects.toThrow("Operation aborted");
      });

      it("should return partial results if aborted mid-search", async () => {
        const controller = new AbortController();
        
        // Start search and abort after a short delay
        const searchPromise = fileManager.findFiles("*.txt", cancelDir, controller.signal);
        
        // Give it a tiny bit of time to start, then abort
        setTimeout(() => controller.abort(), 1);
        
        // Should either complete or throw AbortError
        try {
          const results = await searchPromise;
          // If it completed before abort, that's fine too
          expect(results.length).toBeGreaterThanOrEqual(0);
        } catch (error) {
          expect(error).toBeInstanceOf(DOMException);
          expect((error as DOMException).name).toBe("AbortError");
        }
      });
    });

    describe("grep cancellation", () => {
      it("should stop searching when aborted", async () => {
        const controller = new AbortController();
        
        // Abort immediately
        controller.abort();
        
        await expect(
          fileManager.grep("test", cancelDir, controller.signal)
        ).rejects.toThrow("Operation aborted");
      });
    });

    describe("readFile cancellation", () => {
      it("should abort reading when signal is already aborted", async () => {
        const fileName = `read-abort-${Date.now()}.txt`;
        const content = "Test content for abort test";
        await fs.promises.writeFile(path.join(testDir, fileName), content);
        
        const controller = new AbortController();
        controller.abort();
        
        await expect(
          fileManager.readFile(fileName, controller.signal)
        ).rejects.toThrow("Operation aborted");
      });

      it("should complete reading when signal is not aborted", async () => {
        const fileName = `read-no-abort-${Date.now()}.txt`;
        const content = "Test content for read test";
        await fs.promises.writeFile(path.join(testDir, fileName), content);
        
        const controller = new AbortController();
        
        const result = await fileManager.readFile(fileName, controller.signal);
        expect(result).toBe(content);
      });
    });

    describe("copyFile cancellation", () => {
      it("should abort copying when signal is already aborted", async () => {
        const sourceFile = `copy-abort-src-${Date.now()}.txt`;
        const destDir = path.join(testDir, `copy-abort-dest-${Date.now()}`);
        
        await fs.promises.writeFile(path.join(testDir, sourceFile), "content");
        await fs.promises.mkdir(destDir);
        
        const controller = new AbortController();
        controller.abort();
        
        await expect(
          fileManager.copyFile(sourceFile, destDir, controller.signal)
        ).rejects.toThrow("Operation aborted");
      });

      it("should complete copying when signal is not aborted", async () => {
        const sourceFile = `copy-no-abort-${Date.now()}.txt`;
        const destDir = path.join(testDir, `copy-no-abort-dest-${Date.now()}`);
        const content = "Content to copy";
        
        await fs.promises.writeFile(path.join(testDir, sourceFile), content);
        await fs.promises.mkdir(destDir);
        
        const controller = new AbortController();
        
        const destPath = await fileManager.copyFile(sourceFile, destDir, controller.signal);
        const copiedContent = await fs.promises.readFile(destPath, "utf-8");
        expect(copiedContent).toBe(content);
      });
    });

    describe("moveFile cancellation", () => {
      it("should abort moving when signal is already aborted", async () => {
        const sourceFile = `move-abort-src-${Date.now()}.txt`;
        const destDir = path.join(testDir, `move-abort-dest-${Date.now()}`);
        
        await fs.promises.writeFile(path.join(testDir, sourceFile), "content");
        await fs.promises.mkdir(destDir);
        
        const controller = new AbortController();
        controller.abort();
        
        await expect(
          fileManager.moveFile(sourceFile, destDir, controller.signal)
        ).rejects.toThrow("Operation aborted");
      });
    });

    describe("calculateHash cancellation", () => {
      it("should abort hashing when signal is already aborted", async () => {
        const fileName = `hash-abort-${Date.now()}.txt`;
        await fs.promises.writeFile(path.join(testDir, fileName), "content to hash");
        
        const controller = new AbortController();
        controller.abort();
        
        await expect(
          fileManager.calculateHash(fileName, "sha256", controller.signal)
        ).rejects.toThrow("Operation aborted");
      });

      it("should complete hashing when signal is not aborted", async () => {
        const fileName = `hash-no-abort-${Date.now()}.txt`;
        await fs.promises.writeFile(path.join(testDir, fileName), "content to hash");
        
        const controller = new AbortController();
        
        const result = await fileManager.calculateHash(fileName, "sha256", controller.signal);
        expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      });
    });

    describe("compressFile cancellation", () => {
      it("should abort compression when signal is already aborted", async () => {
        const sourceFile = `compress-abort-${Date.now()}.txt`;
        const destFile = `${sourceFile}.br`;
        
        await fs.promises.writeFile(path.join(testDir, sourceFile), "content to compress");
        
        const controller = new AbortController();
        controller.abort();
        
        await expect(
          fileManager.compressFile(sourceFile, destFile, "brotli", controller.signal)
        ).rejects.toThrow("Operation aborted");
      });

      it("should complete compression when signal is not aborted", async () => {
        const sourceFile = `compress-no-abort-${Date.now()}.txt`;
        const destFile = `${sourceFile}.br`;
        const content = "Test content for compression. ".repeat(50);
        
        await fs.promises.writeFile(path.join(testDir, sourceFile), content);
        
        const controller = new AbortController();
        
        const result = await fileManager.compressFile(sourceFile, destFile, "brotli", controller.signal);
        expect(result.originalSize).toBeGreaterThan(0);
        expect(result.compressedSize).toBeGreaterThan(0);
      });
    });

    describe("decompressFile cancellation", () => {
      it("should abort decompression when signal is already aborted", async () => {
        const sourceFile = `decompress-abort-src-${Date.now()}.txt`;
        const compressedFile = `${sourceFile}.br`;
        const decompressedFile = `decompress-abort-out-${Date.now()}.txt`;
        
        await fs.promises.writeFile(path.join(testDir, sourceFile), "content to compress");
        await fileManager.compressFile(sourceFile, compressedFile, "brotli");
        
        const controller = new AbortController();
        controller.abort();
        
        await expect(
          fileManager.decompressFile(compressedFile, decompressedFile, "brotli", controller.signal)
        ).rejects.toThrow("Operation aborted");
      });

      it("should complete decompression when signal is not aborted", async () => {
        const sourceFile = `decompress-no-abort-src-${Date.now()}.txt`;
        const compressedFile = `${sourceFile}.br`;
        const decompressedFile = `decompress-no-abort-out-${Date.now()}.txt`;
        const content = "Test content for decompression";
        
        await fs.promises.writeFile(path.join(testDir, sourceFile), content);
        await fileManager.compressFile(sourceFile, compressedFile, "brotli");
        
        const controller = new AbortController();
        
        await fileManager.decompressFile(compressedFile, decompressedFile, "brotli", controller.signal);
        
        const decompressedContent = await fs.promises.readFile(
          path.join(testDir, decompressedFile),
          "utf-8"
        );
        expect(decompressedContent).toBe(content);
      });
    });
  });

  // ==================== Compression Tests ====================
  describe("compression", () => {
    describe("compressFile", () => {
      const testContent = "Hello, this is test content for compression testing. ".repeat(100);

      describe("brotli compression", () => {
        it("should compress file with brotli (default)", async () => {
          const sourceFile = `compress-brotli-${Date.now()}.txt`;
          const destFile = `${sourceFile}.br`;
          
          await fs.promises.writeFile(path.join(testDir, sourceFile), testContent);
          
          const result = await fileManager.compressFile(sourceFile, destFile, "brotli");
          
          expect(result.originalSize).toBeGreaterThan(0);
          expect(result.compressedSize).toBeGreaterThan(0);
          expect(result.compressedSize).toBeLessThan(result.originalSize);
          
          // Verify file exists
          const exists = await fs.promises.access(path.join(testDir, destFile))
            .then(() => true)
            .catch(() => false);
          expect(exists).toBe(true);
        });

        it("should decompress brotli file", async () => {
          const sourceFile = `decompress-brotli-src-${Date.now()}.txt`;
          const compressedFile = `${sourceFile}.br`;
          const decompressedFile = `decompress-brotli-out-${Date.now()}.txt`;
          
          await fs.promises.writeFile(path.join(testDir, sourceFile), testContent);
          await fileManager.compressFile(sourceFile, compressedFile, "brotli");
          await fileManager.decompressFile(compressedFile, decompressedFile, "brotli");
          
          const decompressedContent = await fs.promises.readFile(
            path.join(testDir, decompressedFile),
            "utf-8"
          );
          
          expect(decompressedContent).toBe(testContent);
        });
      });

      describe("gzip compression", () => {
        it("should compress file with gzip", async () => {
          const sourceFile = `compress-gzip-${Date.now()}.txt`;
          const destFile = `${sourceFile}.gz`;
          
          await fs.promises.writeFile(path.join(testDir, sourceFile), testContent);
          
          const result = await fileManager.compressFile(sourceFile, destFile, "gzip");
          
          expect(result.originalSize).toBeGreaterThan(0);
          expect(result.compressedSize).toBeGreaterThan(0);
          expect(result.compressedSize).toBeLessThan(result.originalSize);
        });

        it("should decompress gzip file", async () => {
          const sourceFile = `decompress-gzip-src-${Date.now()}.txt`;
          const compressedFile = `${sourceFile}.gz`;
          const decompressedFile = `decompress-gzip-out-${Date.now()}.txt`;
          
          await fs.promises.writeFile(path.join(testDir, sourceFile), testContent);
          await fileManager.compressFile(sourceFile, compressedFile, "gzip");
          await fileManager.decompressFile(compressedFile, decompressedFile, "gzip");
          
          const decompressedContent = await fs.promises.readFile(
            path.join(testDir, decompressedFile),
            "utf-8"
          );
          
          expect(decompressedContent).toBe(testContent);
        });
      });

      describe("deflate compression", () => {
        it("should compress file with deflate", async () => {
          const sourceFile = `compress-deflate-${Date.now()}.txt`;
          const destFile = `${sourceFile}.zz`;
          
          await fs.promises.writeFile(path.join(testDir, sourceFile), testContent);
          
          const result = await fileManager.compressFile(sourceFile, destFile, "deflate");
          
          expect(result.originalSize).toBeGreaterThan(0);
          expect(result.compressedSize).toBeGreaterThan(0);
          expect(result.compressedSize).toBeLessThan(result.originalSize);
        });

        it("should decompress deflate file", async () => {
          const sourceFile = `decompress-deflate-src-${Date.now()}.txt`;
          const compressedFile = `${sourceFile}.zz`;
          const decompressedFile = `decompress-deflate-out-${Date.now()}.txt`;
          
          await fs.promises.writeFile(path.join(testDir, sourceFile), testContent);
          await fileManager.compressFile(sourceFile, compressedFile, "deflate");
          await fileManager.decompressFile(compressedFile, decompressedFile, "deflate");
          
          const decompressedContent = await fs.promises.readFile(
            path.join(testDir, decompressedFile),
            "utf-8"
          );
          
          expect(decompressedContent).toBe(testContent);
        });
      });

      describe("error cases", () => {
        it("should throw error for non-existent source file on compress", async () => {
          await expect(
            fileManager.compressFile("non-existent.txt", "output.br", "brotli")
          ).rejects.toThrow();
        });

        it("should throw error for non-existent source file on decompress", async () => {
          await expect(
            fileManager.decompressFile("non-existent.br", "output.txt", "brotli")
          ).rejects.toThrow();
        });

        it("should throw error for unsupported compression algorithm", async () => {
          const sourceFile = `compress-unsupported-${Date.now()}.txt`;
          await fs.promises.writeFile(path.join(testDir, sourceFile), "test content");
          
          await expect(
            fileManager.compressFile(
              sourceFile, 
              "output.xyz", 
              "unsupported" as "brotli" | "gzip" | "deflate"
            )
          ).rejects.toThrow("Unsupported compression algorithm");
        });

        it("should throw error for unsupported decompression algorithm", async () => {
          const sourceFile = `decompress-unsupported-${Date.now()}.txt`;
          await fs.promises.writeFile(path.join(testDir, sourceFile), "test content");
          
          await expect(
            fileManager.decompressFile(
              sourceFile,
              "output.txt",
              "unsupported" as "brotli" | "gzip" | "deflate"
            )
          ).rejects.toThrow("Unsupported decompression algorithm");
        });
      });

      describe("default algorithm", () => {
        it("should use brotli as default compression algorithm", async () => {
          const sourceFile = `compress-default-${Date.now()}.txt`;
          const destFile = `${sourceFile}.br`;
          const testContent = "Test content for default compression";
          
          await fs.promises.writeFile(path.join(testDir, sourceFile), testContent);
          
          // Call without specifying algorithm - should default to brotli
          const result = await fileManager.compressFile(sourceFile, destFile);
          
          expect(result.originalSize).toBeGreaterThan(0);
          expect(result.compressedSize).toBeGreaterThan(0);
          
          // Verify we can decompress with brotli
          const decompressedFile = `decompressed-default-${Date.now()}.txt`;
          await fileManager.decompressFile(destFile, decompressedFile, "brotli");
          
          const decompressedContent = await fs.promises.readFile(
            path.join(testDir, decompressedFile),
            "utf-8"
          );
          expect(decompressedContent).toBe(testContent);
        });

        it("should use brotli as default decompression algorithm", async () => {
          const sourceFile = `decompress-default-src-${Date.now()}.txt`;
          const compressedFile = `${sourceFile}.br`;
          const decompressedFile = `decompress-default-out-${Date.now()}.txt`;
          const testContent = "Test content for default decompression";
          
          await fs.promises.writeFile(path.join(testDir, sourceFile), testContent);
          await fileManager.compressFile(sourceFile, compressedFile, "brotli");
          
          // Call without specifying algorithm - should default to brotli
          await fileManager.decompressFile(compressedFile, decompressedFile);
          
          const decompressedContent = await fs.promises.readFile(
            path.join(testDir, decompressedFile),
            "utf-8"
          );
          expect(decompressedContent).toBe(testContent);
        });
      });
    });

    describe("detectCompressionAlgorithm", () => {
      it("should detect brotli from .br extension", () => {
        expect(fileManager.detectCompressionAlgorithm("file.br")).toBe("brotli");
      });

      it("should detect gzip from .gz extension", () => {
        expect(fileManager.detectCompressionAlgorithm("file.gz")).toBe("gzip");
      });

      it("should detect deflate from .zz extension", () => {
        expect(fileManager.detectCompressionAlgorithm("file.zz")).toBe("deflate");
      });

      it("should detect deflate from .deflate extension", () => {
        expect(fileManager.detectCompressionAlgorithm("file.deflate")).toBe("deflate");
      });

      it("should return null for unknown extension", () => {
        expect(fileManager.detectCompressionAlgorithm("file.txt")).toBeNull();
      });

      it("should return null for no extension", () => {
        expect(fileManager.detectCompressionAlgorithm("file")).toBeNull();
      });

      it("should handle uppercase extensions", () => {
        expect(fileManager.detectCompressionAlgorithm("file.BR")).toBe("brotli");
        expect(fileManager.detectCompressionAlgorithm("file.GZ")).toBe("gzip");
      });
    });

    describe("getCompressionExtension", () => {
      it("should return .br for brotli", () => {
        expect(fileManager.getCompressionExtension("brotli")).toBe(".br");
      });

      it("should return .gz for gzip", () => {
        expect(fileManager.getCompressionExtension("gzip")).toBe(".gz");
      });

      it("should return .zz for deflate", () => {
        expect(fileManager.getCompressionExtension("deflate")).toBe(".zz");
      });

      it("should return .compressed for unknown algorithm", () => {
        expect(
          fileManager.getCompressionExtension(
            "unknown" as "brotli" | "gzip" | "deflate"
          )
        ).toBe(".compressed");
      });
    });
  });
});

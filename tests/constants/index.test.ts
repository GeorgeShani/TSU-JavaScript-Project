/**
 * Constants and Messages Tests
 * Tests for styled messages and constants
 */

import {
  APP_NAME,
  APP_VERSION,
  styles,
  MESSAGES,
  PROMPT_CHAR,
  currentDirPrefix,
  TABLE_COLUMNS,
  HASH_ALGORITHMS,
  DEFAULT_HASH_ALGORITHM,
  COMPRESSION_ALGORITHMS,
  DEFAULT_COMPRESSION_ALGORITHM,
  COMPRESSION,
} from "../../src/constants/index";

describe("Constants", () => {
  describe("App Info", () => {
    it("should have app name defined", () => {
      expect(APP_NAME).toBe("File Manager CLI");
    });

    it("should have app version defined", () => {
      expect(APP_VERSION).toBe("1.0.0");
    });

    it("should have prompt character defined", () => {
      expect(PROMPT_CHAR).toBeDefined();
      expect(typeof PROMPT_CHAR).toBe("string");
    });
  });

  describe("Styles", () => {
    it("should have text styles defined", () => {
      expect(styles.success).toBeDefined();
      expect(styles.error).toBeDefined();
      expect(styles.warning).toBeDefined();
      expect(styles.info).toBeDefined();
      expect(styles.highlight).toBeDefined();
      expect(styles.dim).toBeDefined();
      expect(styles.bold).toBeDefined();
    });

    it("should have element styles defined", () => {
      expect(styles.path).toBeDefined();
      expect(styles.filename).toBeDefined();
      expect(styles.directory).toBeDefined();
      expect(styles.command).toBeDefined();
      expect(styles.argument).toBeDefined();
      expect(styles.flag).toBeDefined();
    });

    it("should have status styles defined", () => {
      expect(styles.statusSuccess).toBeDefined();
      expect(styles.statusError).toBeDefined();
      expect(styles.statusWarning).toBeDefined();
      expect(styles.statusInfo).toBeDefined();
    });

    it("should have header and table styles defined", () => {
      expect(styles.header).toBeDefined();
      expect(styles.subheader).toBeDefined();
      expect(styles.tableHeader).toBeDefined();
      expect(styles.fileType).toBeDefined();
      expect(styles.dirType).toBeDefined();
      expect(styles.size).toBeDefined();
      expect(styles.date).toBeDefined();
    });

    it("should return styled strings", () => {
      expect(typeof styles.success("test")).toBe("string");
      expect(typeof styles.error("test")).toBe("string");
      expect(typeof styles.path("test")).toBe("string");
    });
  });

  describe("Messages", () => {
    describe("welcome and farewell", () => {
      it("should generate welcome message with username", () => {
        const message = MESSAGES.welcome("John");
        expect(message).toContain("John");
        expect(typeof message).toBe("string");
      });

      it("should generate farewell message with username", () => {
        const message = MESSAGES.farewell("John");
        expect(message).toContain("John");
        expect(message).toContain(APP_NAME);
        expect(typeof message).toBe("string");
      });
    });

    describe("error messages", () => {
      it("should have static error messages", () => {
        expect(MESSAGES.errors.emptyCommand).toBeDefined();
        expect(MESSAGES.errors.invalidCommand).toBeDefined();
        expect(MESSAGES.errors.permissionDenied).toBeDefined();
        expect(MESSAGES.errors.invalidPath).toBeDefined();
        expect(MESSAGES.errors.cannotNavigateAboveHome).toBeDefined();
      });

      it("should generate missingArgument message", () => {
        const message = MESSAGES.errors.missingArgument("filename");
        expect(message).toContain("filename");
      });

      it("should generate fileNotFound message", () => {
        const message = MESSAGES.errors.fileNotFound("/path/to/file");
        expect(message).toContain("/path/to/file");
      });

      it("should generate directoryNotFound message", () => {
        const message = MESSAGES.errors.directoryNotFound("/path/to/dir");
        expect(message).toContain("/path/to/dir");
      });

      it("should generate fileExists message", () => {
        const message = MESSAGES.errors.fileExists("existing.txt");
        expect(message).toContain("existing.txt");
      });

      it("should generate directoryExists message", () => {
        const message = MESSAGES.errors.directoryExists("existingDir");
        expect(message).toContain("existingDir");
      });

      it("should generate notAFile message", () => {
        const message = MESSAGES.errors.notAFile("/path/to/dir");
        expect(message).toContain("/path/to/dir");
      });

      it("should generate notADirectory message", () => {
        const message = MESSAGES.errors.notADirectory("/path/to/file");
        expect(message).toContain("/path/to/file");
      });

      it("should generate operationFailed message", () => {
        const message = MESSAGES.errors.operationFailed("copy");
        expect(message).toContain("copy");
      });
    });

    describe("success messages", () => {
      it("should generate fileCreated message", () => {
        const message = MESSAGES.success.fileCreated("/path/to/new.txt");
        expect(message).toContain("/path/to/new.txt");
      });

      it("should generate directoryCreated message", () => {
        const message = MESSAGES.success.directoryCreated("/path/to/newdir");
        expect(message).toContain("/path/to/newdir");
      });

      it("should generate fileDeleted message", () => {
        const message = MESSAGES.success.fileDeleted("/path/to/deleted.txt");
        expect(message).toContain("/path/to/deleted.txt");
      });

      it("should generate directoryDeleted message", () => {
        const message = MESSAGES.success.directoryDeleted("/path/to/deleteddir");
        expect(message).toContain("/path/to/deleteddir");
      });

      it("should generate fileRenamed message", () => {
        const message = MESSAGES.success.fileRenamed("old.txt", "new.txt");
        expect(message).toContain("old.txt");
        expect(message).toContain("new.txt");
      });

      it("should generate fileCopied message", () => {
        const message = MESSAGES.success.fileCopied("/src", "/dest");
        expect(message).toContain("/src");
        expect(message).toContain("/dest");
      });

      it("should generate fileMoved message", () => {
        const message = MESSAGES.success.fileMoved("/src", "/dest");
        expect(message).toContain("/src");
        expect(message).toContain("/dest");
      });

      it("should generate compressed message", () => {
        const message = MESSAGES.success.compressed("file.txt", "file.txt.br");
        expect(message).toContain("file.txt");
        expect(message).toContain("file.txt.br");
      });

      it("should generate decompressed message", () => {
        const message = MESSAGES.success.decompressed("file.txt.br", "file.txt");
        expect(message).toContain("file.txt.br");
        expect(message).toContain("file.txt");
      });
    });

    describe("prompts", () => {
      it("should generate confirmDelete prompt", () => {
        const prompt = MESSAGES.prompts.confirmDelete("/path/to/file");
        expect(prompt).toContain("/path/to/file");
      });

      it("should generate confirmOverwrite prompt", () => {
        const prompt = MESSAGES.prompts.confirmOverwrite("/path/to/file");
        expect(prompt).toContain("/path/to/file");
      });

      it("should generate confirmMove prompt", () => {
        const prompt = MESSAGES.prompts.confirmMove("/src", "/dest");
        expect(prompt).toContain("/src");
        expect(prompt).toContain("/dest");
      });
    });

    describe("info messages", () => {
      it("should have static info messages", () => {
        expect(MESSAGES.info.processing).toBeDefined();
        expect(MESSAGES.info.noMatches).toBeDefined();
        expect(MESSAGES.info.emptyDirectory).toBeDefined();
        expect(MESSAGES.info.operationCancelled).toBeDefined();
      });

      it("should generate searching message", () => {
        const message = MESSAGES.info.searching("*.txt");
        expect(message).toContain("*.txt");
      });

      it("should generate compressing message", () => {
        const message = MESSAGES.info.compressing("/path/to/file");
        expect(message).toContain("/path/to/file");
      });

      it("should generate decompressing message", () => {
        const message = MESSAGES.info.decompressing("/path/to/file");
        expect(message).toContain("/path/to/file");
      });
    });
  });

  describe("currentDirPrefix", () => {
    it("should return a string", () => {
      const prefix = currentDirPrefix();
      expect(typeof prefix).toBe("string");
    });

    it("should contain newline character", () => {
      const prefix = currentDirPrefix();
      expect(prefix).toContain("\n");
    });
  });

  describe("Table Columns", () => {
    it("should have column widths defined", () => {
      expect(TABLE_COLUMNS.name).toBe(30);
      expect(TABLE_COLUMNS.type).toBe(12);
      expect(TABLE_COLUMNS.size).toBe(15);
      expect(TABLE_COLUMNS.modified).toBe(25);
    });
  });

  describe("Hash Algorithms", () => {
    it("should have supported algorithms", () => {
      expect(HASH_ALGORITHMS).toContain("sha256");
      expect(HASH_ALGORITHMS).toContain("sha512");
      expect(HASH_ALGORITHMS).toContain("md5");
      expect(HASH_ALGORITHMS).toContain("sha1");
    });

    it("should have default algorithm as sha256", () => {
      expect(DEFAULT_HASH_ALGORITHM).toBe("sha256");
    });
  });

  describe("Compression", () => {
    it("should have supported compression algorithms", () => {
      expect(COMPRESSION_ALGORITHMS).toContain("brotli");
      expect(COMPRESSION_ALGORITHMS).toContain("gzip");
      expect(COMPRESSION_ALGORITHMS).toContain("deflate");
    });

    it("should have brotli as default compression", () => {
      expect(DEFAULT_COMPRESSION_ALGORITHM).toBe("brotli");
    });

    it("should have brotli settings", () => {
      expect(COMPRESSION.brotli.extension).toBe(".br");
      expect(COMPRESSION.brotli.defaultLevel).toBe(6);
      expect(COMPRESSION.brotli.description).toBeDefined();
    });

    it("should have gzip settings", () => {
      expect(COMPRESSION.gzip.extension).toBe(".gz");
      expect(COMPRESSION.gzip.defaultLevel).toBe(6);
      expect(COMPRESSION.gzip.description).toBeDefined();
    });

    it("should have deflate settings", () => {
      expect(COMPRESSION.deflate.extension).toBe(".zz");
      expect(COMPRESSION.deflate.defaultLevel).toBe(6);
      expect(COMPRESSION.deflate.description).toBeDefined();
    });
  });
});

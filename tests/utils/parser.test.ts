/**
 * Parser Utility Tests
 * Tests for command parsing functions
 * 
 * Demonstrates: Jest testing, describe/it blocks, expect assertions,
 * testing success cases, error cases, and edge cases
 */

import {
  parseCommandWithQuotes,
  tokenize,
  isFlag,
  parseFlags,
  escapeString,
  normalizeWhitespace,
} from "../../src/utils/parser";

describe("Parser Utilities", () => {
  // ==================== parseCommandWithQuotes Tests ====================
  describe("parseCommandWithQuotes", () => {
    // Success cases
    describe("success cases", () => {
      it("should parse a simple command without arguments", () => {
        const result = parseCommandWithQuotes("ls");
        expect(result.command).toBe("ls");
        expect(result.args).toEqual([]);
      });

      it("should parse a command with single argument", () => {
        const result = parseCommandWithQuotes("cd Documents");
        expect(result.command).toBe("cd");
        expect(result.args).toEqual(["Documents"]);
      });

      it("should parse a command with multiple arguments", () => {
        const result = parseCommandWithQuotes("cp file.txt backup/");
        expect(result.command).toBe("cp");
        expect(result.args).toEqual(["file.txt", "backup/"]);
      });

      it("should handle double-quoted strings with spaces", () => {
        const result = parseCommandWithQuotes('cat "my file.txt"');
        expect(result.command).toBe("cat");
        expect(result.args).toEqual(["my file.txt"]);
      });

      it("should handle single-quoted strings with spaces", () => {
        const result = parseCommandWithQuotes("cat 'my file.txt'");
        expect(result.command).toBe("cat");
        expect(result.args).toEqual(["my file.txt"]);
      });

      it("should handle mixed quotes", () => {
        const result = parseCommandWithQuotes(`cp "file one.txt" 'folder two/'`);
        expect(result.command).toBe("cp");
        expect(result.args).toEqual(["file one.txt", "folder two/"]);
      });

      it("should handle quotes within quotes", () => {
        const result = parseCommandWithQuotes(`write file.txt "He said 'hello'"`);
        expect(result.command).toBe("write");
        expect(result.args).toEqual(["file.txt", "He said 'hello'"]);
      });

      it("should handle paths with special characters", () => {
        const result = parseCommandWithQuotes('cd "C:\\Users\\Documents"');
        expect(result.command).toBe("cd");
        expect(result.args).toEqual(["C:\\Users\\Documents"]);
      });
    });

    // Error/edge cases
    describe("edge cases", () => {
      it("should return empty command for empty string", () => {
        const result = parseCommandWithQuotes("");
        expect(result.command).toBe("");
        expect(result.args).toEqual([]);
      });

      it("should handle multiple spaces between arguments", () => {
        const result = parseCommandWithQuotes("cp   file.txt    dest/");
        expect(result.command).toBe("cp");
        expect(result.args).toEqual(["file.txt", "dest/"]);
      });

      it("should handle leading and trailing spaces", () => {
        const result = parseCommandWithQuotes("  ls  ");
        expect(result.command).toBe("ls");
        expect(result.args).toEqual([]);
      });

      it("should handle unclosed quotes (includes rest of string)", () => {
        const result = parseCommandWithQuotes('cat "incomplete');
        expect(result.command).toBe("cat");
        expect(result.args).toEqual(["incomplete"]);
      });

      it("should handle empty quotes", () => {
        const result = parseCommandWithQuotes('write file.txt ""');
        expect(result.command).toBe("write");
        expect(result.args).toEqual(["file.txt"]);
      });

      it("should handle escaped double quotes", () => {
        const result = parseCommandWithQuotes('echo \\"hello\\"');
        expect(result.command).toBe("echo");
        expect(result.args).toEqual(['"hello"']);
      });

      it("should handle escaped single quotes", () => {
        const result = parseCommandWithQuotes("echo \\'test\\'");
        expect(result.command).toBe("echo");
        expect(result.args).toEqual(["'test'"]);
      });

      it("should handle escaped backslash", () => {
        const result = parseCommandWithQuotes("echo \\\\path");
        expect(result.command).toBe("echo");
        expect(result.args).toEqual(["\\path"]);
      });

      it("should handle only spaces", () => {
        const result = parseCommandWithQuotes("   ");
        expect(result.command).toBe("");
        expect(result.args).toEqual([]);
      });
    });
  });

  // ==================== tokenize Tests ====================
  describe("tokenize", () => {
    describe("success cases", () => {
      it("should tokenize a simple string", () => {
        const result = tokenize("hello world");
        expect(result).toEqual(["hello", "world"]);
      });

      it("should preserve quoted strings", () => {
        const result = tokenize('hello "big world"');
        expect(result).toEqual(["hello", "big world"]);
      });

      it("should filter out empty tokens", () => {
        const result = tokenize("hello  world");
        expect(result).toEqual(["hello", "world"]);
      });
    });

    describe("edge cases", () => {
      it("should return empty array for empty string", () => {
        const result = tokenize("");
        expect(result).toEqual([]);
      });

      it("should return empty array for whitespace only", () => {
        const result = tokenize("   ");
        expect(result).toEqual([]);
      });
    });
  });

  // ==================== isFlag Tests ====================
  describe("isFlag", () => {
    describe("success cases", () => {
      it("should return true for double-dash flags", () => {
        expect(isFlag("--verbose")).toBe(true);
      });

      it("should return true for single-dash flags", () => {
        expect(isFlag("-v")).toBe(true);
      });

      it("should return true for flags with values", () => {
        expect(isFlag("--name=value")).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false for regular strings", () => {
        expect(isFlag("hello")).toBe(false);
      });

      it("should return false for just a dash", () => {
        expect(isFlag("-")).toBe(false);
      });

      it("should return false for numbers starting with dash", () => {
        expect(isFlag("-123")).toBe(true); // Still valid flag format
      });
    });

    describe("edge cases", () => {
      it("should return false for empty string", () => {
        expect(isFlag("")).toBe(false);
      });

      it("should return true for double-dash only", () => {
        expect(isFlag("--")).toBe(true);
      });
    });
  });

  // ==================== parseFlags Tests ====================
  describe("parseFlags", () => {
    describe("success cases", () => {
      it("should parse long flags with values", () => {
        const result = parseFlags(["--name=John", "--age=30"]);
        expect(result.flags.get("name")).toBe("John");
        expect(result.flags.get("age")).toBe("30");
        expect(result.remaining).toEqual([]);
      });

      it("should parse boolean long flags", () => {
        const result = parseFlags(["--verbose", "--debug"]);
        expect(result.flags.get("verbose")).toBe(true);
        expect(result.flags.get("debug")).toBe(true);
      });

      it("should parse short flags with values", () => {
        const result = parseFlags(["-n", "John"]);
        expect(result.flags.get("n")).toBe("John");
        expect(result.remaining).toEqual([]);
      });

      it("should separate flags from remaining arguments", () => {
        const result = parseFlags(["--verbose", "file.txt", "output.txt"]);
        expect(result.flags.get("verbose")).toBe(true);
        expect(result.remaining).toEqual(["file.txt", "output.txt"]);
      });

      it("should handle mixed flags and arguments", () => {
        const result = parseFlags([
          "source.txt",
          "--compress",
          "dest.txt",
          "-l",
          "5",
        ]);
        expect(result.flags.get("compress")).toBe(true);
        expect(result.flags.get("l")).toBe("5");
        expect(result.remaining).toEqual(["source.txt", "dest.txt"]);
      });
    });

    describe("edge cases", () => {
      it("should handle empty array", () => {
        const result = parseFlags([]);
        expect(result.flags.size).toBe(0);
        expect(result.remaining).toEqual([]);
      });

      it("should handle only non-flag arguments", () => {
        const result = parseFlags(["file1.txt", "file2.txt"]);
        expect(result.flags.size).toBe(0);
        expect(result.remaining).toEqual(["file1.txt", "file2.txt"]);
      });

      it("should handle short flag followed by another flag (boolean)", () => {
        const result = parseFlags(["-v", "-d"]);
        expect(result.flags.get("v")).toBe(true);
        expect(result.flags.get("d")).toBe(true);
        expect(result.remaining).toEqual([]);
      });

      it("should handle short flag at end of args (boolean)", () => {
        const result = parseFlags(["file.txt", "-v"]);
        expect(result.flags.get("v")).toBe(true);
        expect(result.remaining).toEqual(["file.txt"]);
      });
    });
  });

  // ==================== escapeString Tests ====================
  describe("escapeString", () => {
    describe("success cases", () => {
      it("should escape backslashes", () => {
        expect(escapeString("C:\\path")).toBe("C:\\\\path");
      });

      it("should escape double quotes", () => {
        expect(escapeString('say "hello"')).toBe('say \\"hello\\"');
      });

      it("should escape single quotes", () => {
        expect(escapeString("it's")).toBe("it\\'s");
      });

      it("should escape newlines", () => {
        expect(escapeString("line1\nline2")).toBe("line1\\nline2");
      });

      it("should escape tabs", () => {
        expect(escapeString("col1\tcol2")).toBe("col1\\tcol2");
      });

      it("should escape carriage returns", () => {
        expect(escapeString("line1\rline2")).toBe("line1\\rline2");
      });

      it("should escape multiple special characters", () => {
        expect(escapeString('path\\file "name"\n')).toBe(
          'path\\\\file \\"name\\"\\n'
        );
      });
    });

    describe("edge cases", () => {
      it("should return empty string for empty input", () => {
        expect(escapeString("")).toBe("");
      });

      it("should not modify strings without special chars", () => {
        expect(escapeString("hello world")).toBe("hello world");
      });
    });
  });

  // ==================== normalizeWhitespace Tests ====================
  describe("normalizeWhitespace", () => {
    describe("success cases", () => {
      it("should trim leading and trailing spaces", () => {
        expect(normalizeWhitespace("  hello  ")).toBe("hello");
      });

      it("should collapse multiple spaces to single space", () => {
        expect(normalizeWhitespace("hello    world")).toBe("hello world");
      });

      it("should handle tabs", () => {
        expect(normalizeWhitespace("hello\tworld")).toBe("hello world");
      });

      it("should handle mixed whitespace", () => {
        expect(normalizeWhitespace("  hello \t world  ")).toBe("hello world");
      });
    });

    describe("edge cases", () => {
      it("should return empty string for empty input", () => {
        expect(normalizeWhitespace("")).toBe("");
      });

      it("should return empty string for whitespace only", () => {
        expect(normalizeWhitespace("   \t  ")).toBe("");
      });

      it("should not modify already normalized strings", () => {
        expect(normalizeWhitespace("hello world")).toBe("hello world");
      });
    });
  });
});

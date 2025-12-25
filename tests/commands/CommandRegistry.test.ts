/**
 * CommandRegistry Class Tests
 * Tests for command registration and execution
 * 
 * Demonstrates: Testing class methods, mocking handlers, iterators
 */

import { CommandRegistry } from "../../src/cli/CommandRegistry";
import type { CommandDoc, CommandHandler } from "../../src/types";

describe("CommandRegistry", () => {
  let registry: CommandRegistry;

  // Sample command documentation
  const sampleDoc: CommandDoc = {
    description: "A test command",
    syntax: "test <arg>",
    example: "test hello",
    details: "This is a test command for testing purposes.",
    category: "utility",
  };

  // Mock handler
  const mockHandler: CommandHandler = jest.fn();

  beforeEach(() => {
    registry = new CommandRegistry();
    jest.clearAllMocks();
  });

  // ==================== Constructor Tests ====================
  describe("constructor", () => {
    it("should create empty registry", () => {
      expect(registry.size).toBe(0);
    });

    it("should initialize with no aliases", () => {
      const aliases = registry.getAliases();
      expect(aliases.size).toBe(0);
    });
  });

  // ==================== Register Tests ====================
  describe("register", () => {
    describe("success cases", () => {
      it("should register a command", () => {
        registry.register("test", mockHandler, sampleDoc);
        expect(registry.has("test")).toBe(true);
      });

      it("should register multiple commands", () => {
        registry.register("cmd1", mockHandler, sampleDoc);
        registry.register("cmd2", mockHandler, sampleDoc);
        expect(registry.size).toBe(2);
      });

      it("should register command with confirmation requirement", () => {
        registry.register("danger", mockHandler, sampleDoc, true);
        expect(registry.requiresConfirmation("danger")).toBe(true);
      });

      it("should register command without confirmation by default", () => {
        registry.register("safe", mockHandler, sampleDoc);
        expect(registry.requiresConfirmation("safe")).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should overwrite existing command", () => {
        const newHandler = jest.fn();
        registry.register("test", mockHandler, sampleDoc);
        registry.register("test", newHandler, sampleDoc);
        
        const cmd = registry.get("test");
        expect(cmd?.handler).toBe(newHandler);
      });
    });
  });

  // ==================== RegisterAlias Tests ====================
  describe("registerAlias", () => {
    describe("success cases", () => {
      it("should register alias for existing command", () => {
        registry.register("test", mockHandler, sampleDoc);
        registry.registerAlias("t", "test");
        
        expect(registry.has("t")).toBe(true);
      });

      it("should allow multiple aliases for same command", () => {
        registry.register("test", mockHandler, sampleDoc);
        registry.registerAlias("t", "test");
        registry.registerAlias("tst", "test");
        
        expect(registry.has("t")).toBe(true);
        expect(registry.has("tst")).toBe(true);
      });
    });

    describe("error cases", () => {
      it("should throw error for non-existent command", () => {
        expect(() => {
          registry.registerAlias("t", "nonexistent");
        }).toThrow("Cannot create alias for non-existent command");
      });
    });
  });

  // ==================== Get Tests ====================
  describe("get", () => {
    describe("success cases", () => {
      it("should get registered command", () => {
        registry.register("test", mockHandler, sampleDoc);
        const cmd = registry.get("test");
        
        expect(cmd).toBeDefined();
        expect(cmd?.name).toBe("test");
        expect(cmd?.handler).toBe(mockHandler);
      });

      it("should get command by alias", () => {
        registry.register("test", mockHandler, sampleDoc);
        registry.registerAlias("t", "test");
        
        const cmd = registry.get("t");
        expect(cmd?.name).toBe("test");
      });
    });

    describe("negative cases", () => {
      it("should return undefined for non-existent command", () => {
        expect(registry.get("nonexistent")).toBeUndefined();
      });
    });
  });

  // ==================== Has Tests ====================
  describe("has", () => {
    describe("success cases", () => {
      it("should return true for registered command", () => {
        registry.register("test", mockHandler, sampleDoc);
        expect(registry.has("test")).toBe(true);
      });

      it("should return true for alias", () => {
        registry.register("test", mockHandler, sampleDoc);
        registry.registerAlias("t", "test");
        expect(registry.has("t")).toBe(true);
      });
    });

    describe("negative cases", () => {
      it("should return false for non-existent command", () => {
        expect(registry.has("nonexistent")).toBe(false);
      });
    });
  });

  // ==================== Execute Tests ====================
  describe("execute", () => {
    describe("success cases", () => {
      it("should execute registered command", async () => {
        registry.register("test", mockHandler, sampleDoc);
        await registry.execute("test", ["arg1", "arg2"]);
        
        expect(mockHandler).toHaveBeenCalledWith(["arg1", "arg2"]);
      });

      it("should execute command by alias", async () => {
        registry.register("test", mockHandler, sampleDoc);
        registry.registerAlias("t", "test");
        
        await registry.execute("t", ["arg"]);
        expect(mockHandler).toHaveBeenCalledWith(["arg"]);
      });

      it("should handle async handlers", async () => {
        const asyncHandler = jest.fn().mockResolvedValue(undefined);
        registry.register("async", asyncHandler, sampleDoc);
        
        await registry.execute("async", []);
        expect(asyncHandler).toHaveBeenCalled();
      });
    });

    describe("error cases", () => {
      it("should throw error for unknown command", async () => {
        await expect(
          registry.execute("nonexistent", [])
        ).rejects.toThrow("Unknown command");
      });

      it("should propagate handler errors", async () => {
        const errorHandler = jest.fn().mockRejectedValue(new Error("Handler error"));
        registry.register("error", errorHandler, sampleDoc);
        
        await expect(
          registry.execute("error", [])
        ).rejects.toThrow("Handler error");
      });
    });
  });

  // ==================== RequiresConfirmation Tests ====================
  describe("requiresConfirmation", () => {
    it("should return true for commands requiring confirmation", () => {
      registry.register("danger", mockHandler, sampleDoc, true);
      expect(registry.requiresConfirmation("danger")).toBe(true);
    });

    it("should return false for safe commands", () => {
      registry.register("safe", mockHandler, sampleDoc, false);
      expect(registry.requiresConfirmation("safe")).toBe(false);
    });

    it("should return false for non-existent commands", () => {
      expect(registry.requiresConfirmation("nonexistent")).toBe(false);
    });
  });

  // ==================== GetCommandNames Tests ====================
  describe("getCommandNames", () => {
    it("should return all command names", () => {
      registry.register("cmd1", mockHandler, sampleDoc);
      registry.register("cmd2", mockHandler, sampleDoc);
      
      const names = registry.getCommandNames();
      expect(names).toContain("cmd1");
      expect(names).toContain("cmd2");
      expect(names.length).toBe(2);
    });

    it("should return empty array for empty registry", () => {
      expect(registry.getCommandNames()).toEqual([]);
    });
  });

  // ==================== GetCommandsByCategory Tests ====================
  describe("getCommandsByCategory", () => {
    it("should return commands in category", () => {
      const navDoc: CommandDoc = { ...sampleDoc, category: "navigation" };
      const fileDoc: CommandDoc = { ...sampleDoc, category: "file-operations" };
      
      registry.register("cd", mockHandler, navDoc);
      registry.register("ls", mockHandler, navDoc);
      registry.register("cat", mockHandler, fileDoc);
      
      const navCommands = registry.getCommandsByCategory("navigation");
      expect(navCommands.length).toBe(2);
      expect(navCommands.map((c) => c.name)).toContain("cd");
      expect(navCommands.map((c) => c.name)).toContain("ls");
    });

    it("should return empty array for empty category", () => {
      const commands = registry.getCommandsByCategory("hash");
      expect(commands).toEqual([]);
    });
  });

  // ==================== GetAllCommandsByCategory Tests ====================
  describe("getAllCommandsByCategory", () => {
    it("should return all categories with commands", () => {
      const navDoc: CommandDoc = { ...sampleDoc, category: "navigation" };
      registry.register("cd", mockHandler, navDoc);
      
      const categories = registry.getAllCommandsByCategory();
      
      expect(categories).toHaveProperty("navigation");
      expect(categories).toHaveProperty("file-operations");
      expect(categories).toHaveProperty("utility");
      expect(categories.navigation.length).toBe(1);
    });
  });

  // ==================== GetDoc Tests ====================
  describe("getDoc", () => {
    it("should return documentation for command", () => {
      registry.register("test", mockHandler, sampleDoc);
      const doc = registry.getDoc("test");
      
      expect(doc).toEqual(sampleDoc);
    });

    it("should return undefined for non-existent command", () => {
      expect(registry.getDoc("nonexistent")).toBeUndefined();
    });
  });

  // ==================== Size Tests ====================
  describe("size", () => {
    it("should return correct count", () => {
      expect(registry.size).toBe(0);
      
      registry.register("cmd1", mockHandler, sampleDoc);
      expect(registry.size).toBe(1);
      
      registry.register("cmd2", mockHandler, sampleDoc);
      expect(registry.size).toBe(2);
    });
  });

  // ==================== Clear Tests ====================
  describe("clear", () => {
    it("should remove all commands", () => {
      registry.register("cmd1", mockHandler, sampleDoc);
      registry.register("cmd2", mockHandler, sampleDoc);
      registry.registerAlias("c1", "cmd1");
      
      registry.clear();
      
      expect(registry.size).toBe(0);
      expect(registry.getAliases().size).toBe(0);
    });
  });

  // ==================== ToArray Tests ====================
  describe("toArray", () => {
    it("should return array of commands", () => {
      registry.register("cmd1", mockHandler, sampleDoc);
      registry.register("cmd2", mockHandler, sampleDoc);
      
      const array = registry.toArray();
      
      expect(Array.isArray(array)).toBe(true);
      expect(array.length).toBe(2);
    });
  });

  // ==================== Iterator Tests ====================
  describe("iterator", () => {
    it("should support for...of iteration", () => {
      registry.register("cmd1", mockHandler, sampleDoc);
      registry.register("cmd2", mockHandler, sampleDoc);
      
      const names: string[] = [];
      for (const cmd of registry) {
        names.push(cmd.name);
      }
      
      expect(names).toContain("cmd1");
      expect(names).toContain("cmd2");
    });
  });

  // ==================== GenerateHelpText Tests ====================
  describe("generateHelpText", () => {
    it("should generate help text", () => {
      const navDoc: CommandDoc = { ...sampleDoc, category: "navigation" };
      registry.register("cd", mockHandler, navDoc);
      
      const helpText = registry.generateHelpText();
      
      expect(helpText).toContain("Navigation");
      // The syntax from navDoc is "test <arg>", not "cd"
      expect(helpText).toContain("test <arg>");
    });

    it("should include usage instructions", () => {
      const helpText = registry.generateHelpText();
      expect(helpText).toContain("man");
    });
  });

  // ==================== GenerateCommandHelp Tests ====================
  describe("generateCommandHelp", () => {
    it("should generate detailed help for command", () => {
      registry.register("test", mockHandler, sampleDoc);
      
      const help = registry.generateCommandHelp("test");
      
      expect(help).toContain("test");
      expect(help).toContain(sampleDoc.description);
      expect(help).toContain(sampleDoc.syntax);
      expect(help).toContain(sampleDoc.example);
    });

    it("should return null for non-existent command", () => {
      expect(registry.generateCommandHelp("nonexistent")).toBeNull();
    });
  });
});

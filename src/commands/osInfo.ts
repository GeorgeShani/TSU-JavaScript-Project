import type { CommandDoc } from "../types/index.js";
import type { FileManager } from "../cli/FileManager.js";
import type { CommandRegistry } from "../cli/CommandRegistry.js";
import { MESSAGES, styles } from "../constants/index.js";

export const registerOSInfoCommands = (
  registry: CommandRegistry,
  fileManager: FileManager
): void => {
  const osDoc: CommandDoc = {
    description: "Show system-related information",
    syntax: "os <option>",
    example: "os --cpus",
    details:
      "Displays system info based on the option provided:\n" +
      "  --EOL: Show the End-Of-Line marker used by your OS\n" +
      "  --cpus: List CPU model, speed, and core count\n" +
      "  --homedir: Display the current user's home directory\n" +
      "  --username: Show your system username\n" +
      "  --architecture: Print the CPU architecture (e.g., x64)\n" +
      "  --platform: Show the operating system platform\n" +
      "  --memory: Display total and free memory",
    category: "os-info",
  };

  const osHandler = (args: string[]): void => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("OS info parameter"));
    }

    const info = fileManager.getOSInfo(args[0]);
    const styledInfo = info
      .replace(/^([^:]+):/gm, (_, label) => `${styles.bold(label)}:`)
      .replace(/(\d+\.?\d*\s*(GB|MB|KB|GHz|B))/gi, (match) => styles.highlight(match));
    
    console.log(styledInfo);
  };

  registry.register("os", osHandler, osDoc);

  const sysinfoDoc: CommandDoc = {
    description: "Display all system information",
    syntax: "sysinfo",
    example: "sysinfo",
    details:
      "Displays comprehensive system information including CPU, " +
      "memory, platform, architecture, and user details.",
    category: "os-info",
  };

  const sysinfoHandler = (): void => {
    console.log();
    console.log(styles.header("=== System Information ==="));
    console.log();
    
    const infoItems = [
      { flag: "--platform", label: "Platform" },
      { flag: "--architecture", label: "Architecture" },
      { flag: "--cpus", label: "CPU Info" },
      { flag: "--memory", label: "Memory" },
      { flag: "--homedir", label: "Home Directory" },
      { flag: "--username", label: "Username" },
      { flag: "--EOL", label: "EOL Character" },
    ];

    for (const item of infoItems) {
      try {
        const info = fileManager.getOSInfo(item.flag);
        const styledInfo = info
          .replace(/(\d+\.?\d*\s*(GB|MB|KB|GHz|B))/gi, (match) => styles.highlight(match))
          .replace(/(x64|x86|arm64|arm|win32|darwin|linux)/gi, (match) => styles.info(match));
        
        console.log(styledInfo);
        console.log();
      } catch {
        // Skip if any flag fails
      }
    }

    console.log(styles.header("=========================="));
    console.log();
  };

  registry.register("sysinfo", sysinfoHandler, sysinfoDoc);
  registry.registerAlias("systeminfo", "sysinfo");
};

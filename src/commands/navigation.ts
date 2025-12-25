import type { CommandDoc } from "../types/index.js";
import type { FileManager } from "../cli/FileManager.js";
import type { CommandRegistry } from "../cli/CommandRegistry.js";
import { MESSAGES, styles } from "../constants/index.js";

export const registerNavigationCommands = (
  registry: CommandRegistry,
  fileManager: FileManager
): void => {
  const upDoc: CommandDoc = {
    description: "Move up one directory level",
    syntax: "up",
    example: "up",
    details:
      "Navigates to the parent of the current working directory. " +
      "You cannot move above the home directory.",
    category: "navigation",
  };

  const upHandler = (): void => {
    const moved = fileManager.navigateUp();
    if (!moved) {
      console.log(MESSAGES.errors.cannotNavigateAboveHome);
    }
  };

  registry.register("up", upHandler, upDoc);

  const cdDoc: CommandDoc = {
    description: "Change the current directory",
    syntax: "cd <path_to_directory>",
    example: "cd Documents",
    details:
      "Changes your working directory to the given path. " +
      "The path may be absolute or relative.",
    category: "navigation",
  };

  const cdHandler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("path"));
    }

    await fileManager.changeDirectory(args[0]);
  };

  registry.register("cd", cdHandler, cdDoc);

  const lsDoc: CommandDoc = {
    description: "List contents of the current directory",
    syntax: "ls",
    example: "ls",
    details:
      "Displays a table with name, type, size, and last modified date. " +
      "Lists directories first, followed by files, sorted alphabetically.",
    category: "navigation",
  };

  const lsHandler = async (): Promise<void> => {
    const entries = await fileManager.listDirectory();

    if (entries.length === 0) {
      console.log(MESSAGES.info.emptyDirectory);
      return;
    }

    console.log();
    console.log(
      styles.tableHeader(
        "Name".padEnd(35) + "Type".padEnd(12) + "Size".padEnd(12) + "Modified"
      )
    );
    console.log(styles.dim("-".repeat(75)));

    for (const entry of entries) {
      const nameStyle = entry.type === "directory" ? styles.directory : styles.filename;
      const typeStyle = entry.type === "directory" ? styles.dirType : styles.fileType;
      
      const name = nameStyle(entry.name.padEnd(35));
      const type = typeStyle(entry.type.padEnd(12));
      const size = styles.size(entry.size.padEnd(12));
      const modified = styles.date(entry.modified);

      console.log(`${name}${type}${size}${modified}`);
    }

    console.log();
    console.log(
      styles.dim(`Total: ${entries.length} item(s)`)
    );
  };

  registry.register("ls", lsHandler, lsDoc);
  registry.registerAlias("dir", "ls");

  const pwdDoc: CommandDoc = {
    description: "Print current working directory",
    syntax: "pwd",
    example: "pwd",
    details: "Displays the absolute path of the current working directory.",
    category: "navigation",
  };

  const pwdHandler = (): void => {
    console.log(styles.path(fileManager.pwd()));
  };

  registry.register("pwd", pwdHandler, pwdDoc);
};

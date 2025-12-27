import type { CommandDoc } from "../types/index.js";
import type { FileManager } from "../cli/FileManager.js";
import type { CommandRegistry } from "../cli/CommandRegistry.js";
import { MESSAGES, styles } from "../constants/index.js";

export const registerFileOperationCommands = (
  registry: CommandRegistry,
  fileManager: FileManager
): void => {
  const catDoc: CommandDoc = {
    description: "Read and display a file's content",
    syntax: "cat <path_to_file>",
    example: "cat example.txt",
    details:
      "Outputs the contents of a file to the console using a readable stream.",
    category: "file-operations",
  };

  const catHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file path"));
    }

    console.log(styles.dim(`--- ${args[0]} ---`));
    const content = await fileManager.readFile(args[0], signal);
    console.log(content);
    console.log(styles.dim("--- end ---"));
  };

  registry.register("cat", catHandler, catDoc);
  registry.registerAlias("type", "cat");

  const addDoc: CommandDoc = {
    description: "Create an empty file",
    syntax: "add <new_file_name>",
    example: "add newfile.txt",
    details:
      "Creates a new, empty file in your current working directory " +
      "with the specified name.",
    category: "file-operations",
  };

  const addHandler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file name"));
    }

    const filePath = await fileManager.createFile(args[0]);
    console.log(MESSAGES.success.fileCreated(filePath));
  };

  registry.register("add", addHandler, addDoc);

  const touchDoc: CommandDoc = {
    description: "Create an empty file (alias for add)",
    syntax: "touch <file_name>",
    example: "touch newfile.txt",
    details:
      "Creates a new, empty file in your current working directory. " +
      "This is an alias for the 'add' command.",
    category: "file-operations",
  };

  registry.register("touch", addHandler, touchDoc);

  const writeDoc: CommandDoc = {
    description: "Create or overwrite a file with content",
    syntax: "write <file_name> <content>",
    example: 'write notes.txt "Hello, World!"',
    details:
      "Creates a new file with the specified content, or overwrites " +
      "an existing file. Content should be quoted if it contains spaces.",
    category: "file-operations",
  };

  const writeHandler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file name"));
    }
    if (args.length < 2) {
      throw new Error(MESSAGES.errors.missingArgument("content"));
    }

    const content = args.slice(1).join(" ");
    const filePath = await fileManager.writeFile(args[0], content);
    console.log(MESSAGES.success.fileCreated(filePath));
  };

  registry.register("write", writeHandler, writeDoc);

  const mkdirDoc: CommandDoc = {
    description: "Create a new directory",
    syntax: "mkdir <new_directory_name>",
    example: "mkdir new_folder",
    details:
      "Creates a new directory inside the current working directory " +
      "with the given name.",
    category: "file-operations",
  };

  const mkdirHandler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("directory name"));
    }

    const dirPath = await fileManager.createDirectory(args[0]);
    console.log(MESSAGES.success.directoryCreated(dirPath));
  };

  registry.register("mkdir", mkdirHandler, mkdirDoc);
  registry.registerAlias("md", "mkdir");

  const rnDoc: CommandDoc = {
    description: "Rename an existing file",
    syntax: "rn <path_to_file> <new_filename>",
    example: "rn old.txt new.txt",
    details:
      "Renames a file without altering its content. " +
      "The new name is applied in the same location.",
    category: "file-operations",
  };

  const rnHandler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file path"));
    }
    if (!args[1]) {
      throw new Error(MESSAGES.errors.missingArgument("new file name"));
    }

    await fileManager.renameFile(args[0], args[1]);
    console.log(MESSAGES.success.fileRenamed(args[0], args[1]));
  };

  registry.register("rn", rnHandler, rnDoc);
  registry.registerAlias("rename", "rn");
  registry.registerAlias("mv", "rn");

  const cpDoc: CommandDoc = {
    description: "Copy a file to a new location",
    syntax: "cp <path_to_file> <path_to_new_directory>",
    example: "cp file.txt backups/",
    details:
      "Copies a file to the specified directory using readable " +
      "and writable streams for better performance.",
    category: "file-operations",
  };

  const cpHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("source path"));
    }
    if (!args[1]) {
      throw new Error(MESSAGES.errors.missingArgument("destination path"));
    }

    const destPath = await fileManager.copyFile(args[0], args[1], signal);
    console.log(MESSAGES.success.fileCopied(args[0], destPath));
  };

  registry.register("cp", cpHandler, cpDoc);
  registry.registerAlias("copy", "cp");

  const moveDoc: CommandDoc = {
    description: "Move a file to a new location",
    syntax: "move <path_to_file> <path_to_new_directory>",
    example: "move file.txt archive/",
    details:
      "Transfers a file to the new directory by copying it first, " +
      "then deleting it from the original location.",
    category: "file-operations",
  };

  const moveHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("source path"));
    }
    if (!args[1]) {
      throw new Error(MESSAGES.errors.missingArgument("destination path"));
    }

    const destPath = await fileManager.moveFile(args[0], args[1], signal);
    console.log(MESSAGES.success.fileMoved(args[0], destPath));
  };

  registry.register("move", moveHandler, moveDoc);

  const rmDoc: CommandDoc = {
    description: "Delete a file",
    syntax: "rm <path_to_file>",
    example: "rm file.txt",
    details: "Removes the specified file permanently from the file system.",
    category: "file-operations",
  };

  const rmHandler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file path"));
    }

    await fileManager.deleteFile(args[0]);
    console.log(MESSAGES.success.fileDeleted(args[0]));
  };

  registry.register("rm", rmHandler, rmDoc, true);
  registry.registerAlias("del", "rm");
  registry.registerAlias("delete", "rm");

  const rmdirDoc: CommandDoc = {
    description: "Delete an empty directory",
    syntax: "rmdir <path_to_directory>",
    example: "rmdir empty_folder",
    details:
      "Removes the specified directory. The directory must be empty.",
    category: "file-operations",
  };

  const rmdirHandler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("directory path"));
    }

    await fileManager.deleteDirectory(args[0]);
    console.log(MESSAGES.success.directoryDeleted(args[0]));
  };

  registry.register("rmdir", rmdirHandler, rmdirDoc, true);
  registry.registerAlias("rd", "rmdir");

  const infoDoc: CommandDoc = {
    description: "Display detailed file information",
    syntax: "info <path_to_file>",
    example: "info document.pdf",
    details:
      "Shows detailed information about a file including size, " +
      "creation date, modification date, and permissions.",
    category: "file-operations",
  };

  const infoHandler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file path"));
    }

    const info = await fileManager.getFileInfo(args[0]);
    
    console.log();
    console.log(styles.header("=== File Information ==="));
    console.log(`${styles.bold("Path:")}        ${styles.path(info.path)}`);
    console.log(`${styles.bold("Name:")}        ${styles.filename(info.name)}`);
    console.log(`${styles.bold("Type:")}        ${info.isDirectory ? styles.dirType("Directory") : styles.fileType("File")}`);
    console.log(`${styles.bold("Size:")}        ${styles.size(info.size + " bytes")}`);
    console.log(`${styles.bold("Created:")}     ${styles.date(info.created.toLocaleString())}`);
    console.log(`${styles.bold("Modified:")}    ${styles.date(info.modified.toLocaleString())}`);
    console.log(`${styles.bold("Permissions:")} ${styles.dim(info.permissions)}`);
    console.log(styles.header("========================"));
    console.log();
  };

  registry.register("info", infoHandler, infoDoc);
  registry.registerAlias("stat", "info");
};

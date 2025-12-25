import type { CommandDoc } from "../types/index.js";
import type { FileManager } from "../cli/FileManager.js";
import type { CommandRegistry } from "../cli/CommandRegistry.js";
import { MESSAGES, HASH_ALGORITHMS, DEFAULT_HASH_ALGORITHM, styles } from "../constants/index.js";

export const registerHashCommands = (
  registry: CommandRegistry,
  fileManager: FileManager
): void => {
  const hashDoc: CommandDoc = {
    description: "Generate hash of a file",
    syntax: "hash <path_to_file> [algorithm]",
    example: "hash document.pdf sha256",
    details:
      "Calculates the cryptographic hash of the provided file. " +
      `Supported algorithms: ${HASH_ALGORITHMS.join(", ")}. ` +
      `Default algorithm: ${DEFAULT_HASH_ALGORITHM}.`,
    category: "hash",
  };

  const hashHandler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file path"));
    }

    const filePath = args[0];
    const algorithm = args[1] ?? DEFAULT_HASH_ALGORITHM;

    if (!HASH_ALGORITHMS.includes(algorithm as typeof HASH_ALGORITHMS[number])) {
      throw new Error(
        `${styles.error("Invalid algorithm.")} Supported: ${styles.info(HASH_ALGORITHMS.join(", "))}`
      );
    }

    console.log(styles.info("Calculating hash..."));
    const result = await fileManager.calculateHash(filePath, algorithm);

    console.log();
    console.log(`${styles.bold("File:")}      ${styles.path(result.filePath)}`);
    console.log(`${styles.bold("Algorithm:")} ${styles.info(result.algorithm.toUpperCase())}`);
    console.log(`${styles.bold("Hash:")}      ${styles.success(result.hash)}`);
    console.log();
  };

  registry.register("hash", hashHandler, hashDoc);

  const md5Doc: CommandDoc = {
    description: "Generate MD5 hash of a file",
    syntax: "md5 <path_to_file>",
    example: "md5 file.txt",
    details: "Shortcut command to calculate MD5 hash of a file.",
    category: "hash",
  };

  const md5Handler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file path"));
    }

    const result = await fileManager.calculateHash(args[0], "md5");
    console.log(`${styles.info("MD5:")} ${styles.success(result.hash)}`);
  };

  registry.register("md5", md5Handler, md5Doc);

  const sha256Doc: CommandDoc = {
    description: "Generate SHA-256 hash of a file",
    syntax: "sha256 <path_to_file>",
    example: "sha256 file.txt",
    details: "Shortcut command to calculate SHA-256 hash of a file.",
    category: "hash",
  };

  const sha256Handler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file path"));
    }

    const result = await fileManager.calculateHash(args[0], "sha256");
    console.log(`${styles.info("SHA-256:")} ${styles.success(result.hash)}`);
  };

  registry.register("sha256", sha256Handler, sha256Doc);

  const sha512Doc: CommandDoc = {
    description: "Generate SHA-512 hash of a file",
    syntax: "sha512 <path_to_file>",
    example: "sha512 file.txt",
    details:
      "Shortcut command to calculate SHA-512 hash of a file. " +
      "SHA-512 produces a 128-character hexadecimal hash.",
    category: "hash",
  };

  const sha512Handler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file path"));
    }

    const result = await fileManager.calculateHash(args[0], "sha512");
    console.log(`${styles.info("SHA-512:")} ${styles.success(result.hash)}`);
  };

  registry.register("sha512", sha512Handler, sha512Doc);

  const sha1Doc: CommandDoc = {
    description: "Generate SHA-1 hash of a file",
    syntax: "sha1 <path_to_file>",
    example: "sha1 file.txt",
    details:
      "Shortcut command to calculate SHA-1 hash of a file. " +
      "Note: SHA-1 is considered cryptographically weak and should not be used for security purposes.",
    category: "hash",
  };

  const sha1Handler = async (args: string[]): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("file path"));
    }

    const result = await fileManager.calculateHash(args[0], "sha1");
    console.log(`${styles.info("SHA-1:")} ${styles.success(result.hash)}`);
  };

  registry.register("sha1", sha1Handler, sha1Doc);
};

import chalk from "chalk";

export const APP_NAME = "File Manager CLI";
export const APP_VERSION = "1.0.0";

export const styles = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  highlight: chalk.magenta,
  dim: chalk.gray,
  bold: chalk.bold,
  
  path: chalk.cyan.underline,
  filename: chalk.yellow,
  directory: chalk.blue.bold,
  command: chalk.green.bold,
  argument: chalk.yellow,
  flag: chalk.magenta,
  
  statusSuccess: chalk.bgGreen.black,
  statusError: chalk.bgRed.white,
  statusWarning: chalk.bgYellow.black,
  statusInfo: chalk.bgCyan.black,
  
  header: chalk.cyan.bold,
  subheader: chalk.white.bold,
  
  tableHeader: chalk.white.bold.underline,
  fileType: chalk.blue,
  dirType: chalk.green,
  size: chalk.yellow,
  date: chalk.gray,
} as const;

export const MESSAGES = {
  welcome: (username: string): string =>
    `${styles.success("Welcome")}, ${styles.highlight(username)}! Type ${styles.command('"man"')} to view available commands.`,
  farewell: (username: string): string =>
    `${styles.success("Farewell")}, ${styles.highlight(username)}! Thanks for using ${styles.bold(APP_NAME)}. Until next time!`,

  errors: {
    emptyCommand: styles.error("Empty command"),
    invalidCommand: `${styles.error("Invalid command.")} Type ${styles.command("'man'")} for available commands.`,
    missingArgument: (arg: string): string => 
      `${styles.error("Missing required argument:")} ${styles.argument(arg)}`,
    fileNotFound: (path: string): string => 
      `${styles.error("File not found:")} ${styles.path(path)}`,
    directoryNotFound: (path: string): string => 
      `${styles.error("Directory not found:")} ${styles.path(path)}`,
    fileExists: (path: string): string => 
      `${styles.error("File already exists:")} ${styles.path(path)}`,
    directoryExists: (path: string): string => 
      `${styles.error("Directory already exists:")} ${styles.path(path)}`,
    notAFile: (path: string): string => 
      `${styles.error("Not a file:")} ${styles.path(path)}`,
    notADirectory: (path: string): string => 
      `${styles.error("Not a directory:")} ${styles.path(path)}`,
    operationFailed: (operation: string): string => 
      `${styles.error("Operation failed:")} ${operation}`,
    permissionDenied: styles.error("Permission denied"),
    invalidPath: styles.error("Invalid path"),
    cannotNavigateAboveHome: styles.warning("Cannot navigate above home directory"),
  },

  success: {
    fileCreated: (path: string): string => 
      `${styles.success("File created:")} ${styles.path(path)}`,
    directoryCreated: (path: string): string => 
      `${styles.success("Directory created:")} ${styles.path(path)}`,
    fileDeleted: (path: string): string => 
      `${styles.success("File deleted:")} ${styles.path(path)}`,
    directoryDeleted: (path: string): string => 
      `${styles.success("Directory deleted:")} ${styles.path(path)}`,
    fileRenamed: (oldName: string, newName: string): string =>
      `${styles.success("Renamed:")} ${styles.filename(oldName)} ${styles.dim("->")} ${styles.filename(newName)}`,
    fileCopied: (src: string, dest: string): string =>
      `${styles.success("Copied:")} ${styles.path(src)} ${styles.dim("->")} ${styles.path(dest)}`,
    fileMoved: (src: string, dest: string): string =>
      `${styles.success("Moved:")} ${styles.path(src)} ${styles.dim("->")} ${styles.path(dest)}`,
    compressed: (src: string, dest: string): string =>
      `${styles.success("Compressed:")} ${styles.path(src)} ${styles.dim("->")} ${styles.path(dest)}`,
    decompressed: (src: string, dest: string): string =>
      `${styles.success("Decompressed:")} ${styles.path(src)} ${styles.dim("->")} ${styles.path(dest)}`,
  },

  prompts: {
    confirmDelete: (path: string): string =>
      `Are you sure you want to delete ${styles.path(path)}?`,
    confirmOverwrite: (path: string): string =>
      `File ${styles.path(path)} already exists. Overwrite?`,
    confirmMove: (src: string, dest: string): string =>
      `Move ${styles.path(src)} to ${styles.path(dest)}?`,
  },

  info: {
    searching: (pattern: string): string =>
      `${styles.info("Searching for")} ${styles.highlight(`"${pattern}"`)}...`,
    compressing: (path: string): string =>
      `${styles.info("Compressing")} ${styles.path(path)}...`,
    decompressing: (path: string): string =>
      `${styles.info("Decompressing")} ${styles.path(path)}...`,
    processing: styles.info("Processing..."),
    noMatches: styles.warning("No matches found."),
    emptyDirectory: styles.dim("Directory is empty."),
    operationCancelled: styles.warning("Operation cancelled."),
  },
} as const;

export const PROMPT_CHAR = styles.success("> ");

export const currentDirPrefix = (): string => 
  `\n${styles.info("Current Directory:")} `;

export const TABLE_COLUMNS = {
  name: 30,
  type: 12,
  size: 15,
  modified: 25,
} as const;

export const HASH_ALGORITHMS = ["sha256", "sha512", "md5", "sha1"] as const;

export const DEFAULT_HASH_ALGORITHM = "sha256";

export const COMPRESSION_ALGORITHMS = ["brotli", "gzip", "deflate"] as const;

export type CompressionAlgorithm = typeof COMPRESSION_ALGORITHMS[number];

export const DEFAULT_COMPRESSION_ALGORITHM: CompressionAlgorithm = "brotli";

export const COMPRESSION = {
  brotli: {
    extension: ".br",
    defaultLevel: 6,
    description: "Brotli - Best compression ratio, slower",
  },
  gzip: {
    extension: ".gz",
    defaultLevel: 6,
    description: "Gzip - Good balance of speed and compression",
  },
  deflate: {
    extension: ".zz",
    defaultLevel: 6,
    description: "Deflate - Fast compression, moderate ratio",
  },
} as const;

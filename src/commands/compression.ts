import type { CommandDoc } from "../types/index.js";
import type { FileManager } from "../cli/FileManager.js";
import type { CommandRegistry } from "../cli/CommandRegistry.js";
import {
  MESSAGES,
  styles,
  COMPRESSION_ALGORITHMS,
  DEFAULT_COMPRESSION_ALGORITHM,
  COMPRESSION,
} from "../constants/index.js";
import { directoryExists, fileExists } from "../utils/validation.js";
import { resolveFilePath } from "../utils/path.js";

type CompressionAlgorithm = "brotli" | "gzip" | "deflate";

export const registerCompressionCommands = (
  registry: CommandRegistry,
  fileManager: FileManager
): void => {
  const compressDoc: CommandDoc = {
    description: "Compress a file or folder",
    syntax: "compress <source> <destination> [algorithm]",
    example: "compress large.txt large.txt.gz gzip",
    details:
      `Compresses a file or folder using the specified algorithm and saves ` +
      `the result to the destination. Folders are archived and compressed together. ` +
      `Supported algorithms: ${COMPRESSION_ALGORITHMS.join(", ")}. ` +
      `Default: ${DEFAULT_COMPRESSION_ALGORITHM}.`,
    category: "compression",
  };

  const compressHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("source path"));
    }
    if (!args[1]) {
      throw new Error(MESSAGES.errors.missingArgument("destination path"));
    }

    const sourcePath = args[0];
    const destPath = args[1];
    const algorithm = (args[2]?.toLowerCase() || DEFAULT_COMPRESSION_ALGORITHM) as CompressionAlgorithm;

    if (!COMPRESSION_ALGORITHMS.includes(algorithm)) {
      throw new Error(
        `${styles.error("Invalid algorithm.")} Supported: ${styles.info(COMPRESSION_ALGORITHMS.join(", "))}`
      );
    }

    const resolvedSource = resolveFilePath(sourcePath);
    const isDirectory = await directoryExists(resolvedSource);
    const isFile = await fileExists(resolvedSource);

    if (!isDirectory && !isFile) {
      throw new Error(MESSAGES.errors.fileNotFound(sourcePath));
    }

    if (isDirectory) {
      console.log(
        `${styles.info("Compressing folder")} ${styles.path(sourcePath)} ${styles.dim("using")} ${styles.highlight(algorithm)}...`
      );

      const result = await fileManager.compressFolder(sourcePath, destPath, algorithm, signal);
      const ratio = result.originalSize > 0 
        ? ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)
        : "0.0";

      console.log(MESSAGES.success.compressed(sourcePath, destPath));
      console.log(
        `${styles.dim("Files:")} ${styles.highlight(result.fileCount.toString())} ${styles.dim("|")} ` +
        `${styles.dim("Original:")} ${styles.size(formatBytes(result.originalSize))} ${styles.dim("->")} ` +
        `${styles.dim("Compressed:")} ${styles.size(formatBytes(result.compressedSize))} ` +
        `${styles.dim("(")}${styles.success(ratio + "% saved")}${styles.dim(")")}`
      );
    } else {
      console.log(
        `${styles.info("Compressing")} ${styles.path(sourcePath)} ${styles.dim("using")} ${styles.highlight(algorithm)}...`
      );

      const result = await fileManager.compressFile(sourcePath, destPath, algorithm, signal);
      const ratio = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1);

      console.log(MESSAGES.success.compressed(sourcePath, destPath));
      console.log(
        `${styles.dim("Original:")} ${styles.size(formatBytes(result.originalSize))} ${styles.dim("->")} ` +
        `${styles.dim("Compressed:")} ${styles.size(formatBytes(result.compressedSize))} ` +
        `${styles.dim("(")}${styles.success(ratio + "% saved")}${styles.dim(")")}`
      );
    }
  };

  registry.register("compress", compressHandler, compressDoc);

  const decompressDoc: CommandDoc = {
    description: "Decompress a compressed file or folder archive",
    syntax: "decompress <source> <destination> [algorithm]",
    example: "decompress large.txt.gz large.txt gzip",
    details:
      `Decompresses a file or folder archive and writes the output to the destination. ` +
      `If the source is a folder archive, it will be extracted to a directory. ` +
      `If algorithm is not specified, it will be detected from the file extension. ` +
      `Supported: ${COMPRESSION_ALGORITHMS.join(", ")}.`,
    category: "compression",
  };

  const decompressHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("source path"));
    }
    if (!args[1]) {
      throw new Error(MESSAGES.errors.missingArgument("destination path"));
    }

    const sourcePath = args[0];
    const destPath = args[1];

    let algorithm: CompressionAlgorithm;
    
    if (args[2]) {
      algorithm = args[2].toLowerCase() as CompressionAlgorithm;
    } else {
      const detected = fileManager.detectCompressionAlgorithm(sourcePath);
      if (!detected) {
        throw new Error(
          `${styles.error("Cannot detect compression algorithm.")} ` +
          `Please specify: ${styles.info(COMPRESSION_ALGORITHMS.join(", "))}`
        );
      }
      algorithm = detected;
    }

    if (!COMPRESSION_ALGORITHMS.includes(algorithm)) {
      throw new Error(
        `${styles.error("Invalid algorithm.")} Supported: ${styles.info(COMPRESSION_ALGORITHMS.join(", "))}`
      );
    }

    // Check if the source is a folder archive
    const isFolderArchive = await fileManager.isFolderArchive(sourcePath, algorithm);

    if (isFolderArchive) {
      console.log(
        `${styles.info("Extracting folder archive")} ${styles.path(sourcePath)} ${styles.dim("using")} ${styles.highlight(algorithm)}...`
      );

      const result = await fileManager.decompressFolder(sourcePath, destPath, algorithm, signal);
      console.log(MESSAGES.success.decompressed(sourcePath, destPath));
      console.log(`${styles.dim("Extracted")} ${styles.highlight(result.fileCount.toString())} ${styles.dim("files")}`);
    } else {
      console.log(
        `${styles.info("Decompressing")} ${styles.path(sourcePath)} ${styles.dim("using")} ${styles.highlight(algorithm)}...`
      );

      await fileManager.decompressFile(sourcePath, destPath, algorithm, signal);
      console.log(MESSAGES.success.decompressed(sourcePath, destPath));
    }
  };

  registry.register("decompress", decompressHandler, decompressDoc);

  const brotliDoc: CommandDoc = {
    description: "Compress file or folder using Brotli algorithm",
    syntax: "brotli <source> <destination>",
    example: "brotli file.txt file.txt.br",
    details: COMPRESSION.brotli.description + " Supports both files and folders.",
    category: "compression",
  };

  const brotliHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) throw new Error(MESSAGES.errors.missingArgument("source path"));
    if (!args[1]) throw new Error(MESSAGES.errors.missingArgument("destination path"));

    const resolvedSource = resolveFilePath(args[0]);
    const isDirectory = await directoryExists(resolvedSource);

    if (isDirectory) {
      console.log(`${styles.info("Compressing folder with Brotli")} ${styles.path(args[0])}...`);
      const result = await fileManager.compressFolder(args[0], args[1], "brotli", signal);
      const ratio = result.originalSize > 0 
        ? ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)
        : "0.0";
      console.log(
        `${styles.success("Done!")} ${styles.highlight(result.fileCount.toString())} files | ` +
        `${styles.size(formatBytes(result.originalSize))} -> ` +
        `${styles.size(formatBytes(result.compressedSize))} (${styles.highlight(ratio + "% saved")})`
      );
    } else {
      console.log(`${styles.info("Compressing with Brotli")} ${styles.path(args[0])}...`);
      const result = await fileManager.compressFile(args[0], args[1], "brotli", signal);
      const ratio = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1);
      console.log(
        `${styles.success("Done!")} ${styles.size(formatBytes(result.originalSize))} -> ` +
        `${styles.size(formatBytes(result.compressedSize))} (${styles.highlight(ratio + "% saved")})`
      );
    }
  };

  registry.register("brotli", brotliHandler, brotliDoc);

  const gzipDoc: CommandDoc = {
    description: "Compress file or folder using Gzip algorithm",
    syntax: "gzip <source> <destination>",
    example: "gzip file.txt file.txt.gz",
    details: COMPRESSION.gzip.description + " Supports both files and folders.",
    category: "compression",
  };

  const gzipHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) throw new Error(MESSAGES.errors.missingArgument("source path"));
    if (!args[1]) throw new Error(MESSAGES.errors.missingArgument("destination path"));

    const resolvedSource = resolveFilePath(args[0]);
    const isDirectory = await directoryExists(resolvedSource);

    if (isDirectory) {
      console.log(`${styles.info("Compressing folder with Gzip")} ${styles.path(args[0])}...`);
      const result = await fileManager.compressFolder(args[0], args[1], "gzip", signal);
      const ratio = result.originalSize > 0 
        ? ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)
        : "0.0";
      console.log(
        `${styles.success("Done!")} ${styles.highlight(result.fileCount.toString())} files | ` +
        `${styles.size(formatBytes(result.originalSize))} -> ` +
        `${styles.size(formatBytes(result.compressedSize))} (${styles.highlight(ratio + "% saved")})`
      );
    } else {
      console.log(`${styles.info("Compressing with Gzip")} ${styles.path(args[0])}...`);
      const result = await fileManager.compressFile(args[0], args[1], "gzip", signal);
      const ratio = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1);
      console.log(
        `${styles.success("Done!")} ${styles.size(formatBytes(result.originalSize))} -> ` +
        `${styles.size(formatBytes(result.compressedSize))} (${styles.highlight(ratio + "% saved")})`
      );
    }
  };

  registry.register("gzip", gzipHandler, gzipDoc);

  const deflateDoc: CommandDoc = {
    description: "Compress file or folder using Deflate algorithm",
    syntax: "deflate <source> <destination>",
    example: "deflate file.txt file.txt.zz",
    details: COMPRESSION.deflate.description + " Supports both files and folders.",
    category: "compression",
  };

  const deflateHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) throw new Error(MESSAGES.errors.missingArgument("source path"));
    if (!args[1]) throw new Error(MESSAGES.errors.missingArgument("destination path"));

    const resolvedSource = resolveFilePath(args[0]);
    const isDirectory = await directoryExists(resolvedSource);

    if (isDirectory) {
      console.log(`${styles.info("Compressing folder with Deflate")} ${styles.path(args[0])}...`);
      const result = await fileManager.compressFolder(args[0], args[1], "deflate", signal);
      const ratio = result.originalSize > 0 
        ? ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)
        : "0.0";
      console.log(
        `${styles.success("Done!")} ${styles.highlight(result.fileCount.toString())} files | ` +
        `${styles.size(formatBytes(result.originalSize))} -> ` +
        `${styles.size(formatBytes(result.compressedSize))} (${styles.highlight(ratio + "% saved")})`
      );
    } else {
      console.log(`${styles.info("Compressing with Deflate")} ${styles.path(args[0])}...`);
      const result = await fileManager.compressFile(args[0], args[1], "deflate", signal);
      const ratio = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1);
      console.log(
        `${styles.success("Done!")} ${styles.size(formatBytes(result.originalSize))} -> ` +
        `${styles.size(formatBytes(result.compressedSize))} (${styles.highlight(ratio + "% saved")})`
      );
    }
  };

  registry.register("deflate", deflateHandler, deflateDoc);

  const gunzipDoc: CommandDoc = {
    description: "Decompress a Gzip file or folder archive",
    syntax: "gunzip <source> <destination>",
    example: "gunzip file.txt.gz file.txt",
    details: "Decompresses a Gzip-compressed file or folder archive (.gz extension).",
    category: "compression",
  };

  const gunzipHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) throw new Error(MESSAGES.errors.missingArgument("source path"));
    if (!args[1]) throw new Error(MESSAGES.errors.missingArgument("destination path"));

    const isFolderArchive = await fileManager.isFolderArchive(args[0], "gzip");

    if (isFolderArchive) {
      console.log(`${styles.info("Extracting Gzip folder archive")} ${styles.path(args[0])}...`);
      const result = await fileManager.decompressFolder(args[0], args[1], "gzip", signal);
      console.log(MESSAGES.success.decompressed(args[0], args[1]));
      console.log(`${styles.dim("Extracted")} ${styles.highlight(result.fileCount.toString())} ${styles.dim("files")}`);
    } else {
      console.log(`${styles.info("Decompressing Gzip")} ${styles.path(args[0])}...`);
      await fileManager.decompressFile(args[0], args[1], "gzip", signal);
      console.log(MESSAGES.success.decompressed(args[0], args[1]));
    }
  };

  registry.register("gunzip", gunzipHandler, gunzipDoc);

  const unbrotliDoc: CommandDoc = {
    description: "Decompress a Brotli file or folder archive",
    syntax: "unbrotli <source> <destination>",
    example: "unbrotli file.txt.br file.txt",
    details: "Decompresses a Brotli-compressed file or folder archive (.br extension).",
    category: "compression",
  };

  const unbrotliHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) throw new Error(MESSAGES.errors.missingArgument("source path"));
    if (!args[1]) throw new Error(MESSAGES.errors.missingArgument("destination path"));

    const isFolderArchive = await fileManager.isFolderArchive(args[0], "brotli");

    if (isFolderArchive) {
      console.log(`${styles.info("Extracting Brotli folder archive")} ${styles.path(args[0])}...`);
      const result = await fileManager.decompressFolder(args[0], args[1], "brotli", signal);
      console.log(MESSAGES.success.decompressed(args[0], args[1]));
      console.log(`${styles.dim("Extracted")} ${styles.highlight(result.fileCount.toString())} ${styles.dim("files")}`);
    } else {
      console.log(`${styles.info("Decompressing Brotli")} ${styles.path(args[0])}...`);
      await fileManager.decompressFile(args[0], args[1], "brotli", signal);
      console.log(MESSAGES.success.decompressed(args[0], args[1]));
    }
  };

  registry.register("unbrotli", unbrotliHandler, unbrotliDoc);

  const inflateDoc: CommandDoc = {
    description: "Decompress a Deflate file or folder archive",
    syntax: "inflate <source> <destination>",
    example: "inflate file.txt.zz file.txt",
    details: "Decompresses a Deflate-compressed file or folder archive (.zz extension).",
    category: "compression",
  };

  const inflateHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) throw new Error(MESSAGES.errors.missingArgument("source path"));
    if (!args[1]) throw new Error(MESSAGES.errors.missingArgument("destination path"));

    const isFolderArchive = await fileManager.isFolderArchive(args[0], "deflate");

    if (isFolderArchive) {
      console.log(`${styles.info("Extracting Deflate folder archive")} ${styles.path(args[0])}...`);
      const result = await fileManager.decompressFolder(args[0], args[1], "deflate", signal);
      console.log(MESSAGES.success.decompressed(args[0], args[1]));
      console.log(`${styles.dim("Extracted")} ${styles.highlight(result.fileCount.toString())} ${styles.dim("files")}`);
    } else {
      console.log(`${styles.info("Decompressing Deflate")} ${styles.path(args[0])}...`);
      await fileManager.decompressFile(args[0], args[1], "deflate", signal);
      console.log(MESSAGES.success.decompressed(args[0], args[1]));
    }
  };

  registry.register("inflate", inflateHandler, inflateDoc);
};

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

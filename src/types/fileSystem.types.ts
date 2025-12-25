export interface DirectoryEntry {
  name: string;
  type: "file" | "directory";
  size: string;
  modified: string;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isFile: boolean;
  isDirectory: boolean;
  created: Date;
  modified: Date;
  permissions: string;
}

export interface SearchResult {
  path: string;
  name: string;
  type: "file" | "directory";
  matches?: GrepMatch[];
}

export interface GrepMatch {
  line: number;
  content: string;
  column?: number;
}

export interface FileOperationOptions {
  overwrite?: boolean;
  recursive?: boolean;
  force?: boolean;
}

export interface OperationResult {
  success: boolean;
  source: string;
  destination: string;
  error?: string;
}

export type CompressionAlgorithmType = "brotli" | "gzip" | "deflate";

export interface CompressionOptions {
  level?: number;
  algorithm?: CompressionAlgorithmType;
}

export interface CompressionResult {
  success: boolean;
  algorithm: CompressionAlgorithmType;
  sourcePath: string;
  destPath: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

export interface HashResult {
  algorithm: string;
  hash: string;
  filePath: string;
}

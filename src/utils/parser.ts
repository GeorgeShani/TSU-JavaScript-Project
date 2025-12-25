import type { ParsedCommand } from "../types/index.js";

// Parse command string while preserving quoted strings as single arguments
export const parseCommandWithQuotes = (input: string): ParsedCommand => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let quoteChar = "";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const prevChar = i > 0 ? input[i - 1] : "";

    // Handle quote characters (both single and double)
    if ((char === '"' || char === "'") && prevChar !== "\\") {
      if (!inQuotes) {
        // Start of quoted section
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        // End of quoted section (matching quote)
        inQuotes = false;
        quoteChar = "";
      } else {
        // Different quote inside quotes, treat as regular char
        current += char;
      }
      continue;
    }

    // Space outside quotes = argument separator
    if (char === " " && !inQuotes) {
      if (current.length > 0) {
        result.push(current);
        current = "";
      }
      continue;
    }

    // Handle escape sequences (\" \' \\)
    if (char === "\\" && i + 1 < input.length) {
      const nextChar = input[i + 1];
      if (nextChar === '"' || nextChar === "'" || nextChar === "\\") {
        current += nextChar;
        i++; // Skip next char since we handled it
        continue;
      }
    }

    current += char;
  }

  // Don't forget the last argument
  if (current.length > 0) {
    result.push(current);
  }

  return {
    command: result[0] || "",
    args: result.slice(1),
  };
};

export const tokenize = (input: string): string[] => {
  const parsed = parseCommandWithQuotes(input);
  return [parsed.command, ...parsed.args].filter((s) => s.length > 0);
};

export const isFlag = (str: string): boolean => {
  return str.startsWith("-") && str.length > 1;
};

// Parse --flag=value and -f value style arguments
export const parseFlags = (
  args: string[]
): { flags: Map<string, string | boolean>; remaining: string[] } => {
  const flags = new Map<string, string | boolean>();
  const remaining: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      // Long flag: --name or --name=value
      const withoutPrefix = arg.slice(2);
      if (withoutPrefix.includes("=")) {
        const [key, value] = withoutPrefix.split("=");
        flags.set(key, value);
      } else {
        flags.set(withoutPrefix, true);
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      // Short flag: -n or -n value
      const flagName = arg.slice(1);
      const nextArg = args[i + 1];

      // Check if next arg is the flag's value
      if (nextArg && !nextArg.startsWith("-")) {
        flags.set(flagName, nextArg);
        i++; // Skip next since we consumed it
      } else {
        flags.set(flagName, true);
      }
    } else {
      remaining.push(arg);
    }
  }

  return { flags, remaining };
};

// Escape special characters for safe display
export const escapeString = (str: string): string => {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
};

// Collapse multiple whitespace into single space
export const normalizeWhitespace = (str: string): string => {
  return str.trim().replace(/\s+/g, " ");
};

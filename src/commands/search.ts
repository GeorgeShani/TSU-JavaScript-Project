import type { CommandDoc } from "../types/index.js";
import type { FileManager } from "../cli/FileManager.js";
import type { CommandRegistry } from "../cli/CommandRegistry.js";
import { MESSAGES, styles } from "../constants/index.js";

export const registerSearchCommands = (
  registry: CommandRegistry,
  fileManager: FileManager
): void => {
  const findDoc: CommandDoc = {
    description: "Find files by name pattern",
    syntax: "find <pattern> [path]",
    example: "find *.txt",
    details:
      "Searches for files and directories matching the given pattern. " +
      "Supports wildcards: * (any characters), ? (single character). " +
      "If no path is specified, searches from the current directory.",
    category: "search",
  };

  const findHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("pattern"));
    }

    const pattern = args[0];
    const searchPath = args[1];

    console.log(MESSAGES.info.searching(pattern));
    const results = await fileManager.findFiles(pattern, searchPath, signal);

    if (results.length === 0) {
      console.log(MESSAGES.info.noMatches);
      return;
    }

    console.log(
      `\n${styles.success("Found")} ${styles.highlight(results.length.toString())} ${styles.success("match(es):")}\n`
    );

    const directories = results.filter((r) => r.type === "directory");
    const files = results.filter((r) => r.type === "file");

    if (directories.length > 0) {
      console.log(styles.subheader("Directories:"));
      directories.forEach((dir) => {
        console.log(`  ${styles.dirType("[DIR]")}  ${styles.directory(dir.path)}`);
      });
      console.log();
    }

    if (files.length > 0) {
      console.log(styles.subheader("Files:"));
      files.forEach((file) => {
        console.log(`  ${styles.fileType("[FILE]")} ${styles.path(file.path)}`);
      });
    }
  };

  registry.register("find", findHandler, findDoc);
  registry.registerAlias("search", "find");

  const grepDoc: CommandDoc = {
    description: "Search for text within files",
    syntax: "grep <pattern> <path>",
    example: "grep TODO ./src",
    details:
      "Searches for text matching the given pattern within files. " +
      "If path is a directory, searches recursively. " +
      "The pattern is treated as a regular expression.",
    category: "search",
  };

  const grepHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("search pattern"));
    }
    if (!args[1]) {
      throw new Error(MESSAGES.errors.missingArgument("path"));
    }

    const pattern = args[0];
    const searchPath = args[1];

    console.log(
      `${styles.info("Searching for")} ${styles.highlight(`"${pattern}"`)} ${styles.info("in")} ${styles.path(searchPath)}...`
    );
    const results = await fileManager.grep(pattern, searchPath, signal);

    if (results.length === 0) {
      console.log(MESSAGES.info.noMatches);
      return;
    }

    const totalMatches = results.reduce(
      (sum, r) => sum + (r.matches?.length ?? 0),
      0
    );

    console.log(
      `\n${styles.success("Found")} ${styles.highlight(totalMatches.toString())} ${styles.success("match(es) in")} ${styles.highlight(results.length.toString())} ${styles.success("file(s):")}\n`
    );

    for (const result of results) {
      console.log(`\n${styles.path(result.path)}:`);

      if (result.matches) {
        for (const match of result.matches) {
          const content =
            match.content.length > 80
              ? match.content.substring(0, 77) + "..."
              : match.content;

          const highlightedContent = content.replace(
            new RegExp(pattern, "gi"),
            (match) => styles.highlight(match)
          );

          console.log(
            `  ${styles.dim("Line")} ${styles.warning(match.line.toString())}: ${highlightedContent}`
          );
        }
      }
    }
  };

  registry.register("grep", grepHandler, grepDoc);

  const whereDoc: CommandDoc = {
    description: "Find files containing specific text",
    syntax: "where <text>",
    example: "where function",
    details:
      "Searches the current directory recursively for files " +
      "containing the specified text. Simpler alternative to grep.",
    category: "search",
  };

  const whereHandler = async (args: string[], signal?: AbortSignal): Promise<void> => {
    if (!args[0]) {
      throw new Error(MESSAGES.errors.missingArgument("search text"));
    }

    console.log(MESSAGES.info.searching(args[0]));

    const results = await fileManager.grep(args[0], ".", signal);

    if (results.length === 0) {
      console.log(
        `${MESSAGES.info.noMatches} ${styles.dim(`(searched for "${args[0]}")`)}`
      );
      return;
    }

    console.log(
      `\n${styles.success("Files containing")} ${styles.highlight(`"${args[0]}"`)}:\n`
    );

    for (const result of results) {
      const matchCount = result.matches?.length ?? 0;
      const matchText = matchCount !== 1 ? "matches" : "match";
      console.log(
        `  ${styles.path(result.path)} ${styles.dim(`(${styles.highlight(matchCount.toString())} ${matchText})`)}`
      );
    }
  };

  registry.register("where", whereHandler, whereDoc);
};

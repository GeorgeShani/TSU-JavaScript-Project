import type { CommandDoc } from "../types/index.js";
import type { CommandRegistry } from "../cli/CommandRegistry.js";
import { styles, APP_NAME, APP_VERSION } from "../constants/index.js";

export const registerHelpCommands = (registry: CommandRegistry): void => {
  const manDoc: CommandDoc = {
    description: "Display the help manual",
    syntax: "man [command]",
    example: "man cp",
    details:
      "Without arguments, lists all available commands. " +
      "Provide a command name to get detailed help on it.",
    category: "utility",
  };

  const manHandler = (args: string[]): void => {
    const commandName = args[0];

    if (commandName && commandName !== "man") {
      const command = registry.get(commandName);

      if (command) {
        const aliases = registry.getAliasesForCommand(command.name);
        
        console.log();
        console.log(styles.header("=== Command Manual ==="));
        console.log(`${styles.bold("Command:")}     ${styles.command(command.name)}`);
        console.log(`${styles.bold("Description:")} ${command.doc.description}`);
        console.log(`${styles.bold("Syntax:")}      ${styles.info(command.doc.syntax)}`);
        console.log(`${styles.bold("Example:")}     ${styles.dim(command.doc.example)}`);
        if (aliases.length > 0) {
          console.log(`${styles.bold("Aliases:")}     ${styles.highlight(aliases.join(", "))}`);
        }
        console.log(`${styles.bold("Details:")}     ${command.doc.details}`);
        console.log(styles.header("====================="));
        console.log();
      } else {
        console.log(styles.warning(`No manual entry for '${commandName}'`));
        console.log(`Type ${styles.command("'man'")} to see all available commands.`);
      }
    } else {
      displayAllCommands(registry);
    }
  };

  registry.register("man", manHandler, manDoc);
  registry.registerAlias("help", "man");
  registry.registerAlias("?", "man");

  const clearDoc: CommandDoc = {
    description: "Clear the terminal screen",
    syntax: "clear",
    example: "clear",
    details:
      "Clears all output from the terminal and resets the prompt position. " +
      "You can also use Ctrl + L as a shortcut.",
    category: "utility",
  };

  const clearHandler = (): void => {
    console.clear();
  };

  registry.register("clear", clearHandler, clearDoc);
  registry.registerAlias("cls", "clear");

  const versionDoc: CommandDoc = {
    description: "Display application version",
    syntax: "version",
    example: "version",
    details: "Shows the current version of the File Manager CLI.",
    category: "utility",
  };

  const versionHandler = (): void => {
    console.log();
    console.log(`${styles.bold(APP_NAME)} ${styles.info(`v${APP_VERSION}`)}`);
    console.log(styles.dim("Built with TypeScript and Node.js"));
    console.log();
  };

  registry.register("version", versionHandler, versionDoc);
  registry.registerAlias("ver", "version");
  registry.registerAlias("-v", "version");
  registry.registerAlias("--version", "version");
};

function displayAllCommands(registry: CommandRegistry): void {
  const categories = registry.getAllCommandsByCategory();

  console.log();
  console.log(styles.header("=== File Manager Commands ==="));

  const categoryDisplayNames: Record<string, string> = {
    navigation: "Navigation",
    "file-operations": "File Operations",
    search: "Search",
    "os-info": "OS Information",
    hash: "Hash",
    compression: "Compression",
    utility: "Utility",
  };

  for (const [category, displayName] of Object.entries(categoryDisplayNames)) {
    const commands = categories[category as keyof typeof categories];

    if (commands && commands.length > 0) {
      console.log();
      console.log(styles.subheader(`-- ${displayName} --`));

      for (const command of commands) {
        const syntax = styles.command(command.doc.syntax.padEnd(32));
        const description = styles.dim(command.doc.description);
        console.log(`${syntax} ${description}`);
      }
    }
  }

  console.log();
  console.log(
    `${styles.info("Tip:")} Type ${styles.command("'man <command>'")} for detailed help on a specific command.`
  );
  console.log(styles.header("=============================="));
  console.log();
}

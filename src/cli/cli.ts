import readline from "readline";
import inquirer from "inquirer";

import { FileManager } from "./FileManager.js";
import { CommandRegistry } from "./CommandRegistry.js";
import { parseCommandWithQuotes } from "../utils/parser.js";
import { printCurrentDir } from "../utils/index.js";
import { MESSAGES, PROMPT_CHAR, styles, APP_NAME, APP_VERSION } from "../constants/index.js";

import {
  registerNavigationCommands,
  registerFileOperationCommands,
  registerSearchCommands,
  registerOSInfoCommands,
  registerHashCommands,
  registerCompressionCommands,
  registerHelpCommands,
} from "../commands/index.js";

export class CLI {
  private fileManager: FileManager;
  private registry: CommandRegistry;
  private rl: readline.Interface | null = null;
  private isRunning: boolean = false;
  private isPrompting: boolean = false;

  constructor(username: string = "Anonymous") {
    this.fileManager = new FileManager(username);
    this.registry = new CommandRegistry();
    this.registerAllCommands();
  }

  private registerAllCommands(): void {
    registerNavigationCommands(this.registry, this.fileManager);
    registerFileOperationCommands(this.registry, this.fileManager);
    registerSearchCommands(this.registry, this.fileManager);
    registerOSInfoCommands(this.registry, this.fileManager);
    registerHashCommands(this.registry, this.fileManager);
    registerCompressionCommands(this.registry, this.fileManager);
    registerHelpCommands(this.registry);
    this.registerExitCommand();
  }

  private registerExitCommand(): void {
    const exitHandler = (): void => {
      this.exit();
    };

    this.registry.register(
      ".exit",
      exitHandler,
      {
        description: "Exit the File Manager",
        syntax: ".exit",
        example: ".exit",
        details:
          "Safely closes the File Manager session and displays a farewell message.",
        category: "utility",
      }
    );

    this.registry.registerAlias("exit", ".exit");
    this.registry.registerAlias("quit", ".exit");
    this.registry.registerAlias("q", ".exit");
  }

  private displayBanner(): void {
    const banner = `
${styles.header("======================================")}
${styles.header("           " + APP_NAME + "           ")}
${styles.header("======================================")}
${styles.dim("Version:")} ${styles.info(APP_VERSION)}
${styles.dim("Type")} ${styles.command("'man'")} ${styles.dim("for help,")} ${styles.command("'.exit'")} ${styles.dim("to quit")}
`;
    console.log(banner);
  }

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Create readline interface for reading user input line by line
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: PROMPT_CHAR,
    });

    console.clear();
    this.displayBanner();
    console.log(MESSAGES.welcome(this.fileManager.username));
    printCurrentDir();

    this.setupEventHandlers();
    this.rl.prompt();
  }

  private setupEventHandlers(): void {
    this.setupReadlineHandlers();
    this.setupKeyboardShortcuts();
  }

  private setupReadlineHandlers(): void {
    if (!this.rl) return;

    // Handle each line of user input
    this.rl.on("line", async (input: string) => {
      // Ignore input while confirmation prompt is active
      if (this.isPrompting) {
        return;
      }
      await this.handleInput(input.trim());
      if (!this.isPrompting) {
        this.showPrompt();
      }
    });

    // Handle Ctrl+C to exit gracefully
    this.rl.on("SIGINT", () => {
      this.exit();
    });

    // Update state when readline closes (only if not prompting)
    this.rl.on("close", () => {
      if (!this.isPrompting) {
        this.isRunning = false;
      }
    });
  }

  private setupKeyboardShortcuts(): void {
    // Enable raw mode for detecting special key combinations
    if (process.stdin.isTTY && !process.stdin.isRaw) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      
      // Handle Ctrl+L to clear screen
      process.stdin.on("keypress", (_chunk: string, key: readline.Key) => {
        if (key && key.ctrl && key.name === "l" && !this.isPrompting) {
          console.clear();
          printCurrentDir();
          this.rl?.prompt();
        }
      });
    }
  }

  private async handleInput(input: string): Promise<void> {
    if (!input) {
      return;
    }

    if (input === ".exit") {
      this.exit();
      return;
    }

    try {
      // Parse input into command and arguments, respecting quoted strings
      const { command, args } = parseCommandWithQuotes(input);

      if (!command) {
        throw new Error(MESSAGES.errors.emptyCommand);
      }

      if (!this.registry.has(command)) {
        throw new Error(MESSAGES.errors.invalidCommand);
      }

      // Prompt for confirmation on destructive commands (e.g., rm, rmdir)
      if (this.registry.requiresConfirmation(command)) {
        const confirmed = await this.confirmAction(
          `Are you sure you want to execute ${styles.command(`"${command}"`)}?`
        );
        
        if (!confirmed) {
          console.log(MESSAGES.info.operationCancelled);
          return;
        }
      }

      await this.registry.execute(command, args);
    } catch (error) {
      this.handleError(error);
    }
  }

  private async confirmAction(message: string): Promise<boolean> {
    this.isPrompting = true;
    
    // Close readline completely to avoid input conflicts with inquirer
    this.rl?.close();
    this.rl = null;

    try {
      const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
        {
          type: "confirm",
          name: "confirmed",
          message,
          default: false,
        },
      ]);

      return confirmed;
    } finally {
      // Recreate readline interface after inquirer completes
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: PROMPT_CHAR,
      });
      
      // Re-setup only readline handlers (keyboard shortcuts are already set up)
      this.setupReadlineHandlers();
      
      this.isPrompting = false;
    }
  }

  private handleError(error: unknown): void {
    if (error instanceof Error) {
      console.error(`${styles.error("Error:")} ${error.message}`);
    } else {
      console.error(styles.error("An unknown error occurred."));
    }
  }

  private showPrompt(): void {
    printCurrentDir();
    this.rl?.prompt();
  }

  exit(): void {
    console.log("\n" + MESSAGES.farewell(this.fileManager.username));
    this.rl?.close();
    this.isRunning = false;
    process.exit(0);
  }

  getFileManager(): FileManager {
    return this.fileManager;
  }

  getRegistry(): CommandRegistry {
    return this.registry;
  }
}

export const setupCLI = (username: string): CLI => {
  const cli = new CLI(username);
  cli.start();
  return cli;
};

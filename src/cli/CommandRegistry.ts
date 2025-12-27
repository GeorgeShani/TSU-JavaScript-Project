import type {
  Command,
  CommandHandler,
  CommandDoc,
  CommandCategory,
} from "../types/index.js";

export class CommandRegistry {
  private commands: Map<string, Command>;
  private aliases: Map<string, string>;

  constructor() {
    this.commands = new Map<string, Command>();
    this.aliases = new Map<string, string>();
  }

  register(
    name: string,
    handler: CommandHandler,
    doc: CommandDoc,
    requiresConfirmation: boolean = false
  ): void {
    const command: Command = {
      name,
      handler,
      doc,
      requiresConfirmation,
    };

    this.commands.set(name, command);
  }

  registerAlias(alias: string, commandName: string): void {
    if (!this.commands.has(commandName)) {
      throw new Error(`Cannot create alias for non-existent command: ${commandName}`);
    }
    this.aliases.set(alias, commandName);
  }

  get(name: string): Command | undefined {
    // Resolve alias to actual command name if it exists
    const actualName = this.aliases.get(name) ?? name;
    return this.commands.get(actualName);
  }

  has(name: string): boolean {
    const actualName = this.aliases.get(name) ?? name;
    return this.commands.has(actualName);
  }

  async execute(name: string, args: string[], signal?: AbortSignal): Promise<void> {
    const command = this.get(name);

    if (!command) {
      throw new Error(`Unknown command: ${name}`);
    }

    await command.handler(args, signal);
  }

  requiresConfirmation(name: string): boolean {
    const command = this.get(name);
    return command?.requiresConfirmation ?? false;
  }

  getCommandNames(): string[] {
    return Array.from(this.commands.keys());
  }

  getAliases(): Map<string, string> {
    return new Map(this.aliases);
  }

  // Find all aliases that point to a specific command
  getAliasesForCommand(commandName: string): string[] {
    const aliases: string[] = [];
    this.aliases.forEach((target, alias) => {
      if (target === commandName) {
        aliases.push(alias);
      }
    });
    return aliases;
  }

  getCommandsByCategory(category: CommandCategory): Command[] {
    const commands: Command[] = [];

    this.commands.forEach((command) => {
      if (command.doc.category === category) {
        commands.push(command);
      }
    });

    return commands;
  }

  getAllCommandsByCategory(): Record<CommandCategory, Command[]> {
    const categories: Record<CommandCategory, Command[]> = {
      navigation: [],
      "file-operations": [],
      search: [],
      "os-info": [],
      hash: [],
      compression: [],
      utility: [],
    };

    this.commands.forEach((command) => {
      categories[command.doc.category].push(command);
    });

    return categories;
  }

  getDoc(name: string): CommandDoc | undefined {
    return this.get(name)?.doc;
  }

  get size(): number {
    return this.commands.size;
  }

  clear(): void {
    this.commands.clear();
    this.aliases.clear();
  }

  toArray(): Command[] {
    return Array.from(this.commands.values());
  }

  // Generator function to make CommandRegistry iterable
  *[Symbol.iterator](): Iterator<Command> {
    yield* this.commands.values();
  }

  generateHelpText(): string {
    const categories = this.getAllCommandsByCategory();
    let helpText = "\n=== File Manager Commands ===\n";

    const categoryNames: Record<CommandCategory, string> = {
      navigation: "Navigation",
      "file-operations": "File Operations",
      search: "Search",
      "os-info": "OS Information",
      hash: "Hash",
      compression: "Compression",
      utility: "Utility",
    };

    for (const [category, displayName] of Object.entries(categoryNames)) {
      const commands = categories[category as CommandCategory];
      
      if (commands.length > 0) {
        helpText += `\n-- ${displayName} --\n`;
        
        for (const command of commands) {
          const paddedName = command.doc.syntax.padEnd(30);
          helpText += `${paddedName} - ${command.doc.description}\n`;
        }
      }
    }

    helpText += "\nType 'man <command>' for detailed help on a specific command.\n";
    return helpText;
  }

  generateCommandHelp(name: string): string | null {
    const command = this.get(name);

    if (!command) {
      return null;
    }

    const { doc } = command;

    return `
=== Command Manual ===
Command: ${command.name}
Description: ${doc.description}
Syntax: ${doc.syntax}
Example: ${doc.example}
Details: ${doc.details}
=====================
`;
  }
}

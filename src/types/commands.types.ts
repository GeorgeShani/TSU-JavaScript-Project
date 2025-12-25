export type CommandHandler = (args: string[]) => Promise<void> | void;

export interface CommandDoc {
  description: string;
  syntax: string;
  example: string;
  details: string;
  category: CommandCategory;
}

export type CommandCategory =
  | "navigation"
  | "file-operations"
  | "search"
  | "os-info"
  | "hash"
  | "compression"
  | "utility";

export interface Command {
  name: string;
  handler: CommandHandler;
  doc: CommandDoc;
  requiresConfirmation?: boolean;
}

export interface ParsedCommand {
  command: string;
  args: string[];
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

export type OSInfoFlag =
  | "--EOL"
  | "--cpus"
  | "--homedir"
  | "--username"
  | "--architecture"
  | "--platform"
  | "--memory";

export interface CPUInfo {
  model: string;
  speed: number;
  index: number;
}

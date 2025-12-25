import { parseArgs } from "../utils/args.js";
import { setupCLI } from "./cli.js";

const initFileManager = (): void => {
  const { username } = parseArgs();
  setupCLI(username);
};

initFileManager();

export { initFileManager };

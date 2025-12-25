import { styles } from "../constants/index.js";

export * from "./args.js";
export * from "./path.js";
export * from "./validation.js";
export * from "./parser.js";

export const printCurrentDir = (): void => {
  console.log(
    `\n${styles.info("Current Directory:")} ${styles.path(process.cwd())}`
  );
};

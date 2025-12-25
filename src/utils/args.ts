export interface ParsedArgs {
  username: string;
  flags: Map<string, string | boolean>;
}

export const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2);

  const result: ParsedArgs = {
    username: "Anonymous",
    flags: new Map<string, string | boolean>(),
  };

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const withoutPrefix = arg.slice(2);

      if (withoutPrefix.includes("=")) {
        const [key, value] = withoutPrefix.split("=");
        
        if (key === "username") {
          result.username = value || "Anonymous";
        } else {
          result.flags.set(key, value);
        }
      } else {
        result.flags.set(withoutPrefix, true);
      }
    }
  }

  return result;
};

export const getArgValue = (argName: string): string | undefined => {
  const args = process.argv.slice(2);
  const arg = args.find((a) => a.startsWith(`--${argName}=`));
  return arg?.split("=")[1];
};

export const hasFlag = (flagName: string): boolean => {
  const args = process.argv.slice(2);
  return args.some(
    (a) => a === `--${flagName}` || a.startsWith(`--${flagName}=`)
  );
};

/**
 * Mock implementation of chalk for Jest tests.
 * Chalk is ESM-only, so we need this CommonJS-compatible mock.
 * All style functions simply return the input string unchanged.
 */

type ChalkFunction = (text: string) => string;

interface ChalkStyle extends ChalkFunction {
  bold: ChalkStyle;
  dim: ChalkStyle;
  italic: ChalkStyle;
  underline: ChalkStyle;
  inverse: ChalkStyle;
  hidden: ChalkStyle;
  strikethrough: ChalkStyle;
  visible: ChalkStyle;
  reset: ChalkStyle;
  // Colors
  black: ChalkStyle;
  red: ChalkStyle;
  green: ChalkStyle;
  yellow: ChalkStyle;
  blue: ChalkStyle;
  magenta: ChalkStyle;
  cyan: ChalkStyle;
  white: ChalkStyle;
  gray: ChalkStyle;
  grey: ChalkStyle;
  // Bright colors
  blackBright: ChalkStyle;
  redBright: ChalkStyle;
  greenBright: ChalkStyle;
  yellowBright: ChalkStyle;
  blueBright: ChalkStyle;
  magentaBright: ChalkStyle;
  cyanBright: ChalkStyle;
  whiteBright: ChalkStyle;
  // Background colors
  bgBlack: ChalkStyle;
  bgRed: ChalkStyle;
  bgGreen: ChalkStyle;
  bgYellow: ChalkStyle;
  bgBlue: ChalkStyle;
  bgMagenta: ChalkStyle;
  bgCyan: ChalkStyle;
  bgWhite: ChalkStyle;
  // Bright background colors
  bgBlackBright: ChalkStyle;
  bgRedBright: ChalkStyle;
  bgGreenBright: ChalkStyle;
  bgYellowBright: ChalkStyle;
  bgBlueBright: ChalkStyle;
  bgMagentaBright: ChalkStyle;
  bgCyanBright: ChalkStyle;
  bgWhiteBright: ChalkStyle;
}

const createChalkStyle = (): ChalkStyle => {
  const fn = ((text: string) => text) as ChalkStyle;

  const styleNames: (keyof ChalkStyle)[] = [
    "bold", "dim", "italic", "underline", "inverse", "hidden", "strikethrough", "visible", "reset",
    "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white", "gray", "grey",
    "blackBright", "redBright", "greenBright", "yellowBright", "blueBright", "magentaBright", "cyanBright", "whiteBright",
    "bgBlack", "bgRed", "bgGreen", "bgYellow", "bgBlue", "bgMagenta", "bgCyan", "bgWhite",
    "bgBlackBright", "bgRedBright", "bgGreenBright", "bgYellowBright", "bgBlueBright", "bgMagentaBright", "bgCyanBright", "bgWhiteBright",
  ];

  // Use a proxy to allow infinite chaining (e.g., chalk.red.bold.underline)
  const handler: ProxyHandler<ChalkStyle> = {
    get(_target, prop: string) {
      if (styleNames.includes(prop as keyof ChalkStyle)) {
        return createChalkStyle();
      }
      return undefined;
    },
    apply(_target, _thisArg, args: [string]) {
      return args[0];
    },
  };

  return new Proxy(fn, handler);
};

const chalk = createChalkStyle();

export default chalk;

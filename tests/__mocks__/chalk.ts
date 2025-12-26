/**
 * Chalk mock for Jest tests
 * Returns the input string unchanged (no styling in tests)
 */

// Interface for a chainable chalk-like function (interfaces allow circular references)
interface ChalkStyleFn {
  (str: string): string;
  [key: string]: ChalkStyleFn;
}

// Create a chainable mock that returns the input as-is
const createChainableStyle = (): ChalkStyleFn => {
  const handler: ProxyHandler<ChalkStyleFn> = {
    get: (_target, prop: string | symbol) => {
      if (prop === "toString" || prop === "valueOf") {
        return () => "";
      }
      // Return a function that returns the input unchanged
      const fn = (str: string) => str;
      // Make it chainable
      return new Proxy(fn as ChalkStyleFn, handler);
    },
    apply: (_target, _thisArg, args: unknown[]) => {
      return args[0];
    },
  };

  const baseFn = (str: string): string => str;
  return new Proxy(baseFn as ChalkStyleFn, handler);
};

// Create the mock chalk object
const chalk = createChainableStyle();

// Export as default and named
export default chalk;
export { chalk };

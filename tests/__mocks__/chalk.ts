/**
 * Chalk mock for Jest tests
 * Returns the input string unchanged (no styling in tests)
 */

// Create a chainable mock that returns the input as-is
const createChainableStyle = (): any => {
  const handler = {
    get: (_target: any, prop: string) => {
      if (prop === "toString" || prop === "valueOf") {
        return () => "";
      }
      // Return a function that returns the input unchanged
      const fn = (str: string) => str;
      // Make it chainable
      return new Proxy(fn, handler);
    },
    apply: (_target: any, _thisArg: any, args: any[]) => {
      return args[0];
    },
  };

  return new Proxy(((str: string) => str) as any, handler);
};

// Create the mock chalk object
const chalk = createChainableStyle();

// Export as default and named
export default chalk;
export { chalk };

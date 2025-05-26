const shouldLogDebug = Boolean(process.env.JEST_TEST_CLEAN_DB_DEBUG);

export const consoleDebug = (msg: string) => {
  if (shouldLogDebug) {
    console.debug(`jest-test-clean-db: ${msg}`);
  }
};

export function takeFirstCharacters(str: string, numChars: number) {
  return str.substring(0, numChars);
}

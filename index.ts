import { DataSource } from "typeorm";
import { Config, IDataSource_Options } from "./config";
import { getMainDataSource, MainDataSource } from "./mainDataSource_singleton";
import { takeFirstCharacters } from './utils';

declare global {
  var mainDataSource: MainDataSource | undefined;
}

/**
 * initializing package with config options
 * @param dataSource_Options 
 */
export function initialize(dataSource_Options:IDataSource_Options ) {
  Config.getInstance().initialize(dataSource_Options);
}

const MAX_TEST_NAME_LENGTH = 40;
const uniqueTestNames: Array<string> = [];

/**
 * Wraps a user function with validation and DB setup/teardown logic.
 * This function runs in the global environment, and not in the test's environment/virtual machine.
 *
 * @param {string} testName - The name of the test.
 * @param {(dbData: { dbNameForThisTest: string; dbDataSource: DataSource }) => void} userFn - The user function to be wrapped.
 * @return {Promise<void>} - A promise that resolves when the wrapped function completes successfully, or rejects with an error if the wrapped function throws an error.
 * @throws {Error} - If the test name exceeds the maximum allowed length or if the test name is not unique in the project.
 */
const unwrap = (testName: string, userFn: (dbData: { dbNameForThisTest: string; dbDataSource: DataSource }) => Promise<void> | void) => {
  /**
   * Validation of the test name
   */
  const describeBlockName = expect.getState().currentDescribeBlock || '';

  const shortenedTestName = takeFirstCharacters(testName, MAX_TEST_NAME_LENGTH);
  if (uniqueTestNames.includes(shortenedTestName)) {
    const _describeBlockPrefix = describeBlockName ? `${describeBlockName} > ` : ``;
    const _errMsgPostfix =
      MAX_TEST_NAME_LENGTH < testName.length
        ? `\nThe full test name is ${testName}, and you need to make its first ${MAX_TEST_NAME_LENGTH} characters unique`
        : '';
    throw new Error(
      `Test name (${_describeBlockPrefix}${shortenedTestName}) is not unique in this project.\n` +
      `This might cause it to use the same DB of another test.${_errMsgPostfix}`
    );
  } else {
    uniqueTestNames.push(testName);
  }

  const underlyingFunctionToReturn = async () => {
    /**
     * The `initDB` function must be called here, because this is the first place that is "per-test" inside of the `test_withCleanDB` function
     */
    const mainDataSource = getMainDataSource();

    const { dbNameForThisTest, dbForThisTest } = await mainDataSource.createTestDb_fromTemplateDB(testName);

    let resultOfTheUnderlyingWrappedFunction: void = undefined;
    let errorFromTestFn: Error | null = null;
    try {
      resultOfTheUnderlyingWrappedFunction = await userFn({ dbNameForThisTest, dbDataSource: dbForThisTest });
    } catch (_errFromTestFn) {
      errorFromTestFn = _errFromTestFn;
    } finally {
      await mainDataSource.closeAndDelete_testDb({ dbNameForThisTest, dbForThisTest });
    }

    if (errorFromTestFn) {
      throw errorFromTestFn;
    } else {
      return resultOfTheUnderlyingWrappedFunction;
    }
  };
  return underlyingFunctionToReturn;
};

export const test_withCleanDB = (
  testName: string,
  userFn: (dbData: { dbNameForThisTest: string; dbDataSource: DataSource }) => Promise<void> | void,
  timeout?: number,
) => {
  // Call the actual Jest's *test* function along with the (validated) test name and test function
  return global.test(testName, unwrap(testName, userFn), timeout);
};

export const describe_withCleanDb = (
  testName: number | string | Function | jest.FunctionLike,
  userFn: (dbData: { dbNameForThisTest: string; dbDataSource: DataSource }) => Promise<void> | void
) => {
  // Call the actual Jest's *describe* function along with the (validated) block name and block function
  const _testName = typeof testName === 'function' || typeof testName === 'object' ? testName.name : String(testName);
  return global.describe(testName, unwrap(_testName, userFn));
};

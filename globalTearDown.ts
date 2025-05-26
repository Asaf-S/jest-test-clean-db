import { getMainDataSource } from './mainDataSource_singleton';
import { dumpSharedGlobalData } from './sharedGlobalData';
import { consoleDebug } from './utils';

export default async () => {
    const mainDataSource = getMainDataSource();
    consoleDebug(`globalTeardown - wasEverInitialized: ${mainDataSource.wasEverInitialized()}`);
    await mainDataSource.closeAndDelete_templateDb();
    return dumpSharedGlobalData();
  };
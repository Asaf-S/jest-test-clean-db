import { getMainDataSource } from './mainDataSource_singleton';
import { dumpSharedGlobalData } from './sharedGlobalData';

// Initialize the DB
export default async () => {
  // dump shared global data if exist from previous run which were not terminated throw teardown
  dumpSharedGlobalData();

  await getMainDataSource().createTemplateDB();
};

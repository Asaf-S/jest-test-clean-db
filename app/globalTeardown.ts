import { getMainDataSource } from './mainDataSource_singleton';
import { dumpSharedGlobalData } from './sharedGlobalData';


export default async () => {
  let  mainDataSource = getMainDataSource();
  const templateDbDataSource = await mainDataSource.connectToExistingTemplateDB();
  if(mainDataSource.wasEverInitialized()) {
    await mainDataSource.closeAndDelete_templateDb(templateDbDataSource);
  }

  // cleaning up shared global data;
  return dumpSharedGlobalData();
};

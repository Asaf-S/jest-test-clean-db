import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

import { baseDataSourceOptions } from './baseDataSourceOptions';
import {
  closeConnection,
  createNewDbOrThrow,
  deleteDb,
  duplicateDbOrThrow,
  getTemplateDatabaseName,
  setTemplateDatabaseName
} from './dbRelatedFunctions';
import { getTemplateDbName } from './templateDbNameGenerator_singleton';
import { consoleDebug } from './utils';

export type IDataSourceInitiator = (dbName: string) => Promise<DataSource>;

export class MainDataSource {
  private _dataSource: DataSource | null = null;
  private _templateDbName: string = '';
  private _templateCreationPromise: undefined | Promise<void> = undefined;

  private async _getDataSource() {
    if (!this._dataSource) {
      this._dataSource = new DataSource({
        ...baseDataSourceOptions,
        database: process.env.TEST_POSTGRESQL_DB_NAME || '',
      });
      await this._dataSource.initialize();
    }
    return this._dataSource;
  }

  async createOrConnectToExistingTemplateDB(): Promise<void> {
    const isTemplateDatabaseExist = Boolean(getTemplateDatabaseName());

    if (isTemplateDatabaseExist) {
      await this.connectToExistingTemplateDB();
    } else {
      await this.createTemplateDB();
    }
  }

  /**
   * Connect to existing template database and return the DataSource
   *
   * @return {Promise<DataSource>}
   */
  async connectToExistingTemplateDB(): Promise<DataSource> {
    const existingTemplateDatabaseName = getTemplateDatabaseName();

    if (!existingTemplateDatabaseName) {
      throw new Error('existingTemplateDatabaseName: existing Template database couldn\'t able to find');
    }

    this._templateDbName = existingTemplateDatabaseName;

    const templateDatabaseDataSource = new DataSource({
      ...baseDataSourceOptions,
      database: this._templateDbName,
    });

    await templateDatabaseDataSource.initialize();

    // to keep the wasEverInitialized() return true
    this._templateCreationPromise = Promise.resolve();

    return templateDatabaseDataSource;
  }

  async createTemplateDB(): Promise<void> {
    if (!this._templateCreationPromise) {
      if (this._templateDbName) {
        throw new Error('jest-test-clean-db: Template database already created!');
      }

      this._templateDbName = getTemplateDbName();
      consoleDebug(`Creating main template database with name "${this._templateDbName}"`);

      this._templateCreationPromise = this._createTemplateDbAndRunMigrations(this._templateDbName);
    }

    return this._templateCreationPromise;
  }

  private _createTemplateDbAndRunMigrations = async (templateDbName: string): Promise<void> => {
    const templateDbDataSource = await this._createDB(templateDbName);
    setTemplateDatabaseName(this._templateDbName);

    consoleDebug(`START - Applying migrations on the template database...`);
    const before = Date.now();
    await templateDbDataSource.runMigrations();

    const after = Date.now();
    consoleDebug(`FINISHED - Applying migrations on the template database... (${(after - before) / 1000} seconds)`);
    return await closeConnection(templateDbDataSource);
  }

  private _createDB = async (dbName: string) => {

    const dataSourceOfTestDB = await this._getDataSource();
    await createNewDbOrThrow(dataSourceOfTestDB, dbName);


    const dataSourceNewlyInitiated = new DataSource({
      ...baseDataSourceOptions,
      database: this._templateDbName,
    });

    await dataSourceNewlyInitiated.initialize();

    return dataSourceNewlyInitiated;
  }

  wasEverInitialized() {
    return Boolean(this._templateCreationPromise);
  }

  async createTestDb_fromTemplateDB(testName: string, dataSourceInitiator: IDataSourceInitiator) {
    if (!this._templateCreationPromise) {
      throw new Error(`jest-test-clean-db: Template database was not created. Use createOrConnectToExistingTemplateDB() first!`);
    }
    await this._templateCreationPromise;
    const ds = await this._getDataSource();
    const dbNameForThisTest = `${this._templateDbName}-${testName}`;
    await duplicateDbOrThrow(ds, dbNameForThisTest, this._templateDbName);

    const dbForThisTest = await dataSourceInitiator(dbNameForThisTest);
    return { dbNameForThisTest, dbForThisTest };
  }

  async closeAndDelete_testDb(input: { dbNameForThisTest: string; dbForThisTest: DataSource }) {
    if (!this._templateCreationPromise) {
      throw new Error(`jest-test-clean-db: Template database was not created. Use createOrConnectToExistingTemplateDB() first!`);
    }
    await this._templateCreationPromise;
    const { dbNameForThisTest, dbForThisTest } = input;
    await closeConnection(dbForThisTest);
    const ds = await this._getDataSource();
    await deleteDb(ds, dbNameForThisTest);
  }
  async closeAndDelete_templateDb(templateDbDataSource: DataSource) {
    if (this.wasEverInitialized()) {
      await this._templateCreationPromise;
      await closeConnection(templateDbDataSource);
      const ds = await this._getDataSource();
      await deleteDb(ds, this._templateDbName);
    }
  }
}

export function getMainDataSource() {
  if (!global.mainDataSource) {
    global.mainDataSource = new MainDataSource();
  }
  return global.mainDataSource;
}

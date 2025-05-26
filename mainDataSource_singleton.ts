import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Config } from './config';
import { getGeneratedTemplateDbName } from './templateDbNameGenerator_singleton';
import { consoleDebug } from './utils';
import { closeConnection, createNewDbOrThrow, deleteDb, duplicateDbOrThrow, saveTemplateDatabaseName } from './dbRelatedFunctions';

dotenv.config();

export function getMainDataSource() {
    if (!global.mainDataSource) {
        global.mainDataSource = new MainDataSource();
    }
    return global.mainDataSource;
}

export class MainDataSource {
    private _dataSource: DataSource | null = null;
    private _templateDbName: string = '';
    private _templateCreationPromise: undefined | Promise<void> = undefined;

    wasEverInitialized() {
        return Boolean(this._templateCreationPromise);
    }

    private async _getDataSource() {
        if (!this._dataSource) {
            const postgresConnectionOptions = Config.getInstance().getPostgresConnectionOptions();

            this._dataSource = new DataSource({
                ...postgresConnectionOptions,
                database: process.env.TEST_POSTGRESQL_DB_NAME || '',
            });
            await this._dataSource.initialize();
        }
        return this._dataSource;
    }

    async createTemplateDB(): Promise<void> {
        if (!this._templateCreationPromise) {
            if (this._templateDbName) {
                throw new Error('jest-test-clean-db: Template database already created!');
            }

            this._templateDbName = getGeneratedTemplateDbName();
            consoleDebug(`Creating main template database with name "${this._templateDbName}"`);

            this._templateCreationPromise = this._createTemplateDbAndRunMigrations(this._templateDbName);
        }

        return this._templateCreationPromise;
    }

    private _createTemplateDbAndRunMigrations = async (templateDbName: string): Promise<void> => {
        const templateDbDataSource = await this._createDB(templateDbName);
        saveTemplateDatabaseName(this._templateDbName);

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

        const postgresConnectionOptions = Config.getInstance().getPostgresConnectionOptions();

        const dataSourceNewlyInitiated = new DataSource({
            ...postgresConnectionOptions,
            database: this._templateDbName,
        });

        await dataSourceNewlyInitiated.initialize();

        return dataSourceNewlyInitiated;
    }

    async createTestDb_fromTemplateDB(testName: string) {
        if (!this._templateCreationPromise) {
            throw new Error(`jest-test-clean-db: Template database was not created. Use createOrConnectToExistingTemplateDB() first!`);
        }
        await this._templateCreationPromise;
        const ds = await this._getDataSource();
        const dbNameForThisTest = `${this._templateDbName}-${testName}`;
        await duplicateDbOrThrow(ds, dbNameForThisTest, this._templateDbName);

        const postgresConnectionOptions = Config.getInstance().getPostgresConnectionOptions();

        const dbForThisTest = new DataSource({
            ...postgresConnectionOptions,
            database: this._templateDbName,
        });
        await dbForThisTest.initialize();
        return { dbNameForThisTest, dbForThisTest };
    }

    async closeAndDelete_testDb(input: { dbNameForThisTest: string; dbForThisTest: DataSource }) {
        if (!this._templateCreationPromise) {
            throw new Error(`jest-test-clean-db: Template database was not created. Use createTemplateDB() first!`);
        }
        await this._templateCreationPromise;
        const { dbNameForThisTest, dbForThisTest } = input;
        await closeConnection(dbForThisTest);
        const ds = await this._getDataSource();
        await deleteDb(ds, dbNameForThisTest);
    }

    async closeAndDelete_templateDb() {
        if (this.wasEverInitialized()) {
            await this._templateCreationPromise;
            const ds = await this._getDataSource();
            await deleteDb(ds, this._templateDbName);
        }

    }
}

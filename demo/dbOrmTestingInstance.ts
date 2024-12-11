import 'dotenv/config';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

let dsOptions_basePath: string;
if (process.env.TYPEORM_DS_OPTIONS_PATH) {
  dsOptions_basePath = path.resolve(process.cwd(), process.env.TYPEORM_DS_OPTIONS_PATH);
} else {
  throw new Error(`Env variable 'TYPEORM_DS_OPTIONS_PATH' is missing or invalid value, please make sure it have a valid value`);
}

const distFolder = __dirname.includes('/dist/src/db') ? __dirname : __dirname.replace('/src/db', '/dist/src/db');
const LOCATION_OF_MIGRATION_JS_FILES = distFolder + '/migrations/**/*.{js,ts}';
const DEFAULT_PORT = 5432;


export async function getDbOrmOfTestingInstance() {
    let dsOptions: DataSourceOptions = {
        type: 'postgres',
        entities: [],
        migrations: [LOCATION_OF_MIGRATION_JS_FILES],
        migrationsRun: true,
        synchronize: false,
        dropSchema: true,
    };

    const dbConfigFromEnvParams_test = {
        host: process.env.TEST_POSTGRESQL_HOSTNAME,
        username: process.env.TEST_POSTGRESQL_USERNAME,
        password: process.env.TEST_POSTGRESQL_PASSWORD,
        database: process.env.TEST_POSTGRESQL_DB_NAME,
    };

    const sslRelatedSettings: Partial<{ ssl: true }> = {};

    if (Boolean(process.env.POSTGRESQL_SSL)) {
        sslRelatedSettings.ssl = true;
    }

    const dataSourceOptions = {
        port: DEFAULT_PORT,
        ...dsOptions,
        ...dbConfigFromEnvParams_test,
        ...sslRelatedSettings,
    };

    const dataSourceInstance = new DataSource(dataSourceOptions);
    dataSourceInstance.initialize();

    return dataSourceInstance;
}

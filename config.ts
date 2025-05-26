import { BaseDataSourceOptions } from "typeorm/data-source/BaseDataSourceOptions";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const DEFAULT_PORT = 5432;

export type IDataSource_Options = {
  type: 'postgres';
  migrations: string[];
  migrationsRun: boolean;
  logging: boolean;
  synchronize: boolean;
} & Pick<BaseDataSourceOptions, 'entities'>

export class Config {
  private static instance: Config;
  private postgresConnectionOptions?: PostgresConnectionOptions;

  private constructor() {} // Private constructor to prevent direct instantiation

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  initialize(dataSource_Options: IDataSource_Options) {
    this.postgresConnectionOptions = {
      ...dataSource_Options,
      host: process.env.TEST_POSTGRESQL_HOSTNAME || '',
      username: process.env.TEST_POSTGRESQL_USERNAME || '',
      password: process.env.TEST_POSTGRESQL_PASSWORD || '',
      port: DEFAULT_PORT,
    };
  }

  getPostgresConnectionOptions(): PostgresConnectionOptions {
    if(this.postgresConnectionOptions) {
      return this.postgresConnectionOptions;
    } else throw new Error('this.postgresConnectionOptions is missing, please make sure that you invoked initialize method with config options prior');
  }
}
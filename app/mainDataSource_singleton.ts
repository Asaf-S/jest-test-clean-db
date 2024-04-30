import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

import { baseDataSourceOptions } from './baseDataSourceOptions';

dotenv.config();

let mainDataSource: DataSource | null = null;

export async function getMainDataSource() {
  if (!mainDataSource) {
    mainDataSource = new DataSource({
      ...baseDataSourceOptions,
      database: process.env.TEST_POSTGRESQL_DB_NAME || '',
    });
    await mainDataSource.initialize();
  }
  return mainDataSource;
}

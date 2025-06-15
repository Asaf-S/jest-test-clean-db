# HB_BE_LMS - Backend Testing Setup

This project uses `jest-test-clean-db-postgres` for managing test database operations in a PostgreSQL environment. This setup ensures that tests run in isolation with a clean database state.

## Test Database Setup

### Prerequisites

- Node.js v18.20.4
- PostgreSQL database
- pnpm package manager

### Configuration

The test database setup is configured in `apps/BE/jest.beforeAll.ts`. The configuration includes:

```typescript
initialize({
  type: 'postgres',
  entities: typeOrmEntities,
  migrations: [LOCATION_OF_MIGRATION_JS_FILES],
  migrationsRun: true,
  logging: utils.isReallyTrue(process.env.POSTGRESQL_DEBUGGING),
  synchronize: false,
});
```

### Key Features

1. **Automatic Database Cleanup**: Before each test suite runs, the database is automatically cleaned.
2. **Migration Support**: All migrations are run automatically before tests start.
3. **TypeORM Integration**: Works seamlessly with TypeORM entities and migrations.
4. **Environment Variables**: Uses environment variables for configuration:
   - `POSTGRESQL_DEBUGGING`: Enable/disable SQL query logging
   - `IS_TEST`: Set to '1' to indicate test environment
   - `TEST_START_TIMESTAMP`: Timestamp for test run identification

### Test Environment Setup

The project uses several Jest configuration files:

1. `jest.beforeAll.ts`: Global setup before all tests
2. `jest.afterAll.ts`: Global teardown after all tests
3. `jest.beforeEach.ts`: Setup before each test
4. `jest.config.ts`: Main Jest configuration

### Running Tests

To run tests, use the following commands:

```bash
# Run all tests
pnpm run test

# Run a specific test
pnpm run test_single
```

The test command uses the following Jest options:
- `--runInBand`: Run tests serially
- `--detectOpenHandles`: Detect and report open handles
- `--forceExit`: Force Jest to exit after all tests complete

### Error Handling

The test setup includes comprehensive error handling:

1. **Unhandled Promise Rejections**: Catches and logs unhandled promise rejections with detailed information about the cause.
2. **Uncaught Exceptions**: Logs uncaught exceptions with stack traces.
3. **Graceful Shutdown**: Implements a 1-second delay before process exit to ensure proper cleanup.

### Best Practices

1. **Database Isolation**: Each test suite runs with a clean database state.
2. **Migration Management**: Always run migrations before tests.
3. **Error Logging**: Comprehensive error logging for debugging.
4. **Environment Separation**: Clear separation between test and production environments.

### Common Issues and Solutions

1. **Database Connection Issues**:
   - Ensure PostgreSQL is running
   - Check database credentials in environment variables
   - Verify database user permissions

2. **Migration Failures**:
   - Ensure all migration files are in the correct location
   - Check migration file syntax
   - Verify database schema compatibility

3. **Test Timeouts**:
   - Default timeout is set to 20000ms
   - Adjust timeout in jest.config.ts if needed
   - Check for long-running operations in tests

### Development Workflow

1. Write tests in the `src` directory with `.test.ts` or `.spec.ts` extension
2. Run `pnpm run build:packages` after making changes in the `packages/` directory
3. Use `pnpm run test` to verify changes
4. Check coverage reports in the `coverage` directory

### Additional Notes

- The project uses TypeScript for type safety
- Jest is configured to collect coverage information
- Tests run in a Node.js environment
- Custom reporters are used for better test output formatting
- Environment variables are loaded using dotenv
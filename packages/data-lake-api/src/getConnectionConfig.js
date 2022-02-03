/**
 * Tupaia
 * Copyright (c) 2017 Beyond Essential Systems Pty Ltd
 */

import { requireEnv, getEnvVarOrDefault } from '@tupaia/utils';

const getServerConfig = () => ({
  host: requireEnv('DATA_LAKE_DB_URL'),
  port: getEnvVarOrDefault('DATA_LAKE_DB_PORT', 5432),
  user: requireEnv('DATA_LAKE_DB_USER'),
  password: requireEnv('DATA_LAKE_DB_PASSWORD'),
  database: requireEnv('DATA_LAKE_DB_NAME'),
  ssl:
    process.env.DATA_LAKE_DB_ENABLE_SSL === 'true'
      ? {
          // Test server cannot turn on ssl, so sets the env to disable it
          rejectUnauthorized: false,
        }
      : null,
});

const getCiConfig = () => ({
  host: requireEnv('CI_TEST_DATA_LAKE_DB_URL'),
  user: requireEnv('CI_TEST_DATA_LAKE_DB_USER'),
  password: requireEnv('CI_TEST_DATA_LAKE_DB_PASSWORD'),
  database: requireEnv('CI_TEST_DATA_LAKE_DB_NAME'),
  ssl: null,
});

export const getConnectionConfig = () => {
  // Note: Must use functions to guarantee environment variables have loaded
  return process.env.CI_NAME === 'codeship' ? getCiConfig() : getServerConfig();
};

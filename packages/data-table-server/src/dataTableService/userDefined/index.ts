/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { TupaiaApiClient } from '@tupaia/api-client';
import { DataTableServerModelRegistry } from '../../types';
import { SqlDataTableService } from './SqlDataTableService';
import { UserDefinedDataTableService } from './UserDefinedDataTableService';

export const userDefinedDataTableServices: Record<
  string,
  new (
    models: DataTableServerModelRegistry,
    apiClient: TupaiaApiClient,
    parameters: unknown,
    config: unknown,
  ) => UserDefinedDataTableService
> = {
  sql: SqlDataTableService,
};

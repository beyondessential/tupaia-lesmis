/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { TupaiaApiClient } from '@tupaia/api-client';
import { yup } from '@tupaia/utils';
import { DataTableServerModelRegistry } from '../../types';
import { UserDefinedDataTableService } from './UserDefinedDataTableService';

const configSchema = yup.object().shape({
  externalDatabaseConnectionId: yup.string().required(),
  sql: yup.string().required(),
});

export class SqlDataTableService extends UserDefinedDataTableService<
  typeof configSchema,
  Record<string, unknown>
> {
  public constructor(
    models: DataTableServerModelRegistry,
    apiClient: TupaiaApiClient,
    parameters: unknown,
    config: unknown,
  ) {
    super(models, apiClient, configSchema, parameters, config);
  }

  protected async pullData(params: Record<string, unknown>) {
    const { externalDatabaseConnectionId, sql } = this.config;
    const databaseConnection = await this.models.externalDatabaseConnection.findById(
      externalDatabaseConnectionId,
    );

    if (!databaseConnection) {
      throw new Error(
        `Cannot find external database connection with id: ${externalDatabaseConnectionId}`,
      );
    }

    return databaseConnection.executeSql(sql, params) as Promise<Record<string, unknown>[]>;
  }
}

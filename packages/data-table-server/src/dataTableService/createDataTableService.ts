/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { TupaiaApiClient } from '@tupaia/api-client';
import { DataTableType } from '../models';
import { DataTableServerModelRegistry } from '../types';
import { internalDataTableServices } from './internal';
import { userDefinedDataTableServices } from './userDefined';

/**
 * Factory function for building the correct DataTableService for the requested dataTable
 */
export const createDataTableService = (
  dataTable: DataTableType,
  models: DataTableServerModelRegistry,
  apiClient: TupaiaApiClient,
) => {
  const { code, type, config } = dataTable;
  if (type === 'internal') {
    const InternalDataTableServiceClass = internalDataTableServices[code];
    if (!InternalDataTableServiceClass) {
      throw new Error(`No internal data-table defined for ${code}`);
    }
    return new InternalDataTableServiceClass(models, apiClient, config);
  }

  const DataTableServiceClass = userDefinedDataTableServices[type];
  if (!DataTableServiceClass) {
    throw new Error(`Cannot build data table for type: ${type}`);
  }

  const { parameters, ...restOfConfig } = config;
  return new DataTableServiceClass(models, apiClient, parameters, restOfConfig);
};

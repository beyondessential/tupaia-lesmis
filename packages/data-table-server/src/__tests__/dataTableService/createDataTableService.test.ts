/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { DataTableType as DataTableTypeClass } from '@tupaia/database';
import { createDataTableService } from '../../dataTableService';
import { AnalyticsDataTableService } from '../../dataTableService/internal/AnalyticsDataTableService';
import { DataTableType } from '../../models';
import { getStubApiClient, getStubModels } from '../utils';

describe('createDataTableService', () => {
  describe('error cases', () => {
    it('throws an error for an unknown data-table type', () => {
      const dataTableWithUnknownType = new DataTableTypeClass(
        {},
        { type: 'unknown' },
      ) as DataTableType;

      const createUnknownTypeDataTableService = () =>
        createDataTableService(dataTableWithUnknownType, getStubModels(), getStubApiClient());

      expect(createUnknownTypeDataTableService).toThrow(
        'Cannot build data table for type: unknown',
      );
    });

    it('throws an error for an unknown internal data-table', () => {
      const unknownInternalDataTable = new DataTableTypeClass(
        {},
        { type: 'internal', code: 'unknown' },
      ) as DataTableType;

      const createUnknownInternalDataTableService = () =>
        createDataTableService(unknownInternalDataTable, getStubModels(), getStubApiClient());

      expect(createUnknownInternalDataTableService).toThrow(
        'No internal data-table defined for unknown',
      );
    });
  });

  it('can create an internal data-table service', () => {
    const analyticsDataTable = new DataTableTypeClass(
      {},
      { type: 'internal', code: 'analytics' },
    ) as DataTableType;

    const analyticsDataTableService = createDataTableService(
      analyticsDataTable,
      getStubModels(),
      getStubApiClient(),
    );

    expect(analyticsDataTableService instanceof AnalyticsDataTableService).toBe(true);
  });
});

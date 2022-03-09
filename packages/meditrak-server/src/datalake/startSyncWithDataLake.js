/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { DataLakeApi } from '@tupaia/data-lake-api';
import { generateId } from '@tupaia/database';

const PERIOD_BETWEEN_SYNCS = 24 * 60 * 60 * 1000; // 24 hours between syncs

export async function startSyncWithDataLake(models) {
  if (process.env.DATA_LAKE_SYNC_DISABLE === 'true') {
    // eslint-disable-next-line no-console
    console.log('Data Lake sync is disabled');
    return;
  }

  const dataLakeApi = new DataLakeApi();
  setInterval(() => syncWithDataLake(models, dataLakeApi), PERIOD_BETWEEN_SYNCS);
}

export async function syncWithDataLake(models, dataLakeApi) {
  // Pull data from Data Lake
  const { dataElementCodes } = await dataLakeApi.fetchDataElementCodes({
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });

  await models.wrapInTransaction(async transactingModels => {
    for (const dataElementCode of dataElementCodes) {
      const existingDataElementCode = await transactingModels.dataSource.findOne({
        code: dataElementCode,
      });
      if (!existingDataElementCode) {
        await transactingModels.dataSource.create({
          id: generateId(),
          code: dataElementCode,
          type: 'dataElement',
          service_type: 'data-lake',
          config: {},
        });
      }
    }
  });
}

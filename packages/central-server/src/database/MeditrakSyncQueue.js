/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import winston from 'winston';
import { ChangeHandler } from '@tupaia/database';
import { createPermissionsBasedMeditrakSyncQueue } from './createPermissionsBasedMeditrakSyncQueue';

const modelValidator = model => {
  if (!model.meditrakConfig.minAppVersion) {
    throw new Error(
      `Model for ${model.databaseType} must have a meditrakConfig.minAppVersion property`,
    );
  }
  return true;
};

/**
 * Adds server side changes to the meditrakSyncQueue
 */
export class MeditrakSyncQueue extends ChangeHandler {
  constructor(models) {
    super(models);
    this.syncQueueModel = models.meditrakSyncQueue;

    const stripDataFromChange = change => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      // eslint-disable-next-line camelcase
      const { old_record, new_record, ...restOfRecord } = change;
      return [{ ...restOfRecord }];
    };

    const typesToSync = models.getTypesToSyncWithMeditrak();
    const modelNamesToSync = Object.entries(models)
      .filter(([, model]) => typesToSync.includes(model.databaseType))
      .map(([modelName]) => modelName);
    const modelsToSync = typesToSync.map(type => models.getModelForDatabaseType(type));
    modelsToSync.forEach(model => modelValidator(model));
    this.changeTranslators = Object.fromEntries(
      modelNamesToSync.map(model => [model, stripDataFromChange]),
    );
  }

  async createPermissionsBasedView() {
    await createPermissionsBasedMeditrakSyncQueue(this.models.database);
    winston.info(`Created permissions_based_meditrak_sync_queue`);
  }

  async refreshPermissionsBasedView() {
    try {
      const start = Date.now();
      await this.models.database.executeSql(
        `REFRESH MATERIALIZED VIEW CONCURRENTLY permissions_based_meditrak_sync_queue;`,
      );
      const end = Date.now();
      winston.info(`permissions_based_meditrak_sync_queue refresh took: ${end - start}ms`);
    } catch (error) {
      winston.error(`permissions_based_meditrak_sync_queue refresh failed: ${error.message}`);
    }
  }

  addToSyncQueue(change) {
    this.syncQueueModel.updateOrCreate(
      {
        record_id: change.record_id,
      },
      {
        ...change,
        change_time: Math.random(), // Force an update, after which point the trigger will update the change_time to more complicated now() + sequence
      },
    );
  }

  async handleChanges(changes) {
    await Promise.all(changes.map(change => this.addToSyncQueue(change)));
    await this.refreshPermissionsBasedView();
  }
}

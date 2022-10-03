/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { createDataTableDBFilter } from './assertDataTablePermissions';
import { CreateHandler } from '../CreateHandler';
import {
  assertAdminPanelAccess,
  assertAnyPermissions,
  assertBESAdminAccess,
} from '../../permissions';

export class CreateDataTable extends CreateHandler {
  async assertUserHasAccess() {
    await this.assertPermissions(
      assertAnyPermissions([assertBESAdminAccess, assertAdminPanelAccess]),
    );
  }

  async createRecord() {
    // First check we have permission to create the data-table
    await this.models.dataTable.validateUserCanCreateDataTable(
      this.newRecordData,
      this.accessPolicy,
    );
    return super.insertRecord();
  }

  async getPermissionsFilter(criteria, options) {
    const dbConditions = await createDataTableDBFilter(this.accessPolicy, this.models, criteria);
    return { dbConditions, dbOptions: options };
  }
}

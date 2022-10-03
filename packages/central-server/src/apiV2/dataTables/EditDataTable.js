/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import {
  assertDataTableEditPermissions,
  createDataTableDBFilter,
} from './assertDataTablePermissions';
import { EditHandler } from '../EditHandler';
import { assertAnyPermissions, assertBESAdminAccess } from '../../permissions';

export class EditDataTable extends EditHandler {
  async assertUserHasAccess() {
    const dataTablePermissionChecker = accessPolicy =>
      assertDataTableEditPermissions(accessPolicy, this.models, this.recordId);

    await this.assertPermissions(
      assertAnyPermissions([assertBESAdminAccess, dataTablePermissionChecker]),
    );
  }

  async editRecord() {
    const dataTable = await this.resourceModel.findById(this.recordId);
    await this.models.dataTable.validateUserCanCreateDataTable(
      { ...dataTable, ...this.updatedFields },
      this.accessPolicy,
    );

    await super.updateRecord();
  }

  async getPermissionsFilter(criteria, options) {
    const dbConditions = await createDataTableDBFilter(this.accessPolicy, this.models, criteria);
    return { dbConditions, dbOptions: options };
  }
}

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { DeleteHandler } from '../DeleteHandler';
import { assertAnyPermissions, assertBESAdminAccess } from '../../permissions';
import { assertDataTableEditPermissions } from './assertDataTablePermissions';

export class DeleteDataTable extends DeleteHandler {
  async assertUserHasAccess() {
    const dataTablePermissionChecker = accessPolicy =>
      assertDataTableEditPermissions(accessPolicy, this.models, this.recordId);

    await this.assertPermissions(
      assertAnyPermissions([assertBESAdminAccess, dataTablePermissionChecker]),
    );
  }

  async validate() {
    await super.validate();
    const dataTable = await this.resourceModel.findById(this.recordId);
    if (dataTable.type === 'internal') {
      throw new Error('Cannot delete internal data tables');
    }
  }
}

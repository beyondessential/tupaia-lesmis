/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { GETHandler } from '../GETHandler';
import { assertAnyPermissions, assertBESAdminAccess } from '../../permissions';
import {
  assertDashboardRelationGetPermissions,
  createDashboardRelationsDBFilter,
} from './assertDashboardRelationsPermissions';

/**
 * Handles endpoints:
 * - /dashboardRelations
 * - /dashboardRelations/:dashboardRelationId
 */
export class GETDashboardRelations extends GETHandler {
  permissionsFilteredInternally = true;

  async findSingleRecord(dashboardRelationId, options) {
    const dashboardRelation = await super.findSingleRecord(dashboardRelationId, options);

    const dashboardRelationChecker = accessPolicy =>
      assertDashboardRelationGetPermissions(accessPolicy, this.models, dashboardRelationId);

    await this.assertPermissions(
      assertAnyPermissions([assertBESAdminAccess, dashboardRelationChecker]),
    );

    return dashboardRelation;
  }

  async getPermissionsFilter(criteria, options) {
    const dbConditions = createDashboardRelationsDBFilter(this.accessPolicy, criteria);
    return { dbConditions, dbOptions: options };
  }
}

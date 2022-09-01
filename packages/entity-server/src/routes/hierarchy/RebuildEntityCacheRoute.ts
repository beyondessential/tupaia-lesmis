/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { Request } from 'express';
import { EntityHierarchyCacher } from '@tupaia/database';
import { Route } from '@tupaia/server-boilerplate';
import { SingleEntityRequestParams } from './types';
import { throwNoAccessError } from './utils';

export interface RebuildEntityCacheRequest<
  P = SingleEntityRequestParams,
  ResBody = { message: string }
> extends Request<P, ResBody> {
  ctx: { entityHierarchyCacher: EntityHierarchyCacher };
}

export const BES_ADMIN_PERMISSION_GROUP = 'BES Admin';

export class RebuildEntityCacheRoute extends Route<RebuildEntityCacheRequest> {
  public async buildResponse() {
    if (!this.req.accessPolicy.allowsAnywhere(BES_ADMIN_PERMISSION_GROUP)) {
      throw new Error('User does not have permissions to rebuild entity cache');
    }

    const { hierarchyName } = this.req.params;

    const hierarchy = await this.req.models.entityHierarchy.findOne({ name: hierarchyName });
    if (!hierarchy) {
      throwNoAccessError(hierarchyName);
    }

    const hierarchyId = hierarchy.id;
    const { entityCode } = this.req.params;
    const projectEntity = await this.req.models.entity.findOne({
      type: 'project',
      code: hierarchyName,
    });
    if (!projectEntity) {
      throw new Error(`Cannot find root entity for hierarchy: ${hierarchyName}`);
    }

    const entity =
      entityCode === projectEntity.code
        ? projectEntity
        : (
            await projectEntity.getDescendants(hierarchyId, {
              code: entityCode,
            })
          )[0];

    if (!entity) {
      throw new Error(`Cannot find entity ${entityCode}, in hierarchy: ${hierarchyName}`);
    }

    await this.req.ctx.entityHierarchyCacher.scheduleRebuildOfSubtree(hierarchyId, entity.id);

    return { message: `Rebuilt entity cache subtree: ${hierarchyName}->${entityCode}` };
  }
}

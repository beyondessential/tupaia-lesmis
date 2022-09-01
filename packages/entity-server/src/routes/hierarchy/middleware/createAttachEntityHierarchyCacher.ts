/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { NextFunction, Response } from 'express';
import { EntityHierarchyCacher } from '@tupaia/database';
import { RebuildEntityCacheRequest } from '../RebuildEntityCacheRoute';

/**
 * @param entityHierarchyCacher a singleton EntityHierarchyCacher instance to be shared across the server
 * @returns A middleware to attach the singleton instance to the request context
 */
export const createAttachEntityHierarchyCacher = (
  entityHierarchyCacher: EntityHierarchyCacher,
) => async (req: RebuildEntityCacheRequest, res: Response, next: NextFunction) => {
  req.ctx.entityHierarchyCacher = entityHierarchyCacher;
  next();
};

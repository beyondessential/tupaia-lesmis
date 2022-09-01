/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { PermissionsError } from '@tupaia/utils';

export const throwNoAccessError = (
  hierarchyName: string,
  entityCodes: string[] = [],
  permissionGroup = 'any',
) => {
  if (entityCodes.length > 0) {
    throw new PermissionsError(
      `No access to requested entities: ${entityCodes}, in requested hierarchy: ${hierarchyName}, for ${permissionGroup} permission group`,
    );
  }

  throw new PermissionsError(
    `No access to requested hierarchy: ${hierarchyName}, for ${permissionGroup} permission group`,
  );
};

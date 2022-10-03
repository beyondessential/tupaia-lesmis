/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { DatabaseModel } from '../DatabaseModel';
import { DatabaseType } from '../DatabaseType';
import { TYPES } from '../types';

const DATA_TABLE_TYPES = {
  INTERNAL: 'internal',
  SQL: 'sql',
};

export class DataTableType extends DatabaseType {
  static databaseType = TYPES.DATA_TABLE;
}

export class DataTableModel extends DatabaseModel {
  static DATA_TABLE_TYPES = DATA_TABLE_TYPES;

  async validateUserCanCreateDataTable(fields, accessPolicy) {
    const { type, config } = fields;
    switch (type) {
      case DATA_TABLE_TYPES.INTERNAL:
        throw new Error('Users cannot create internal data tables');
      case DATA_TABLE_TYPES.SQL: {
        // For SQL data-tables, we must ensure the user doesn't create one using an external db connection they don't have permissions to
        const { externalDatabaseConnectionId } = config;
        if (!externalDatabaseConnectionId) {
          throw new Error('SQL data tables require a external database connection');
        }

        const externalDatabaseConnection = await this.otherModels.externalDatabaseConnection.findById(
          externalDatabaseConnectionId,
        );

        if (!externalDatabaseConnection) {
          throw new Error(
            `Cannot find external database connection with id: ${externalDatabaseConnectionId}`,
          );
        }

        const permissionGroups = externalDatabaseConnection.permission_groups;
        const canCreate = permissionGroups.some(permissionGroup =>
          accessPolicy.allowsAnywhere(permissionGroup),
        );

        if (!canCreate) {
          throw new Error('User does not have permission to the external database connection');
        }
        break;
      }
      default:
      // User can create by default
    }
  }

  get DatabaseTypeClass() {
    return DataTableType;
  }
}

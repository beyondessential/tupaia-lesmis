/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { BESAdminCreateHandler } from '../CreateHandler';

export class CreateExternalDatabaseConnection extends BESAdminCreateHandler {
  async insertRecord() {
    const { password, ...restOfNewRecordData } = this.newRecordData;
    await this.models.getModelForDatabaseType(this.recordType).create({
      ...restOfNewRecordData,
      password_base_64: Buffer.from(password).toString('base64'),
    });
  }
}

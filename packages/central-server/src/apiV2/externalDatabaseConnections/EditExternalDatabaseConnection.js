/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { BESAdminEditHandler } from '../EditHandler';

export class EditExternalDatabaseConnection extends BESAdminEditHandler {
  async updateRecord() {
    const { password, ...restOfUpdatedFields } = this.updatedFields;
    const passwordBase64 = password ? Buffer.from(password).toString('base64') : undefined;
    await this.models
      .getModelForDatabaseType(this.recordType)
      .updateById(this.recordId, { ...restOfUpdatedFields, password_base_64: passwordBase64 });
  }
}

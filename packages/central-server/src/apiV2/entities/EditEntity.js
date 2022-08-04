/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { BESAdminEditHandler } from '../EditHandler';

export class EditEntity extends BESAdminEditHandler {
  async updateRecord() {
    // for now, ensure only name field can be updated
    // others may be supported in future but want to avoid anyone editing e.g. code
    const updatedFieldKeys = Object.keys(this.updatedFields);
    if (updatedFieldKeys.length !== 1 || updatedFieldKeys[0] !== 'name') {
      throw Error('Fields other than "name" cannot be updated');
    }
    await super.updateRecord();
  }
}

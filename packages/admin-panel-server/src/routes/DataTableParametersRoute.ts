/*
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 *
 */

import { Request } from 'express';

import { Route } from '@tupaia/server-boilerplate';

export type DataTableParametersRequest = Request<
  { dataTableCode: string },
  { parameters: { name: string; config: Record<string, unknown> }[] }
>;

export class DataTableParametersRoute extends Route<DataTableParametersRequest> {
  public async buildResponse() {
    const { dataTableCode } = this.req.params;
    return this.req.ctx.services.dataTable.getParameters(dataTableCode);
  }
}

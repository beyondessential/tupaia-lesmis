/*
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 *
 */

import { Request } from 'express';

import { Route } from '@tupaia/server-boilerplate';

export type DataTableTestRequest = Request<
  Record<string, never>,
  { data: unknown[] },
  { dataTable: Record<string, unknown>; parameters: Record<string, unknown> }
>;

export class DataTableTestRoute extends Route<DataTableTestRequest> {
  public async buildResponse() {
    const { dataTable, parameters } = this.req.body;
    return this.req.ctx.services.dataTable.testDataTable(dataTable, parameters);
  }
}

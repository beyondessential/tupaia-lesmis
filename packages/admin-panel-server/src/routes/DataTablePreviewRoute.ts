/*
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 *
 */

import { Request } from 'express';

import { Route } from '@tupaia/server-boilerplate';

export type DataTablePreviewRequest = Request<
  { dataTableCode: string },
  { data: Record<string, unknown>[] },
  Record<string, unknown>
>;

export class DataTablePreviewRoute extends Route<DataTablePreviewRequest> {
  public async buildResponse() {
    const { dataTableCode } = this.req.params;
    return this.req.ctx.services.dataTable.fetchData(dataTableCode, this.req.body);
  }
}

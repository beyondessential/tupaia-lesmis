/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { Request } from 'express';

import { Route } from '@tupaia/server-boilerplate';
import { yup } from '@tupaia/utils';
import { createDataTableService } from '../dataTableService';

export type TestRequest = Request<
  Record<string, never>,
  { data: unknown[] },
  { dataTable: unknown; parameters: Record<string, unknown> },
  Record<string, unknown>
>;

const dataTableValidator = yup.object().shape({
  code: yup.string().required(),
  description: yup.string(),
  type: yup.string().required(),
  config: yup.object().required(),
  permission_groups: yup.array().of(yup.string().required()).required(),
});

export class TestRoute extends Route<TestRequest> {
  public async buildResponse() {
    const { dataTable: dataTableObject, parameters } = this.req.body;
    const validatedDataTable = dataTableValidator.validateSync(dataTableObject);

    // Ensure user isn't attempting to test a data table they don't have access to create
    await this.req.models.dataTable.validateUserCanCreateDataTable(
      validatedDataTable,
      this.req.accessPolicy,
    );
    const dataTable = await this.req.models.dataTable.generateInstance(validatedDataTable);
    const dataTableService = createDataTableService(
      dataTable,
      this.req.models,
      this.req.ctx.services,
    );

    const data = await dataTableService.fetchData(parameters);

    return { data };
  }
}

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { TupaiaApiClient } from '@tupaia/api-client';
import { yup } from '@tupaia/utils';
import { DataTableServerModelRegistry } from '../../types';
import { DataTableService } from '../DataTableService';
import { DataTableParameter } from '../types';
import { dataTableParamsToYupSchema } from '../utils';

const dataTableParamsValidator = yup.array().of(
  yup.object().shape({
    name: yup.string().required(),
    config: yup.object().shape({
      type: yup.string().required(),
      oneOf: yup.array(),
      required: yup.boolean(),
    }),
  }),
);

export abstract class UserDefinedDataTableService<
  ConfigSchema extends yup.AnyObjectSchema = yup.AnyObjectSchema,
  RecordSchema = unknown
> extends DataTableService<yup.AnyObjectSchema, ConfigSchema, RecordSchema> {
  private readonly parameters: DataTableParameter[];

  protected constructor(
    models: DataTableServerModelRegistry,
    apiClient: TupaiaApiClient,
    configSchema: ConfigSchema,
    parameters: unknown,
    config: unknown,
  ) {
    const validatedParameters = dataTableParamsValidator.validateSync(parameters) || [];
    const paramsSchema = dataTableParamsToYupSchema(validatedParameters);
    super(models, apiClient, paramsSchema, configSchema, config);
    this.parameters = validatedParameters;
  }

  public getParameters() {
    return this.parameters;
  }
}

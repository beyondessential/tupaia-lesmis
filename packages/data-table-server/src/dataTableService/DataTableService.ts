/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { TupaiaApiClient } from '@tupaia/api-client';
import { yup } from '@tupaia/utils';
import { DataTableServerModelRegistry } from '../types';
import { DataTableParameter } from './types';

export abstract class DataTableService<
  ParamsSchema extends yup.AnyObjectSchema = yup.AnyObjectSchema,
  ConfigSchema extends yup.AnyObjectSchema = yup.AnyObjectSchema,
  RecordSchema = unknown
> {
  protected readonly models: DataTableServerModelRegistry;
  protected readonly apiClient: TupaiaApiClient;
  protected readonly paramsSchema: ParamsSchema;
  protected readonly configSchema: ConfigSchema;
  protected readonly config: yup.InferType<ConfigSchema>;

  protected constructor(
    models: DataTableServerModelRegistry,
    apiClient: TupaiaApiClient,
    paramsSchema: ParamsSchema,
    configSchema: ConfigSchema,
    config: unknown,
  ) {
    this.models = models;
    this.apiClient = apiClient;
    this.paramsSchema = paramsSchema;
    this.configSchema = configSchema;
    this.config = this.configSchema.validateSync(config);
  }

  protected validateParams(params: unknown) {
    return this.paramsSchema.validateSync(params);
  }

  /**
   * Implement in concrete class
   */
  protected abstract pullData(params: yup.InferType<ParamsSchema>): Promise<RecordSchema[]>;

  public fetchData(params: unknown) {
    const validatedParams = this.validateParams(params);
    return this.pullData(validatedParams);
  }

  public abstract getParameters(): DataTableParameter[];
}

/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { Table } from '../transform/parser/customTypes';

import { ReportServerAggregator } from '../../aggregator';
import { Row } from '../types';
import { outputBuilders } from './functions/outputBuilders';
import { OutputContext } from './types';

type OutputParams = {
  type: keyof typeof outputBuilders;
  config: unknown;
};

const paramsValidator = yup.object().shape({
  type: yup
    .mixed<keyof typeof outputBuilders>()
    .oneOf(Object.keys(outputBuilders) as (keyof typeof outputBuilders)[]),
});

const output = (
  table: Table,
  params: OutputParams,
  outputContext: OutputContext,
  aggregator: ReportServerAggregator,
) => {
  const { type, config } = params;

  const outputBuilder = outputBuilders[type](config, outputContext);
  return outputBuilder(table, aggregator);
};

const buildParams = (params: unknown): OutputParams => {
  const validatedParams = paramsValidator.validateSync(params);
  const { type = 'default', ...restOfParams } = validatedParams;
  return { type, config: restOfParams };
};

export const buildOutput = (
  params: unknown,
  outputContext: OutputContext,
  aggregator: ReportServerAggregator,
) => {
  const builtParams = buildParams(params);
  return (table: Table) => output(table, builtParams, outputContext, aggregator);
};

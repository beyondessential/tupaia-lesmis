/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup, yupUtils } from '@tupaia/utils';
import { FetchReportQuery } from '../../../../types';
import { ReportServerAggregator } from '../../../../aggregator';
import { FetchConfig, FetchResponse } from './types';
import { fetchBuilders } from './functions';
import { Context, updateContext } from '../../../context';
import { Row } from '../../../types';
import { QueryBuilder } from './query';

type FetchParams = {
  config: FetchConfig;
  fetch: (aggregator: ReportServerAggregator, query: FetchReportQuery) => Promise<FetchResponse>;
};

const { polymorphic } = yupUtils;

const periodTypeValidator = yup.mixed().oneOf(['day', 'week', 'month', 'quarter', 'year']);

const createDataSourceValidator = (sourceType: 'dataElement' | 'dataGroup') => {
  const otherSourceKey = sourceType === 'dataElement' ? 'dataGroups' : 'dataElements';

  return yup
    .array()
    .of(yup.string().required())
    .when(['$testData', otherSourceKey], {
      is: ($testData: unknown, otherDataSource: string[]) =>
        !$testData && (!otherDataSource || otherDataSource.length === 0),
      then: yup
        .array()
        .of(yup.string().required())
        .required('Requires "dataGroups" or "dataElements"')
        .min(1),
    });
};

const dataElementValidator = createDataSourceValidator('dataElement');
const dataGroupValidator = createDataSourceValidator('dataGroup');

const aggregationValidator = polymorphic({
  string: yup.string().min(1),
  object: yup.object().shape({
    type: yup.string().min(1).required(),
    config: yup.object(),
  }),
});

const dateSpecsValidator = polymorphic({
  object: yup
    .object()
    .shape({
      unit: periodTypeValidator.required(),
      offset: yup.number(),
      modifier: yup.mixed().oneOf(['start_of', 'end_of']),
      modifierUnit: periodTypeValidator,
    })
    .default(undefined),
  string: yup.string().min(4),
});

export const paramsValidator = yup.object().shape(
  {
    dataElements: dataElementValidator,
    dataGroups: dataGroupValidator,
    aggregations: yup.array().of(aggregationValidator as any), // https://github.com/jquense/yup/issues/1283#issuecomment-786559444
    organisationUnits: yup.array().of(yup.string().required()),
    startDate: dateSpecsValidator,
    endDate: dateSpecsValidator,
  },
  [['dataElements', 'dataGroups']],
);

const fetchData = async (rows: Row[], params: FetchParams, context: Context) => {
  const { config, fetch } = params;
  const builtQuery = await new QueryBuilder(context.request, config, context.request.query).build();
  const response = await fetch(context.request.aggregator, builtQuery);
  await updateContext(context, response);
  return rows.concat(...response.results);
};

const buildParams = (params: unknown): FetchParams => {
  const validatedParams = paramsValidator.validateSync(params);

  const fetchFunction = 'dataGroups' in validatedParams ? 'dataGroups' : 'dataElements';
  return {
    config: validatedParams,
    fetch: fetchBuilders[fetchFunction](validatedParams),
  };
};

export const buildFetchData = (params: unknown, context: Context) => {
  const builtParams = buildParams(params);
  return (rows: Row[]) => fetchData(rows, builtParams, context);
};

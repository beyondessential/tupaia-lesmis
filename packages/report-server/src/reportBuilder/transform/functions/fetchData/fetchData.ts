/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { yupTsUtils } from '@tupaia/tsutils';
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

const aggregationStringValidator = yup.string().min(1);
const aggregationObjectValidator = yup.object().shape({
  type: yup.string().min(1).required(),
  config: yup.object(),
});

const aggregationValidator = yupTsUtils.describableLazy(
  (value: unknown) => {
    if (typeof value === 'string') {
      return aggregationStringValidator;
    }

    return aggregationObjectValidator;
  },
  [aggregationStringValidator, aggregationObjectValidator],
);

const dateStringValidator = yup.string().min(4);
const dateObjectValidator = yup
  .object()
  .shape({
    unit: periodTypeValidator.required(),
    offset: yup.number(),
    modifier: yup.mixed().oneOf(['start_of', 'end_of']),
    modifierUnit: periodTypeValidator,
  })
  .default(undefined);
const dateSpecsValidator = yupTsUtils.describableLazy(
  (value: unknown) => {
    if (typeof value === 'string') {
      return dateStringValidator;
    }

    return dateObjectValidator;
  },
  [dateStringValidator, dateObjectValidator],
);

const organisationUnitsStringValidator = yup.string().required();
const organisationUnitsArrayValidator = yup.array().of(yup.string().required()).required();
const organisationUnitsValidator = yupTsUtils.describableLazy(
  (value: unknown) => {
    if (typeof value === 'string') {
      return organisationUnitsStringValidator;
    }

    return organisationUnitsArrayValidator;
  },
  [organisationUnitsStringValidator, organisationUnitsArrayValidator],
);

export const paramsValidator = yup.object().shape(
  {
    dataElements: dataElementValidator,
    dataGroups: dataGroupValidator,
    aggregations: yup.array().of(aggregationValidator as any), // https://github.com/jquense/yup/issues/1283#issuecomment-786559444
    organisationUnits: organisationUnitsValidator,
    startDate: dateSpecsValidator,
    endDate: dateSpecsValidator,
  },
  [['dataElements', 'dataGroups']],
);

const fetchData = async (rows: Row[], params: FetchParams, context: Context) => {
  const { config, fetch } = params;
  const builtQuery = await new QueryBuilder(rows, context, config, context.request.query).build();
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

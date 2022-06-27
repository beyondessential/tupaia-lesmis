/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { FetchReportQuery, ReportConfig } from '../../../../types';
import { ReportServerAggregator } from '../../../../aggregator';
import { FetchResponse } from './types';
import { fetchBuilders } from './functions';
import { Context, updateContext } from '../../../context';
import { Row } from '../../../types';

type FetchConfig = ReportConfig['fetch'];

type FetchParams = {
  call: (aggregator: ReportServerAggregator, query: FetchReportQuery) => Promise<FetchResponse>;
};

const fetchData = async (rows: Row[], params: FetchParams, context: Context) => {
  const response = await params.call(context.request.aggregator, context.request.query);
  await updateContext(context, response);
  return rows.concat(...response.results);
};

const buildParams = (params: unknown): FetchParams => {
  const fetchFunction = 'dataGroups' in params ? 'dataGroups' : 'dataElements';

  return {
    call: fetchBuilders[fetchFunction](params),
  };
};

export const buildFetchData = (params: unknown, context: Context) => {
  const builtParams = buildParams(params);
  return (rows: Row[]) => fetchData(rows, builtParams, context);
};

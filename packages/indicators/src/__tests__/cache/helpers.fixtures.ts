/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { FetchOptions, Aggregation } from '../../types';
import { IndicatorAnalytic } from '../../cache/types';

type DeriveAnalyticDimensionsFixture = {
  fetchOptions: FetchOptions;
  indicatorAggregations: Record<string, Aggregation[]>;
  analyticDimensions: IndicatorAnalytic[];
};

export const DERIVE_ANALYTIC_DIMENSIONS_FIXTURES: DeriveAnalyticDimensionsFixture[] = [
  {
    fetchOptions: {
      organisationUnit: 'TO',
      startDate: '2020-01-01',
      endDate: '2020-01-08',
    },
    indicatorAggregations: { BCD1: [{ type: 'FINAL_EACH_WEEK' }] },
    analyticDimensions: [
      {
        period: '2020W01',
        organisationUnit: 'TO',
        inputs: {
          BCD1: {
            periods: [
              '20200101',
              '20200102',
              '20200103',
              '20200104',
              '20200105',
              '20200106',
              '20200107',
            ],
            organisationUnits: ['TO'],
            aggregations: [{ type: 'FINAL_EACH_WEEK' }],
          },
        },
      },
      {
        period: '2020W02',
        organisationUnit: 'TO',
        inputs: {
          BCD1: {
            periods: ['20200108'],
            organisationUnits: ['TO'],
            aggregations: [{ type: 'FINAL_EACH_WEEK' }],
          },
        },
      },
    ],
  },
];

type DeriveFetchOptionsFixture = {
  dimensions: IndicatorAnalytic[];
  fetchOptions: FetchOptions;
};

export const DERIVE_FETCH_OPTIONS_FIXTURES: DeriveFetchOptionsFixture[] = [
  {
    dimensions: [
      {
        period: '2020W01',
        organisationUnit: 'TO',
        inputs: {
          BCD1: {
            periods: [
              '20200101',
              '20200102',
              '20200103',
              '20200104',
              '20200105',
              '20200106',
              '20200107',
            ],
            organisationUnits: ['TO'],
            aggregations: [{ type: 'FINAL_EACH_WEEK' }],
          },
          BCD2: {
            periods: [
              '20200101',
              '20200102',
              '20200103',
              '20200104',
              '20200105',
              '20200106',
              '20200107',
            ],
            organisationUnits: ['TO'],
            aggregations: [{ type: 'FINAL_EACH_WEEK' }],
          },
        },
      },
      {
        period: '2020W02',
        organisationUnit: 'TO',
        inputs: {
          BCD1: {
            periods: ['20200108'],
            organisationUnits: ['TO'],
            aggregations: [{ type: 'FINAL_EACH_WEEK' }],
          },
        },
      },
    ],
    fetchOptions: {
      organisationUnitCodes: ['TO'],
      startDate: '2020-01-01',
      endDate: '2020-01-08',
    },
  },
];

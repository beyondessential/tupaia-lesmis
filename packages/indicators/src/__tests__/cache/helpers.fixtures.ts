/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { FetchOptions, Aggregation, Analytic } from '../../types';
import { AnalyticDimension } from '../../cache/types';

type DeriveAnalyticDimensionsFixture = {
  dataElements: string[];
  fetchOptions: FetchOptions;
  aggregations: Aggregation[];
  analyticDimensions: AnalyticDimension[];
  adjustedAggregations: Aggregation[];
};

export const DERIVE_ANALYTIC_DIMENSIONS_FIXTURES: DeriveAnalyticDimensionsFixture[] = [
  {
    dataElements: ['BCD1'],
    fetchOptions: {
      organisationUnit: 'TO',
      startDate: '2020-01-01',
      endDate: '2020-01-08',
    },
    aggregations: [{ type: 'FINAL_EACH_WEEK' }],
    analyticDimensions: [
      {
        period: '2020W01',
        organisationUnit: 'TO',
        inputPeriods: {
          BCD1: [
            '20200101',
            '20200102',
            '20200103',
            '20200104',
            '20200105',
            '20200106',
            '20200107',
          ],
        },
        inputOrganisationUnits: {
          BCD1: ['TO'],
        },
      },
      {
        period: '2020W02',
        organisationUnit: 'TO',
        inputPeriods: { BCD1: ['20200108'] },
        inputOrganisationUnits: { BCD1: ['TO'] },
      },
    ],
    adjustedAggregations: [{ type: 'FINAL_EACH_WEEK' }],
  },
];

type MergeAnalyticDimensionsFixture = {
  a: AnalyticDimension[];
  b: AnalyticDimension[];
  mergedDimensions: AnalyticDimension[];
};

export const MERGE_ANALYTIC_DIMENSIONS_FIXTURES: MergeAnalyticDimensionsFixture[] = [
  {
    a: [
      {
        period: '2020W01',
        organisationUnit: 'TO',
        inputPeriods: {
          BCD1: [
            '20200101',
            '20200102',
            '20200103',
            '20200104',
            '20200105',
            '20200106',
            '20200107',
          ],
        },
        inputOrganisationUnits: {
          BCD1: ['TO'],
        },
      },
      {
        period: '2020W02',
        organisationUnit: 'TO',
        inputPeriods: { BCD1: ['20200108'] },
        inputOrganisationUnits: { BCD1: ['TO'] },
      },
    ],
    b: [
      {
        period: '2020W01',
        organisationUnit: 'TO',
        inputPeriods: {
          BCD2: [
            '20200101',
            '20200102',
            '20200103',
            '20200104',
            '20200105',
            '20200106',
            '20200107',
          ],
        },
        inputOrganisationUnits: { BCD2: ['TO'] },
      },
    ],
    mergedDimensions: [
      {
        period: '2020W01',
        organisationUnit: 'TO',
        inputPeriods: {
          BCD1: [
            '20200101',
            '20200102',
            '20200103',
            '20200104',
            '20200105',
            '20200106',
            '20200107',
          ],
          BCD2: [
            '20200101',
            '20200102',
            '20200103',
            '20200104',
            '20200105',
            '20200106',
            '20200107',
          ],
        },
        inputOrganisationUnits: {
          BCD1: ['TO'],
          BCD2: ['TO'],
        },
      },
      {
        period: '2020W02',
        organisationUnit: 'TO',
        inputPeriods: {
          BCD1: ['20200108'],
        },
        inputOrganisationUnits: {
          BCD1: ['TO'],
        },
      },
    ],
  },
];

type DeriveFetchOptionsFixture = {
  dimensions: AnalyticDimension[];
  fetchOptions: FetchOptions;
};

export const DERIVE_FETCH_OPTIONS_FIXTURES: DeriveFetchOptionsFixture[] = [
  {
    dimensions: [
      {
        period: '2020W01',
        organisationUnit: 'TO',
        inputPeriods: {
          BCD1: [
            '20200101',
            '20200102',
            '20200103',
            '20200104',
            '20200105',
            '20200106',
            '20200107',
          ],
          BCD2: [
            '20200101',
            '20200102',
            '20200103',
            '20200104',
            '20200105',
            '20200106',
            '20200107',
          ],
        },
        inputOrganisationUnits: {
          BCD1: ['TO'],
          BCD2: ['TO'],
        },
      },
      {
        period: '2020W02',
        organisationUnit: 'TO',
        inputPeriods: {
          BCD1: ['20200108'],
        },
        inputOrganisationUnits: {
          BCD1: ['TO'],
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

type DeriveCacheRelations = {
  analytics: Analytic[];
  requestedDimensions: AnalyticDimension[];
  fetchOptions: FetchOptions;
};

export const DERIVE_FETCH_OPTIONS_FIXTURES: DeriveFetchOptionsFixture[] = [
  {
    dimensions: [
      {
        period: '2020W01',
        organisationUnit: 'TO',
        inputPeriods: {
          BCD1: [
            '20200101',
            '20200102',
            '20200103',
            '20200104',
            '20200105',
            '20200106',
            '20200107',
          ],
          BCD2: [
            '20200101',
            '20200102',
            '20200103',
            '20200104',
            '20200105',
            '20200106',
            '20200107',
          ],
        },
        inputOrganisationUnits: {
          BCD1: ['TO'],
          BCD2: ['TO'],
        },
      },
      {
        period: '2020W02',
        organisationUnit: 'TO',
        inputPeriods: {
          BCD1: ['20200108'],
        },
        inputOrganisationUnits: {
          BCD1: ['TO'],
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

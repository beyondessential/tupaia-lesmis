/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { Aggregation } from '../../types';
import { AnalyticDimension } from '../../cache/types';

type AnalyticDimensionTransformFixture = {
  inputDimensions: AnalyticDimension[];
  aggregation: Aggregation;
  outputDimensions: AnalyticDimension[];
};

export const ANALYTIC_DIMENSION_TRANSFORM_FIXTURES: AnalyticDimensionTransformFixture[] = [
  {
    inputDimensions: [
      {
        period: '20200101',
        organisationUnit: 'TO',
        inputPeriods: ['20200101'],
        inputOrganisationUnits: ['TO'],
      },
      {
        period: '20200102',
        organisationUnit: 'TO',
        inputPeriods: ['20200102'],
        inputOrganisationUnits: ['TO'],
      },
    ],
    aggregation: {
      type: 'FINAL_EACH_WEEK',
      config: {},
    },
    outputDimensions: [
      {
        period: '2020W01',
        organisationUnit: 'TO',
        inputPeriods: ['20200101', '20200102'],
        inputOrganisationUnits: ['TO'],
      },
    ],
  },
];

/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { convertToPeriod } from '@tupaia/utils';

import { Aggregation } from '../types';
import { FlatAnalyticDimension } from './types';

const AGGREGATION_DIMENSION_TRANSFORMERS = {
  FINAL_EACH_DAY: {
    periodTransformer: (period: string) => convertToPeriod(period, 'DAY'),
    entityTransformer: (entityCode: string) => entityCode,
  },
  FINAL_EACH_WEEK: {
    periodTransformer: (period: string) => convertToPeriod(period, 'WEEK'),
    entityTransformer: (entityCode: string) => entityCode,
  },
  SUM_EACH_WEEK: {
    periodTransformer: (period: string) => convertToPeriod(period, 'WEEK'),
    entityTransformer: (entityCode: string) => entityCode,
  },
  FINAL_EACH_MONTH: {
    periodTransformer: (period: string) => convertToPeriod(period, 'MONTH'),
    entityTransformer: (entityCode: string) => entityCode,
  },
  SUM_PER_PERIOD_PER_ORG_GROUP: {
    periodTransformer: (period: string) => period,
    entityTransformer: (entityCode: string, orgUnitMap?: Record<string, { code: string }>) =>
      orgUnitMap ? orgUnitMap[entityCode].code : entityCode,
  },
  FINAL_EACH_YEAR: {
    periodTransformer: (period: string) => convertToPeriod(period, 'YEAR'),
    entityTransformer: (entityCode: string) => entityCode,
  },
};

export const transform = (dimensions: FlatAnalyticDimension[], aggregation: Aggregation) => {
  const { type, config } = aggregation;
  if (!(type in AGGREGATION_DIMENSION_TRANSFORMERS)) {
    throw new Error(
      `Aggregation type must be one of: ${Object.keys(
        AGGREGATION_DIMENSION_TRANSFORMERS,
      )}, but got: ${type}`,
    );
  }
  const { periodTransformer, entityTransformer } = AGGREGATION_DIMENSION_TRANSFORMERS[
    type as keyof typeof AGGREGATION_DIMENSION_TRANSFORMERS
  ];

  const orgUnitMap = config?.orgUnitMap || undefined;
  const newDimensionsMap = dimensions.reduce((map, dimension) => {
    const newPeriod = periodTransformer(dimension.period);
    const newEntity = entityTransformer(dimension.organisationUnit, orgUnitMap);
    const newDimensionKey = `${newPeriod}_${newEntity}`;
    if (map[newDimensionKey]) {
      map[newDimensionKey].inputPeriods.push(dimension.period);
      map[newDimensionKey].inputOrganisationUnits.push(dimension.organisationUnit);
    } else {
      // eslint-disable-next-line no-param-reassign
      map[newDimensionKey] = {
        period: newPeriod,
        organisationUnit: newEntity,
        inputPeriods: [dimension.period],
        inputOrganisationUnits: [dimension.organisationUnit],
      };
    }
    return map;
  }, {} as Record<string, FlatAnalyticDimension>);
  return Object.values(newDimensionsMap);
};

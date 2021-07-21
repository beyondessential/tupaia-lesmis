/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { addOffsetToPeriod } from '@tupaia/aggregator';
import { convertToPeriod } from '@tupaia/utils';

import { Aggregation } from '../types';

const AGGREGATION_PERIOD_TRANSFORMERS = {
  FINAL_EACH_DAY: (period: string) => convertToPeriod(period, 'DAY'),
  FINAL_EACH_WEEK: (period: string) => convertToPeriod(period, 'WEEK'),
  SUM_EACH_WEEK: (period: string) => convertToPeriod(period, 'WEEK'),
  FINAL_EACH_MONTH: (period: string) => convertToPeriod(period, 'MONTH'),
  FINAL_EACH_YEAR: (period: string) => convertToPeriod(period, 'YEAR'),
  OFFSET_PERIOD: addOffsetToPeriod,
};

const AGGREGATION_ENTITY_TRANSFORMERS = {
  SUM_PER_PERIOD_PER_ORG_GROUP: (
    entityCode: string,
    orgUnitMap?: Record<string, { code: string }>,
  ) => (orgUnitMap ? orgUnitMap[entityCode].code : entityCode),
};

export const transform = (
  mappers: { periodMap: Record<string, string[]>; entityMap: Record<string, string[]> },
  aggregation: Aggregation,
) => {
  const { periodMap, entityMap } = mappers;
  const { type, config } = aggregation;
  if (!(type in AGGREGATION_PERIOD_TRANSFORMERS) && !(type in AGGREGATION_ENTITY_TRANSFORMERS)) {
    throw new Error(
      `Aggregation type must be one of: ${Object.keys(
        AGGREGATION_PERIOD_TRANSFORMERS,
      )}, but got: ${type}`,
    );
  }
  const periodTransformer = AGGREGATION_PERIOD_TRANSFORMERS[type];
  const entityTransformer = AGGREGATION_ENTITY_TRANSFORMERS[type];

  const newPeriodMap = !periodTransformer
    ? periodMap
    : Object.entries(periodMap).reduce((map, [outputPeriod, inputPeriods]) => {
        const newPeriod = periodTransformer(outputPeriod, config);
        if (map[newPeriod]) {
          map[newPeriod].push(...inputPeriods);
        } else {
          // eslint-disable-next-line no-param-reassign
          map[newPeriod] = inputPeriods;
        }
        return map;
      }, {} as Record<string, string[]>);

  const newEntityMap = !entityTransformer
    ? entityMap
    : Object.entries(entityMap).reduce((map, [outputEntity, inputEntities]) => {
        const newEntity = entityTransformer(outputEntity, config?.orgUnitMap);
        if (map[newEntity]) {
          map[newEntity].push(...inputEntities);
        } else {
          // eslint-disable-next-line no-param-reassign
          map[newEntity] = inputEntities;
        }
        return map;
      }, {} as Record<string, string[]>);

  return { periodMap: newPeriodMap, entityMap: newEntityMap };
};

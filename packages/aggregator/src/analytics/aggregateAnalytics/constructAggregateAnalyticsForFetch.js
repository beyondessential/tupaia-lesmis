/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import groupBy from 'lodash.groupby';

import {
  convertPeriodStringToDateRange,
  convertDateRangeToPeriods,
  convertToPeriod,
} from '@tupaia/utils';

import { AggregateAnalytic } from './AggregateAnalytic';

const AGGREGATION_CHAIN_BUILDERS = {
  FINAL_EACH_DAY: {
    type: 'MOST_RECENT_PER_DAY_PER_SOURCE_ENTITY',
    periodAggregationFunc: period => convertToPeriod(period, 'DAY'),
    entityAggregationFunc: orgUnitMap => entity => entity,
  },
  FINAL_EACH_WEEK: {
    type: 'MOST_RECENT_PER_WEEK_PER_SOURCE_ENTITY',
    periodAggregationFunc: period => convertToPeriod(period, 'WEEK'),
    entityAggregationFunc: orgUnitMap => entity => entity,
  },
  SUM_EACH_WEEK: {
    type: 'SUM_PER_WEEK_PER_SOURCE_ENTITY',
    periodAggregationFunc: period => convertToPeriod(period, 'WEEK'),
    entityAggregationFunc: orgUnitMap => entity => entity,
  },
  FINAL_EACH_MONTH: {
    type: 'MOST_RECENT_PER_MONTH_PER_SOURCE_ENTITY',
    periodAggregationFunc: period => convertToPeriod(period, 'MONTH'),
    entityAggregationFunc: orgUnitMap => entity => entity,
  },
  SUM_PER_PERIOD_PER_ORG_GROUP: {
    type: 'SUM_PER_SOURCE_PERIOD_PER_ENTITY',
    periodAggregationFunc: period => period,
    entityAggregationFunc: orgUnitMap => entity => orgUnitMap[entity].code,
  },
  FINAL_EACH_YEAR: {
    type: 'MOST_RECENT_PER_YEAR_PER_SOURCE_ENTITY',
    periodAggregationFunc: period => convertToPeriod(period, 'YEAR'),
    entityAggregationFunc: orgUnitMap => entity => entity,
  },
};

export const constructAggregateAnalyticsForFetch = (fetchOptions, aggregations) => {
  let { period: requestPeriod, organisationUnitCodes: sourceEntities } = fetchOptions;
  let sourcePeriods = convertDateRangeToPeriods(
    ...convertPeriodStringToDateRange(requestPeriod),
    'DAY',
  );

  const aggregationChainParts = aggregations.map(aggregation => {
    const aggregationChainBuilder =
      AGGREGATION_CHAIN_BUILDERS[aggregation] || AGGREGATION_CHAIN_BUILDERS[aggregation.type];
    if (!aggregationChainBuilder) {
      throw new Error(
        `No AggregationChainBuilder configured for: ${aggregation?.type || aggregation}`,
      );
    }

    const periodMap = groupBy(sourcePeriods, aggregationChainBuilder.periodAggregationFunc);
    const entityMap = groupBy(
      sourceEntities,
      aggregationChainBuilder.entityAggregationFunc(aggregation?.config?.orgUnitMap),
    );

    console.log(entityMap);

    sourcePeriods = Object.keys(periodMap);
    sourceEntities = Object.keys(entityMap);

    return { type: aggregationChainBuilder.type, periodMap, entityMap };
  });

  const {
    type: finalType,
    periodMap: finalPeriodMap,
    entityMap: finalEntityMap,
  } = aggregationChainParts[aggregationChainParts.length - 1];

  const aggregationChains = [];
  Object.entries(finalPeriodMap).forEach(([aggregatePeriod, sourcePeriods]) => {
    Object.entries(finalEntityMap).forEach(([aggregateEntity, sourceEntities]) => {
      const aggregationChain = [
        {
          type: finalType,
          periodMap: { [aggregatePeriod]: sourcePeriods },
          entityMap: { [aggregateEntity]: sourceEntities },
        },
      ];

      aggregationChainParts
        .slice(0, -1)
        .reverse()
        .forEach(chainPart => {
          const newChainLink = { type: chainPart.type };
          newChainLink.periodMap = Object.values(aggregationChain[0].periodMap)
            .flat()
            .reduce((periodMap, aggregatePeriod) => {
              periodMap[aggregatePeriod] = chainPart.periodMap[aggregatePeriod];
              return periodMap;
            }, {});
          newChainLink.entityMap = Object.values(aggregationChain[0].entityMap)
            .flat()
            .reduce((entityMap, aggregateEntity) => {
              entityMap[aggregateEntity] = chainPart.entityMap[aggregateEntity];
              return entityMap;
            }, {});
          aggregationChain.unshift(newChainLink);
        });

      aggregationChains.push(aggregationChain);
    });
  });

  return aggregationChains.map(aggregationChain => new AggregateAnalytic(aggregationChain));
};

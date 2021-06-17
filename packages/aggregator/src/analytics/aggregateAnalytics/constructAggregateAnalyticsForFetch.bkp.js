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
import { SourceAnalytic } from './SourceAnalytic';

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

export const constructAggregateAnalyticsForFetch = (
  dataElementCodes,
  fetchOptions,
  aggregations,
) => {
  const { period: requestPeriod, organisationUnitCodes: sourceEntities } = fetchOptions;
  const sourcePeriods = convertDateRangeToPeriods(
    ...convertPeriodStringToDateRange(requestPeriod),
    'DAY',
  );

  const analyticsByLevel = [[]];
  dataElementCodes.forEach(dataElementCode => {
    sourcePeriods.forEach(period => {
      sourceEntities.forEach(entity => {
        analyticsByLevel[0].push(new SourceAnalytic(dataElementCode, period, entity));
      });
    });
  });

  aggregations.forEach((aggregation, index) => {
    const aggregationChainBuilder =
      AGGREGATION_CHAIN_BUILDERS[aggregation] || AGGREGATION_CHAIN_BUILDERS[aggregation.type];
    if (!aggregationChainBuilder) {
      throw new Error(
        `No AggregationChainBuilder configured for: ${aggregation?.type || aggregation}`,
      );
    }

    const inputAnalytics = analyticsByLevel[index];

    const analyticMap = groupBy(
      inputAnalytics,
      analytic =>
        `${analytic.dataElement}::${aggregationChainBuilder.periodAggregationFunc(
          analytic.outputPeriod,
        )}::${aggregationChainBuilder.entityAggregationFunc(aggregation?.config?.orgUnitMap)(
          analytic.outputEntity,
        )}`,
    );
    const nextLevelAnalytics = Object.entries(analyticMap).map(
      ([analyticKey, groupedAnalytics]) => {
        const [dataElement, outputPeriod, outputEntity] = analyticKey.split('::');
        return new AggregateAnalytic(
          dataElement,
          groupedAnalytics.map(analytic => analytic.toCacheKey()),
          groupedAnalytics.map(analytic => analytic.outputPeriod),
          outputPeriod,
          groupedAnalytics.map(analytic => analytic.outputEntity),
          outputEntity,
          aggregationChainBuilder.type,
        );
      },
    );

    analyticsByLevel.push(nextLevelAnalytics);
  });

  return analyticsByLevel.reverse();
};

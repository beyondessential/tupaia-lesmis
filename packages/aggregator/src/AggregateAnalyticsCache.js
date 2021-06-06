/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

const redis = require('redis');
const { promisify } = require('util');

import sortby from 'lodash.sortby';
import { adjustOptionsToAggregationList, constructAggregateAnalyticsForFetch } from './analytics';

const NO_DATA = 'no_data';

export class AggregateAnalyticsCache {
  constructor(aggregator) {
    this.aggregator = aggregator;
    this.cacheClient = redis.createClient();
  }

  async fetchAnalytics(dataElementCodes, fetchOptions, aggregationOptions = {}) {
    const fetchFromCache = promisify(this.cacheClient.get).bind(this.cacheClient);

    const [adjustedFetchOptions, adjustedAggregationOptions] = await adjustOptionsToAggregationList(
      this.aggregator.context,
      fetchOptions,
      aggregationOptions,
    );

    const { aggregations } = adjustedAggregationOptions;

    const aggregateAnalytics = constructAggregateAnalyticsForFetch(
      adjustedFetchOptions,
      aggregations,
    );

    const cacheRequests = [];

    // Initalize cachedAnalytics with cacheKeys
    dataElementCodes.forEach(dataElementCode => {
      aggregateAnalytics.forEach(aggregateAnalytic =>
        cacheRequests.push({
          cacheKey: createCacheKey(dataElementCode, aggregateAnalytic),
          dataElementCode,
          aggregateAnalytic,
        }),
      );
    });

    const cacheResults = await Promise.all(
      cacheRequests.map(async ({ cacheKey, ...restOfRequest }) => ({
        ...restOfRequest,
        cacheKey,
        value: await fetchFromCache(cacheKey).then(parseCacheValue),
      })),
    );

    const analyticsFromCache = Object.values(cacheResults)
      .filter(({ value }) => value !== null)
      .filter(({ value }) => value !== NO_DATA)
      .map(({ value, aggregateAnalytic, dataElementCode }) => {
        return {
          dataElement: dataElementCode,
          period: aggregateAnalytic.getAggregatePeriod(),
          organisationUnit: aggregateAnalytic.getAggregateEntity(),
          value,
        };
      });

    console.log('analytics from cache:', analyticsFromCache);

    const uncachedResults = Object.values(cacheResults).filter(({ value }) => value === null);

    if (uncachedResults.length < 1) {
      return {
        results: sortby(analyticsFromCache, ['period']),
      };
    }

    const uncachedDataElements = new Set();
    const uncachedPeriods = new Set();
    const uncachedEntities = new Set();

    uncachedResults.forEach(({ dataElementCode, aggregateAnalytic }) => {
      uncachedDataElements.add(dataElementCode);
      aggregateAnalytic.getSourcePeriods().forEach(uncachedPeriods.add, uncachedPeriods);
      aggregateAnalytic.getSourceEntities().forEach(uncachedEntities.add, uncachedEntities);
    });

    console.log(
      'fetching for uncached values',
      [...uncachedDataElements],
      [...uncachedPeriods],
      [...uncachedEntities],
    );

    const { results } = await this.aggregator.fetchAnalytics(
      [...uncachedDataElements],
      {
        ...adjustedFetchOptions,
        period: [...uncachedPeriods].join(';'),
        organisationUnitCodes: [...uncachedEntities],
      },
      adjustedAggregationOptions,
    );

    uncachedResults.forEach(({ dataElementCode, aggregateAnalytic, cacheKey }) => {
      const matchingResult = results.find(
        result =>
          result.dataElement === dataElementCode &&
          result.period === aggregateAnalytic.getAggregatePeriod() &&
          result.organisationUnit === aggregateAnalytic.getAggregateEntity(),
      );

      if (matchingResult) {
        this.cacheClient.set(cacheKey, createCacheValue(matchingResult.value), redis.print);
      } else {
        this.cacheClient.set(cacheKey, createCacheValue(NO_DATA), redis.print);
      }
    });

    return {
      results: sortby([...analyticsFromCache, ...results], ['period']),
    };
  }
}

const createCacheKey = (dataElementCode, aggregateAnalytic) =>
  `${dataElementCode}|${aggregateAnalytic.toCacheKey()}`;

const createCacheValue = value => `${value}::${typeof value}`;

const parseCacheValue = cacheValue => {
  if (cacheValue === null) {
    return null;
  }

  const [value, valueType] = cacheValue.split('::');
  if (valueType === 'number') {
    return parseFloat(value);
  }
  return value;
};

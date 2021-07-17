/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import ObjectHasher, { Hasher } from 'node-object-hash';

import { Aggregation, AnalyticValue } from '../types';

import { RedisCacheClient, RealRedisCacheClient } from './RedisCacheClient';
import { AnalyticDimension } from './types';

const ANALYTIC_PREFIX = 'ANALYTIC';
const KEY_JOINER = '|';

const NO_DATA = 'NO_DATA';

export class IndicatorCache {
  private readonly redisClient: RedisCacheClient;

  private readonly hasher: Hasher;

  constructor(redisClient: RedisCacheClient = new RealRedisCacheClient()) {
    this.redisClient = redisClient;
    this.hasher = ObjectHasher();
  }

  public async getAnalytics(
    indicatorCode: string,
    dimensions: AnalyticDimension[],
    aggregationsByDataElements: Record<string, Aggregation[]>,
  ) {
    const aggregationsHash = this.hasher.hash(aggregationsByDataElements);
    const resultsFromCache = await Promise.all(
      dimensions.map(async dimension => ({
        ...dimension,
        value: await this.redisClient.get(
          this.buildAnalyticKey(indicatorCode, dimension, aggregationsHash),
        ),
      })),
    );
    const hitResults: AnalyticValue[] = [];
    const missResults: AnalyticDimension[] = [];
    resultsFromCache.forEach(cacheResult => {
      const { value, period, organisationUnit, inputPeriods, inputOrganisationUnits } = cacheResult;
      if (value !== null) {
        console.log(`cache hit! ${indicatorCode}|${period}|${organisationUnit} = ${value}`);
        if (value !== NO_DATA) {
          hitResults.push({ organisationUnit, period, value: this.parseCacheValue(value) });
        }
      } else {
        console.log(`cache miss! ${indicatorCode}|${period}|${organisationUnit}`);
        missResults.push({ period, organisationUnit, inputPeriods, inputOrganisationUnits });
      }
    });

    return { hit: hitResults, miss: missResults };
  }

  public async storeAnalytics(
    indicatorCode: string,
    dimensions: AnalyticDimension[],
    aggregationsByDataElements: Record<string, Aggregation[]>,
    analytics: AnalyticValue[],
  ) {
    const resultsFromAnalytics = dimensions.map(dimension => ({
      ...dimension,
      value: `${
        analytics.find(
          analytic =>
            analytic.organisationUnit === dimension.organisationUnit &&
            analytic.period === dimension.period,
        )?.value || NO_DATA
      }`,
    }));
    const aggregationsHash = this.hasher.hash(aggregationsByDataElements);
    resultsFromAnalytics.forEach(result => {
      console.log(
        `saving: ${indicatorCode}|${result.period}|${result.organisationUnit} = ${result.value}`,
      );
      this.redisClient.set(
        this.buildAnalyticKey(indicatorCode, result, aggregationsHash),
        result.value,
      );
    });
  }

  private parseCacheValue(cacheValue: string) {
    const parsedValue = parseFloat(cacheValue);
    if (isNaN(parsedValue)) {
      throw new Error('analyticArithmetic indicator cache values must be numeric');
    }

    return parsedValue;
  }

  private buildAnalyticKey(
    indicatorCode: string,
    dimension: AnalyticDimension,
    aggregationsHash: string,
  ) {
    return [
      ANALYTIC_PREFIX,
      indicatorCode,
      dimension.period,
      dimension.organisationUnit,
      `inputPeriods:${this.hasher.hash(dimension.inputPeriods)}`,
      `inputOrganisationUnits:${this.hasher.hash(dimension.inputOrganisationUnits)}`,
      `aggregations:${aggregationsHash}`,
    ].join(KEY_JOINER);
  }
}

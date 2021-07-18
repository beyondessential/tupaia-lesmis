/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import ObjectHasher, { Hasher } from 'node-object-hash';

import { AnalyticValue } from '../types';

import { RedisCacheClient, RealRedisCacheClient } from './RedisCacheClient';
import { IndicatorAnalytic } from './types';

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

  public async getAnalytics(indicatorCode: string, indicatorAnalytics: IndicatorAnalytic[]) {
    const resultsFromCache = await Promise.all(
      indicatorAnalytics.map(async dimension => ({
        ...dimension,
        value: await this.redisClient.get(this.buildAnalyticKey(indicatorCode, dimension)),
      })),
    );
    const hitResults: AnalyticValue[] = [];
    const missResults: IndicatorAnalytic[] = [];
    resultsFromCache.forEach(cacheResult => {
      const { value, period, organisationUnit, inputs } = cacheResult;
      if (value !== null) {
        console.log(`cache hit! ${indicatorCode}|${period}|${organisationUnit} = ${value}`);
        if (value !== NO_DATA) {
          hitResults.push({ organisationUnit, period, value: this.parseCacheValue(value) });
        }
      } else {
        console.log(`cache miss! ${indicatorCode}|${period}|${organisationUnit}`);
        missResults.push({ period, organisationUnit, inputs });
      }
    });

    return { hits: hitResults, misses: missResults };
  }

  public async storeAnalytics(
    indicatorCode: string,
    requestedAnalytics: IndicatorAnalytic[],
    returnedAnalytics: AnalyticValue[],
  ) {
    const resultsFromAnalytics = requestedAnalytics.map(requested => ({
      ...requested,
      value: `${
        returnedAnalytics.find(
          returned =>
            returned.organisationUnit === requested.organisationUnit &&
            returned.period === requested.period,
        )?.value || NO_DATA
      }`,
    }));
    resultsFromAnalytics.forEach(result => {
      console.log(
        `saving: ${indicatorCode}|${result.period}|${result.organisationUnit} = ${result.value}`,
      );
      this.redisClient.set(this.buildAnalyticKey(indicatorCode, result), result.value);
    });
  }

  private parseCacheValue(cacheValue: string) {
    const parsedValue = parseFloat(cacheValue);
    if (isNaN(parsedValue)) {
      throw new Error('analyticArithmetic indicator cache values must be numeric');
    }

    return parsedValue;
  }

  private buildAnalyticKey(indicatorCode: string, dimension: IndicatorAnalytic) {
    return [
      ANALYTIC_PREFIX,
      indicatorCode,
      dimension.period,
      dimension.organisationUnit,
      `inputs:${this.hasher.hash(dimension.inputs)}`,
    ].join(KEY_JOINER);
  }
}

/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { AnalyticValue } from '../types';

import { RedisCacheClient, RealRedisCacheClient } from './RedisCacheClient';
import { IndicatorAnalytic, IndicatorCacheEntry } from './types';

const ANALYTIC_PREFIX = 'ANALYTIC';
const RELATION_PREFIX = 'RELATION';
const KEY_JOINER = '|';

const NO_DATA = 'NO_DATA';

export class IndicatorCache {
  private readonly redisClient: RedisCacheClient;

  constructor(redisClient: RedisCacheClient = RealRedisCacheClient.getInstance()) {
    this.redisClient = redisClient;
  }

  public async getAnalytics(indicatorCode: string, cacheEntries: IndicatorCacheEntry[]) {
    const start = Date.now();
    const cacheKeys = cacheEntries.map(entry => this.buildAnalyticKey(indicatorCode, entry));
    const resultsFromCache = await this.redisClient.mGet(cacheKeys);
    const resultsForAnalytics = cacheEntries.map((entry, index) => ({
      ...entry,
      value: resultsFromCache[index],
    }));

    const end = Date.now();
    console.log(`Reading ${cacheEntries.length} items from cache took: ${end - start}ms`);

    const hitResults: AnalyticValue[] = [];
    const missResults: IndicatorCacheEntry[] = [];
    resultsForAnalytics.forEach(cacheResult => {
      const { value, period, organisationUnit, hierarchy } = cacheResult;
      if (value !== null) {
        if (value !== NO_DATA) {
          hitResults.push({ organisationUnit, period, value: this.parseCacheValue(value) });
        }
      } else {
        missResults.push({ period, organisationUnit, hierarchy });
      }
    });

    return { hits: hitResults, misses: missResults };
  }

  public async storeAnalytics(
    indicatorCode: string,
    requestedAnalytics: IndicatorCacheEntry[],
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

    const keyAndValues = resultsFromAnalytics.reduce((array, analytic) => {
      // eslint-disable-next-line no-param-reassign
      array.push(this.buildAnalyticKey(indicatorCode, analytic), analytic.value);
      return array;
    }, [] as string[]);
    console.log('storing analytics', keyAndValues.length / 2);

    this.redisClient.mSet(keyAndValues);
  }

  public async storeRelations(
    indicatorCode: string,
    indicatorAnalyticRelations: IndicatorAnalytic[],
  ) {
    const start = Date.now();
    console.log('building relation keys');
    const dataElementInputs: Record<string, string[]> = {};
    const periodInputs: Record<string, string[]> = {};
    const organisationUnitInputs: Record<string, string[]> = {};
    indicatorAnalyticRelations.forEach(analytic => {
      const relationValue = this.buildAnalyticKey(indicatorCode, analytic);
      analytic.inputs.forEach(({ periods, organisationUnits, dataElements }) => {
        dataElements.forEach(dataElement => {
          if (dataElementInputs[dataElement]) {
            dataElementInputs[dataElement].push(relationValue);
          } else {
            dataElementInputs[dataElement] = [relationValue];
          }
        });
        periods.forEach(period => {
          if (periodInputs[period]) {
            periodInputs[period].push(relationValue);
          } else {
            periodInputs[period] = [relationValue];
          }
        });
        organisationUnits.forEach(organisationUnit => {
          if (organisationUnitInputs[organisationUnit]) {
            organisationUnitInputs[organisationUnit].push(relationValue);
          } else {
            organisationUnitInputs[organisationUnit] = [relationValue];
          }
        });
      });
    });
    const end = Date.now();
    console.log('Building relation keys took:', end - start, 'ms');

    console.log(`Adding to dataElement relations`);
    Object.entries(dataElementInputs).forEach(([dataElement, relationValues]) => {
      const key = this.buildRelationKey('dataElement', dataElement);
      this.redisClient.sAdd(key, relationValues);
    });

    console.log(`Adding to period relations`);
    Object.entries(periodInputs).forEach(([period, relationValues]) => {
      const key = this.buildRelationKey('period', period);
      this.redisClient.sAdd(key, relationValues);
    });

    console.log(`Adding to orgUnit relations`);
    Object.entries(organisationUnitInputs).forEach(([organisationUnit, relationValues]) => {
      const key = this.buildRelationKey('organisationUnit', organisationUnit);
      this.redisClient.sAdd(key, relationValues);
    });
  }

  private parseCacheValue(cacheValue: string) {
    const parsedValue = parseFloat(cacheValue);
    if (isNaN(parsedValue)) {
      throw new Error('analyticArithmetic indicator cache values must be numeric');
    }

    return parsedValue;
  }

  private buildAnalyticKey(indicatorCode: string, dimension: IndicatorCacheEntry) {
    return [
      ANALYTIC_PREFIX,
      indicatorCode,
      dimension.period,
      dimension.organisationUnit,
      dimension.hierarchy,
    ].join(KEY_JOINER);
  }

  private buildRelationKey(type: 'period' | 'organisationUnit' | 'dataElement', value: string) {
    return [RELATION_PREFIX, type, value].join(KEY_JOINER);
  }

  private buildRelationValue(indicatorCode: string, dimension: IndicatorCacheEntry) {
    return [indicatorCode, dimension.period, dimension.organisationUnit].join(KEY_JOINER);
  }
}

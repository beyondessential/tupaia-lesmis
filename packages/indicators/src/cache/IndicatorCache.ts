/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { AnalyticValue } from '../types';

import { RedisCacheClient, RealRedisCacheClient } from './RedisCacheClient';
import { CacheResponseQueue, IndicatorResponse } from './CacheResponseQueue';
import { IndicatorAnalytic } from './types';

const ANALYTIC_PREFIX = 'ANALYTIC';
const RELATION_PREFIX = 'RELATION';
const KEY_JOINER = '|';

const NO_DATA = 'NO_DATA';

export class IndicatorCache {
  private static instance = new IndicatorCache();

  private readonly redisClient: RedisCacheClient;

  private readonly cacheResponseQueue: CacheResponseQueue;

  private constructor(redisClient: RedisCacheClient = new RealRedisCacheClient()) {
    this.redisClient = redisClient;
    this.cacheResponseQueue = new CacheResponseQueue(async (responses: IndicatorResponse[]) => {
      await this.commitResponsesToRedis(responses);
      await this.storeRelations(responses.map(response => response.requested));
    });
  }

  public static getInstance() {
    return this.instance;
  }

  public async getAnalytics(cacheEntries: IndicatorAnalytic[]) {
    const start = Date.now();
    const cacheKeys = cacheEntries.map(entry => this.buildAnalyticKey(entry));
    const resultsFromCache = await this.redisClient.mGet(cacheKeys);
    const resultsForAnalytics = cacheEntries.map((entry, index) => ({
      ...entry,
      value: resultsFromCache[index],
    }));

    const end = Date.now();

    const hitResults: AnalyticValue[] = [];
    const pendingResults: Promise<AnalyticValue | undefined>[] = [];
    const missResults: IndicatorAnalytic[] = [];
    resultsForAnalytics.forEach(cacheResult => {
      const key = this.buildAnalyticKey(cacheResult);
      const pendingResult = this.cacheResponseQueue.checkQueue(key);
      const { value, ...analytic } = cacheResult;
      const { organisationUnit, period } = analytic;
      if (value !== null) {
        if (value !== NO_DATA) {
          hitResults.push({ organisationUnit, period, value: this.parseCacheValue(value) });
        }
      } else if (pendingResult) {
        pendingResults.push(pendingResult);
      } else {
        missResults.push(analytic);
        this.cacheResponseQueue.enqueue(key);
      }
    });

    return { hits: hitResults, pending: pendingResults, misses: missResults };
  }

  public storeAnalytics(
    requestedAnalytics: IndicatorAnalytic[],
    returnedAnalytics: AnalyticValue[],
  ) {
    requestedAnalytics.forEach(requested => {
      const value = returnedAnalytics.find(
        returned =>
          returned.organisationUnit === requested.organisationUnit &&
          returned.period === requested.period,
      );
      this.cacheResponseQueue.dequeue(this.buildAnalyticKey(requested), requested, value);
    });
  }

  private async commitResponsesToRedis(responses: IndicatorResponse[]) {
    const resultsFromAnalytics = responses.map(({ requested, value }) => ({
      ...requested,
      value: value ? `${value.value}` : NO_DATA,
    }));

    const keyAndValues = resultsFromAnalytics.reduce((array, analytic) => {
      // eslint-disable-next-line no-param-reassign
      array.push(this.buildAnalyticKey(analytic), analytic.value);
      return array;
    }, [] as string[]);
    console.log('storing analytics', keyAndValues.length / 2);

    this.redisClient.mSet(keyAndValues);
  }

  public async deleteAnalytics(keys: string[]) {
    return this.redisClient.del(keys);
  }

  private async storeRelations(indicatorAnalyticRelations: IndicatorAnalytic[]) {
    const start = Date.now();
    const dataElementInputs: Record<string, string[]> = {};
    const periodInputs: Record<string, string[]> = {};
    const organisationUnitInputs: Record<string, string[]> = {};
    indicatorAnalyticRelations.forEach(analytic => {
      const relationValue = this.buildAnalyticKey(analytic);
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

    Object.entries(dataElementInputs).forEach(([dataElement, relationValues]) => {
      const key = this.buildRelationKey('dataElement', dataElement);
      this.redisClient.sAdd(key, relationValues);
    });

    Object.entries(periodInputs).forEach(([period, relationValues]) => {
      const key = this.buildRelationKey('period', period);
      this.redisClient.sAdd(key, relationValues);
    });

    Object.entries(organisationUnitInputs).forEach(([organisationUnit, relationValues]) => {
      const key = this.buildRelationKey('organisationUnit', organisationUnit);
      this.redisClient.sAdd(key, relationValues);
    });
  }

  public async getRelations(dataElement: string, period: string, organisationUnit: string) {
    return this.redisClient.sInter([
      this.buildRelationKey('dataElement', dataElement),
      this.buildRelationKey('period', period),
      this.buildRelationKey('organisationUnit', organisationUnit),
    ]);
  }

  private parseCacheValue(cacheValue: string) {
    const parsedValue = parseFloat(cacheValue);
    if (isNaN(parsedValue)) {
      throw new Error('analyticArithmetic indicator cache values must be numeric');
    }

    return parsedValue;
  }

  private buildAnalyticKey(dimension: IndicatorAnalytic) {
    return [
      ANALYTIC_PREFIX,
      dimension.indicatorCode,
      dimension.period,
      dimension.organisationUnit,
      dimension.inputHash,
    ].join(KEY_JOINER);
  }

  private buildRelationKey(type: 'period' | 'organisationUnit' | 'dataElement', value: string) {
    return [RELATION_PREFIX, type, value].join(KEY_JOINER);
  }

  public static splitAnalyticKey(key: string) {
    const [, dataElement, period, organisationUnit, hierarchy] = key.split(KEY_JOINER);
    return {
      dataElement,
      period,
      organisationUnit,
      hierarchy,
    };
  }
}

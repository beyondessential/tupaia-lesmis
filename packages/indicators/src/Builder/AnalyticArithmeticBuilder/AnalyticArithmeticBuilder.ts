/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import groupBy from 'lodash.groupby';

import { analyticsToAnalyticClusters } from '@tupaia/data-broker';
import { stripFields } from '@tupaia/utils';
import { getExpressionParserInstance } from '../../getExpressionParserInstance';
import {
  Aggregation,
  AggregationList,
  Analytic,
  AnalyticCluster,
  FetchOptions,
  Indicator,
} from '../../types';
import { IndicatorApi } from '../../IndicatorApi';
import {
  IndicatorCache,
  deriveDimensionsAndAggregations,
  mergeAnalyticDimensions,
  deriveFetchOptions,
  AnalyticDimension,
} from '../../cache';
import { Builder } from '../Builder';
import { createBuilder } from '../createBuilder';
import {
  fetchAnalytics,
  validateConfig,
  evaluateFormulaToNumber,
  replaceDataValuesWithDefaults,
  groupKeysByValueJson,
} from '../helpers';
import {
  AnalyticArithmeticConfig,
  configValidators,
  DefaultValue,
  getAggregationListByCode,
} from './config';

/**
 * Config used by the builder. It is essential a fully expanded, verbose version
 * of the indicator config passed in by the user (`ArithmeticConfig`)
 */
type BuilderConfig = {
  readonly formula: string;
  readonly aggregation: Record<string, AggregationList>;
  readonly parameters: Indicator[];
  readonly defaultValues: Record<string, DefaultValue>;
};

const indicatorToBuilderConfig = (indicatorConfig: AnalyticArithmeticConfig): BuilderConfig => {
  const { defaultValues = {}, parameters = [], ...otherFields } = indicatorConfig;

  return {
    ...otherFields,
    defaultValues,
    parameters,
    aggregation: getAggregationListByCode(indicatorConfig),
  };
};

export class AnalyticArithmeticBuilder extends Builder {
  private readonly analyticsCache: IndicatorCache;

  private configCache: BuilderConfig | null = null;

  private paramBuildersByCodeCache: Record<string, Builder> | null = null;

  constructor(api: IndicatorApi, indicator: Indicator) {
    super(api, indicator);

    this.analyticsCache = new IndicatorCache();
  }

  private get config() {
    if (!this.configCache) {
      const config = this.validateConfig();
      this.configCache = indicatorToBuilderConfig(config);
    }
    return this.configCache;
  }

  private get paramBuildersByCode() {
    if (!this.paramBuildersByCodeCache) {
      this.paramBuildersByCodeCache = Object.fromEntries(
        this.config.parameters.map(param => [param.code, createBuilder(this.api, param)]),
      );
    }
    return this.paramBuildersByCodeCache;
  }

  private get paramBuilders() {
    return Object.values(this.paramBuildersByCode);
  }

  public validateConfig = () => {
    const { config } = this.indicator;
    validateConfig<AnalyticArithmeticConfig>(config, configValidators);
    return config;
  };

  protected buildAnalyticValues = async (fetchOptions: FetchOptions) => {
    const aggregationJsonToElements = groupKeysByValueJson(this.config.aggregation);
    const analyticDimensionsAndAggregations: Record<
      string,
      { dimensions: AnalyticDimension[]; aggregations: Aggregation[] }
    > = {};
    await Promise.all(
      Object.entries(aggregationJsonToElements).map(async ([aggregationJson, elements]) => {
        const aggregations = JSON.parse(aggregationJson);
        const dimensionsAndAggregations = await deriveDimensionsAndAggregations(
          elements,
          aggregations,
          fetchOptions,
        );
        analyticDimensionsAndAggregations[elements.join(',')] = dimensionsAndAggregations;
      }),
    );

    const mergedDimensions = Object.values(analyticDimensionsAndAggregations)
      .map(({ dimensions }) => dimensions)
      .reduce(mergeAnalyticDimensions);
    const aggregationsByDataElements = Object.entries(analyticDimensionsAndAggregations).reduce(
      (object, [dataElementsKey, { aggregations }]) => ({
        ...object,
        [dataElementsKey]: aggregations,
      }),
      {} as Record<string, Aggregation[]>,
    );

    const { hit, miss } = await this.analyticsCache.getAnalytics(
      this.indicator.code,
      mergedDimensions,
      aggregationsByDataElements,
    );

    if (miss.length === 0) {
      return hit;
    }

    const newFetchOptions = { ...fetchOptions, ...deriveFetchOptions(miss) };

    const analytics = await this.fetchAnalytics(newFetchOptions);
    const clusters = this.buildAnalyticClusters(analytics);
    const builtValues = this.buildAnalyticValuesFromClusters(clusters);
    this.analyticsCache.storeAnalytics(
      this.indicator.code,
      miss,
      aggregationsByDataElements,
      builtValues,
    );
    return [...hit, ...builtValues];
  };

  private getVariables = () => Object.keys(this.config.aggregation);

  private fetchAnalytics = async (fetchOptions: FetchOptions) => {
    const formulaAnalytics = await this.fetchFormulaAnalytics(fetchOptions);
    const parameterAnalytics = await this.fetchParameterAnalytics(fetchOptions);
    return [...formulaAnalytics, ...parameterAnalytics];
  };

  private fetchFormulaAnalytics = async (fetchOptions: FetchOptions) => {
    const aggregationListByElement = stripFields(
      this.config.aggregation,
      Object.keys(this.paramBuildersByCode),
    );
    return fetchAnalytics(this.api.getAggregator(), aggregationListByElement, fetchOptions);
  };

  private fetchParameterAnalytics = async (fetchOptions: FetchOptions) => {
    const analytics = await this.api.buildAnalyticsForBuilders(this.paramBuilders, fetchOptions);
    const analyticsByElement = groupBy(analytics, 'dataElement');

    return Object.entries(analyticsByElement)
      .map(([element, analyticsForElement]) => {
        const aggregationList = this.config.aggregation[element];
        return this.api
          .getAggregator()
          .aggregateAnalytics(analyticsForElement, aggregationList, fetchOptions.period);
      })
      .flat();
  };

  private buildAnalyticClusters = (analytics: Analytic[]) => {
    const { defaultValues } = this.config;
    const variables = this.getVariables();

    const checkClusterIncludesAllVariables = (cluster: AnalyticCluster) =>
      variables.every(variable => variable in cluster.dataValues);

    const replaceAnalyticValuesWithDefaults = (cluster: AnalyticCluster) => ({
      ...cluster,
      dataValues: replaceDataValuesWithDefaults(cluster.dataValues, defaultValues),
    });

    const clusters = analyticsToAnalyticClusters(analytics);
    // Remove clusters that do not include all specified elements
    return clusters.map(replaceAnalyticValuesWithDefaults).filter(checkClusterIncludesAllVariables);
  };

  private buildAnalyticValuesFromClusters = (analyticClusters: AnalyticCluster[]) => {
    const parser = getExpressionParserInstance();
    return analyticClusters
      .map(({ organisationUnit, period, dataValues }) => ({
        organisationUnit,
        period,
        value: evaluateFormulaToNumber(parser, this.config.formula, dataValues),
      }))
      .filter(({ value }) => isFinite(value));
  };
}

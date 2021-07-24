/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import keyBy from 'lodash.keyby';
import createHasher from 'node-object-hash';

import { adjustOptionsToAggregationList } from '@tupaia/aggregator';
import { convertPeriodStringToDateRange, convertDateRangeToPeriods } from '@tupaia/utils';

import { FetchOptions, Aggregation } from '../types';
import { groupKeysByValueJson } from '../Builder/helpers';
import { Builder } from '../Builder';
import { IndicatorAnalytic, IndicatorCacheEntry, AnalyticDimension } from './types';
import { transform } from './analyticDimensionTransformers';

const PERIOD_AGGREGATIONS: Record<string, string> = {
  FINAL_EACH_DAY: 'DAY',
  FINAL_EACH_WEEK: 'WEEK',
  SUM_EACH_WEEK: 'WEEK',
  FINAL_EACH_MONTH: 'MONTH',
  FINAL_EACH_YEAR: 'YEAR',
};

const buildSourceMappers = (sourcePeriods: string[], sourceEntities: string[]) => {
  return {
    periodMap: sourcePeriods.reduce((map, period) => {
      // eslint-disable-next-line no-param-reassign
      map[period] = [period];
      return map;
    }, {} as Record<string, string[]>),
    entityMap: sourceEntities.reduce((map, entity) => {
      // eslint-disable-next-line no-param-reassign
      map[entity] = [entity];
      return map;
    }, {} as Record<string, string[]>),
  };
};

const buildOuputAnalyticDimensions = (
  periodMap: Record<string, string[]>,
  entityMap: Record<string, string[]>,
) => {
  const analyticDimensions: AnalyticDimension[] = [];
  const start = Date.now();
  Object.entries(periodMap).forEach(([period, inputPeriods]) => {
    Object.entries(entityMap).forEach(([entity, inputEntities]) => {
      analyticDimensions.push({
        period,
        organisationUnit: entity,
        inputPeriods,
        inputOrganisationUnits: inputEntities,
      });
    });
  });
  const end = Date.now();
  return analyticDimensions;
};

const insertDataElementsAndCode = (
  flatDimension: AnalyticDimension,
  dataElements: string[],
  indicatorCode: string,
): IndicatorAnalytic => {
  return {
    period: flatDimension.period,
    organisationUnit: flatDimension.organisationUnit,
    indicatorCode,
    inputs: [
      {
        dataElements,
        periods: flatDimension.inputPeriods,
        organisationUnits: flatDimension.inputOrganisationUnits,
      },
    ],
  };
};

const buildCacheEntryParts = async (
  context: any,
  aggregations: Aggregation[],
  fetchOptions: FetchOptions,
) => {
  const [
    adjustedFetchOptions,
    { aggregations: adjustedAggregations },
  ] = await adjustOptionsToAggregationList(context, fetchOptions, {
    aggregations,
  });
  const {
    organisationUnitCodes: requestOrganisationUnits,
    period: requestPeriod,
  } = adjustedFetchOptions as FetchOptions;

  if (!requestOrganisationUnits) {
    throw new Error('organisationUnitCodes must be defined when building analytic dimensions');
  }

  const lastPeriodAggregationType = aggregations
    .slice()
    .reverse()
    .map(aggregation => PERIOD_AGGREGATIONS[aggregation.type])
    .find(periodType => periodType);

  const lastEntityAggregationMap = (adjustedAggregations as Aggregation[])
    .slice()
    .reverse()
    .find(aggregation => aggregation?.config?.orgUnitMap)?.config?.orgUnitMap;

  const outputPeriods = convertDateRangeToPeriods(
    ...convertPeriodStringToDateRange(requestPeriod),
    lastPeriodAggregationType || 'DAY',
  );

  const outputOrganisationUnits = lastEntityAggregationMap
    ? [...new Set(Object.values(lastEntityAggregationMap).map(({ code }) => code))]
    : requestOrganisationUnits;

  return outputPeriods
    .map(period => outputOrganisationUnits.map(organisationUnit => ({ period, organisationUnit })))
    .flat();
};

const buildIndicatorAnalyticParts = async (
  context: any,
  indicatorCode: string,
  dataElements: string[],
  aggregations: Aggregation[],
  fetchOptions: FetchOptions,
) => {
  const [
    adjustedFetchOptions,
    adjustedAggregationOptions,
  ] = await adjustOptionsToAggregationList(context, fetchOptions, { aggregations });
  const {
    organisationUnitCodes: sourceEntities,
    period: requestPeriod,
  } = adjustedFetchOptions as FetchOptions;

  if (!sourceEntities) {
    throw new Error('organisationUnitCodes must be defined when building analytic dimensions');
  }

  const sourcePeriods = convertDateRangeToPeriods(
    ...convertPeriodStringToDateRange(requestPeriod),
    'DAY',
  );

  const sourceMappers = buildSourceMappers(sourcePeriods, sourceEntities);
  const adjustedAggregations = adjustedAggregationOptions.aggregations as Aggregation[];

  const start = Date.now();
  const outputMappers = adjustedAggregations.reduce(transform, sourceMappers);

  const response = buildOuputAnalyticDimensions(
    outputMappers.periodMap,
    outputMappers.entityMap,
  ).map(flatDimension => insertDataElementsAndCode(flatDimension, dataElements, indicatorCode));

  const end = Date.now();
  return response;
};

export const deriveCacheEntries = async (
  indicatorBuilder: Builder,
  indicatorAggregations: Record<string, Aggregation[]>,
  fetchOptions: FetchOptions,
) => {
  const aggregationJsonToElements = groupKeysByValueJson(indicatorAggregations);
  let periods: string[] = [];
  let organisationUnits: string[] = [];
  await Promise.all(
    Object.entries(aggregationJsonToElements).map(async ([aggregationJson]) => {
      const aggregations = JSON.parse(aggregationJson);
      const entriesForPart = await buildCacheEntryParts(
        indicatorBuilder.indicatorApi.getAggregator().context,
        aggregations,
        fetchOptions,
      );

      periods = [...periods, ...entriesForPart.map(entry => entry.period)];
      organisationUnits = [
        ...organisationUnits,
        ...entriesForPart.map(entry => entry.organisationUnit),
      ];
    }),
  );

  const allPeriods = [...new Set(periods)];
  const allOrganisationUnits = [...new Set(organisationUnits)];
  return allPeriods
    .map(period =>
      allOrganisationUnits.map(organisationUnit => ({
        period,
        organisationUnit,
        hierarchy: fetchOptions.hierarchy,
      })),
    )
    .flat();
};

export const deriveIndicatorAnalytics = async (
  indicatorBuilder: Builder,
  indicatorCode: string,
  indicatorAggregations: Record<string, Aggregation[]>,
  fetchOptions: FetchOptions,
) => {
  const start = Date.now();
  const aggregationJsonToElements = groupKeysByValueJson(indicatorAggregations);
  const analyticParts: Record<string, IndicatorAnalytic[]> = {};
  await Promise.all(
    Object.entries(aggregationJsonToElements).map(async ([aggregationJson, elements]) => {
      const aggregations = JSON.parse(aggregationJson);
      analyticParts[elements.join(',')] = await buildIndicatorAnalyticParts(
        indicatorBuilder.indicatorApi.getAggregator().context,
        indicatorCode,
        elements,
        aggregations,
        fetchOptions,
      );
    }),
  );

  const mergedDimensions = Object.values(analyticParts).reduce(mergeAnalyticParts);
  const end = Date.now();

  // console.log(`Building indicator analytics took: ${end - start}ms`);

  const hasher = createHasher();
  return mergedDimensions.map(dimension => ({
    ...dimension,
    inputHash: hasher.hash(dimension.inputs),
  }));
};

export const mergeAnalyticParts = (
  dimensionsA: IndicatorAnalytic[],
  dimensionsB: IndicatorAnalytic[],
) => {
  const dimensionsAByOutput = keyBy(
    dimensionsA,
    dimension => `${dimension.period}_${dimension.organisationUnit}`,
  );

  const dimensionsBByOutput = keyBy(
    dimensionsB,
    dimension => `${dimension.period}_${dimension.organisationUnit}`,
  );

  const mergedOutputKeys = Array.from(
    new Set([...Object.keys(dimensionsAByOutput), ...Object.keys(dimensionsBByOutput)]),
  );

  return mergedOutputKeys.map(outputKey => {
    const dimensionsAValue = dimensionsAByOutput[outputKey];
    const dimensionsBValue = dimensionsBByOutput[outputKey];

    if (!dimensionsAValue) {
      return dimensionsBValue;
    }

    if (!dimensionsBValue) {
      return dimensionsAValue;
    }

    return {
      ...dimensionsAValue,
      inputs: [...dimensionsAValue.inputs, ...dimensionsBValue.inputs],
    };
  });
};

export const deriveFetchOptions = (cacheEntries: IndicatorCacheEntry[]) => {
  const allOrganisationUnitCodes: string[] = [];
  const allPeriods: string[] = [];
  cacheEntries.forEach(cacheEntry => {
    allPeriods.push(cacheEntry.period);
    allOrganisationUnitCodes.push(cacheEntry.organisationUnit);
  });
  const periods = [...new Set(allPeriods)].sort();
  const [startDate, endDate] = convertPeriodStringToDateRange(periods.join(';'));
  return {
    startDate,
    endDate,
    organisationUnitCodes: [...new Set(allOrganisationUnitCodes)],
  };
};

export const deriveCacheRelations = () => {};

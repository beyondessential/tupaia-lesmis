/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import keyBy from 'lodash.keyby';

import { adjustOptionsToAggregationList } from '@tupaia/aggregator';
import { convertPeriodStringToDateRange, convertDateRangeToPeriods } from '@tupaia/utils';

import { FetchOptions, Aggregation } from '../types';
import { groupKeysByValueJson } from '../Builder/helpers';
import { Builder } from '../Builder';
import { IndicatorAnalytic, AnalyticDimension } from './types';
import { transform } from './analyticDimensionTransformers';

const buildSourceAnalyticDimensions = (sourcePeriods: string[], sourceEntities: string[]) => {
  const analyticDimensions: AnalyticDimension[] = [];
  sourcePeriods.forEach(period => {
    sourceEntities.forEach(entity => {
      analyticDimensions.push({
        period,
        organisationUnit: entity,
        inputPeriods: [period],
        inputOrganisationUnits: [entity],
      });
    });
  });
  return analyticDimensions;
};

const insertDataElementsAndAggregations = (
  flatDimension: AnalyticDimension,
  dataElements: string[],
  aggregations: Aggregation[],
): IndicatorAnalytic => {
  return {
    period: flatDimension.period,
    organisationUnit: flatDimension.organisationUnit,
    inputs: dataElements.reduce((object, dataElement) => {
      // eslint-disable-next-line no-param-reassign
      object[dataElement] = {
        periods: flatDimension.inputPeriods,
        organisationUnits: flatDimension.inputOrganisationUnits,
        aggregations,
      };
      return object;
    }, {} as Record<string, { periods: string[]; organisationUnits: string[]; aggregations: Aggregation[] }>),
  };
};

const buildIndicatorAnalyticParts = async (
  context: any,
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

  const sourceAnalyticDimensions = buildSourceAnalyticDimensions(sourcePeriods, sourceEntities);
  const adjustedAggregations = adjustedAggregationOptions.aggregations as Aggregation[];

  return adjustedAggregations
    .reduce(transform, sourceAnalyticDimensions)
    .map(flatDimension =>
      insertDataElementsAndAggregations(flatDimension, dataElements, adjustedAggregations),
    );
};

export const deriveIndicatorAnalytics = async (
  indicatorBuilder: Builder,
  indicatorAggregations: Record<string, Aggregation[]>,
  fetchOptions: FetchOptions,
) => {
  const aggregationJsonToElements = groupKeysByValueJson(indicatorAggregations);
  const analyticParts: Record<string, IndicatorAnalytic[]> = {};
  await Promise.all(
    Object.entries(aggregationJsonToElements).map(async ([aggregationJson, elements]) => {
      const aggregations = JSON.parse(aggregationJson);
      analyticParts[elements.join(',')] = await buildIndicatorAnalyticParts(
        indicatorBuilder.indicatorApi.getAggregator().context,
        elements,
        aggregations,
        fetchOptions,
      );
    }),
  );

  const mergedDimensions = Object.values(analyticParts).reduce(mergeAnalyticParts);

  return mergedDimensions;
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
      period: dimensionsAValue.period,
      organisationUnit: dimensionsAValue.organisationUnit,
      inputs: {
        ...dimensionsAValue.inputs,
        ...dimensionsBValue.inputs,
      },
    };
  });
};

export const deriveFetchOptions = (dimensions: IndicatorAnalytic[]) => {
  const allOrganisationUnitCodes: string[] = [];
  const allPeriods: string[] = [];
  dimensions.forEach(dimension => {
    Object.values(dimension.inputs).forEach(({ periods, organisationUnits }) => {
      allPeriods.push(...periods);
      allOrganisationUnitCodes.push(...organisationUnits);
    });
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

/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import keyBy from 'lodash.keyby';

import { adjustOptionsToAggregationList } from '@tupaia/aggregator';
import { convertPeriodStringToDateRange, convertDateRangeToPeriods } from '@tupaia/utils';

import { FetchOptions, Aggregation } from '../types';
import { AnalyticDimension, FlatAnalyticDimension } from './types';
import { transform } from './analyticDimensionTransformers';

const buildSourceAnalyticDimensions = (sourcePeriods: string[], sourceEntities: string[]) => {
  const analyticDimensions: FlatAnalyticDimension[] = [];
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

const insertDataElementsKey = (
  flatDimension: FlatAnalyticDimension,
  dataElementsKey: string,
): AnalyticDimension => {
  return {
    period: flatDimension.period,
    organisationUnit: flatDimension.organisationUnit,
    inputPeriods: {
      [dataElementsKey]: flatDimension.inputPeriods,
    },
    inputOrganisationUnits: {
      [dataElementsKey]: flatDimension.inputOrganisationUnits,
    },
  };
};

export const deriveDimensionsAndAggregations = async (
  dataElements: string[],
  aggregations: Aggregation[],
  fetchOptions: FetchOptions,
) => {
  const [
    adjustedFetchOptions,
    adjustedAggregationOptions,
  ] = await adjustOptionsToAggregationList({}, fetchOptions, { aggregations });
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

  const dataElementsKey = dataElements.join(',');

  return {
    dimensions: adjustedAggregations
      .reduce(transform, sourceAnalyticDimensions)
      .map(flatDimension => insertDataElementsKey(flatDimension, dataElementsKey)),
    aggregations: adjustedAggregations,
  };
};

export const mergeAnalyticDimensions = (
  dimensionsA: AnalyticDimension[],
  dimensionsB: AnalyticDimension[],
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
      inputPeriods: {
        ...dimensionsAValue.inputPeriods,
        ...dimensionsBValue.inputPeriods,
      },
      inputOrganisationUnits: {
        ...dimensionsAValue.inputOrganisationUnits,
        ...dimensionsBValue.inputOrganisationUnits,
      },
    };
  });
};

export const deriveFetchOptions = (dimensions: AnalyticDimension[]) => {
  const allOrganisationUnitCodes: string[] = [];
  const allPeriods: string[] = [];
  dimensions.forEach(dimension => {
    allPeriods.push(...Object.values(dimension.inputPeriods).flat());
    allOrganisationUnitCodes.push(...Object.values(dimension.inputOrganisationUnits).flat());
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

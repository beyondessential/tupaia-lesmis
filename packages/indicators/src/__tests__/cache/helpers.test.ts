/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import {
  DERIVE_ANALYTIC_DIMENSIONS_FIXTURES,
  MERGE_ANALYTIC_DIMENSIONS_FIXTURES,
  DERIVE_FETCH_OPTIONS_FIXTURES,
} from './helpers.fixtures';
import {
  deriveDimensionsAndAggregations,
  mergeAnalyticDimensions,
  deriveFetchOptions,
} from '../../cache/helpers';

describe('deriveAnalyticDimensions', () => {
  it('can derive analytic dimensions for the given aggregations and fetch options', () => {
    DERIVE_ANALYTIC_DIMENSIONS_FIXTURES.forEach(
      async ({
        dataElements,
        fetchOptions,
        aggregations,
        analyticDimensions,
        adjustedAggregations,
      }) => {
        await expect(
          deriveDimensionsAndAggregations(dataElements, aggregations, fetchOptions),
        ).resolves.toBe({
          dimensions: analyticDimensions,
          aggregations: adjustedAggregations,
        });
      },
    );
  });
});

describe('mergeAnalyticDimensions', () => {
  it('can merge analytic dimensions for different dataElements', () => {
    MERGE_ANALYTIC_DIMENSIONS_FIXTURES.forEach(({ a, b, mergedDimensions }) => {
      expect(mergeAnalyticDimensions(a, b)).toBe(mergedDimensions);
    });
  });
});

describe('deriveFetchOptions', () => {
  it('can derive fetch options for the given analytic dimensions', async () => {
    DERIVE_FETCH_OPTIONS_FIXTURES.forEach(({ dimensions, fetchOptions }) => {
      expect(deriveFetchOptions(dimensions)).toBe(fetchOptions);
    });
  });
});

describe('deriveCacheRelations', () => {
  it('can derive cache relations for the given analytics and requested dimensions', () => {});
});

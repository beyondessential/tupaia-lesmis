/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import {
  DERIVE_ANALYTIC_DIMENSIONS_FIXTURES,
  DERIVE_FETCH_OPTIONS_FIXTURES,
  DERIVE_INDICATOR_CACHE_ENTRIES_FIXTURES,
} from './helpers.fixtures';
import { deriveIndicatorAnalytics, deriveFetchOptions } from '../../cache/helpers';

describe('deriveIndicatorAnalytics', () => {
  it('can derive indicator analytics for the given aggregations and fetch options', () => {
    DERIVE_ANALYTIC_DIMENSIONS_FIXTURES.forEach(
      async ({ fetchOptions, indicatorAggregations, analyticDimensions }) => {
        await expect(deriveIndicatorAnalytics(indicatorAggregations, fetchOptions)).resolves.toBe(
          analyticDimensions,
        );
      },
    );
  });
});

describe('deriveFetchOptions', () => {
  it('can derive fetch options for the given indicator analytics', async () => {
    DERIVE_FETCH_OPTIONS_FIXTURES.forEach(({ dimensions, fetchOptions }) => {
      expect(deriveFetchOptions(dimensions)).toBe(fetchOptions);
    });
  });
});

describe('deriveIndicatorCacheEntries', () => {
  it('can derive cache entries for given aggregations and fetch options', () => {});
});

describe('buildEntityQueryString', () => {
  it('can build an query string for an indicator', () => {
    DERIVE_INDICATOR_CACHE_ENTRIES_FIXTURES.forEach(
      async ({ fetchOptions, indicatorAggregations, cacheEntries }) => {
        await expect(deriveIndicatorAnalytics(indicatorAggregations, fetchOptions)).resolves.toBe(
          analyticDimensions,
        );
      },
    );
  });
});

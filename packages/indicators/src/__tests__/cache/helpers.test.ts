/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import {
  DERIVE_ANALYTIC_DIMENSIONS_FIXTURES,
  DERIVE_FETCH_OPTIONS_FIXTURES,
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

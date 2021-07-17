/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { RedisCacheClientStub } from './RedisCacheClientStub';
import { IndicatorCache } from '../../cache/IndicatorCache';

const cache = new IndicatorCache(new RedisCacheClientStub());

describe('IndicatorCache', () => {
  describe('getCachedAnalytics', () => {
    it('returns cached analytics and uncached analytic dimensions for given analytic dimensions', () => {
      // Do this
    });
  });

  describe('cacheAnalytics', () => {
    it('stores analytics and relations of each analytic for requested analytic dimensions', () => {
      // Do this
    });
  });
});

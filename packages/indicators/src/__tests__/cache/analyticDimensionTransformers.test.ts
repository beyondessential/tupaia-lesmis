/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { ANALYTIC_DIMENSION_TRANSFORM_FIXTURES } from './analyticDimensionTransformers.fixtures';
import { transform } from '../../cache/analyticDimensionTransformers';

describe('analyticDimensionTransformer', () => {
  it('it transforms a list of aggregation dimensions given aggregation', () => {
    ANALYTIC_DIMENSION_TRANSFORM_FIXTURES.forEach(
      ({ inputDimensions, aggregation, outputDimensions }) =>
        expect(transform(inputDimensions, aggregation)).toEqual(outputDimensions),
    );
  });
});

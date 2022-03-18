/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { addCustomJestMatchers } from '@tupaia/utils';
import { Row } from './src/reportBuilder';
import { DataFrame, OrderedSet } from './src/reportBuilder/transform/parser/customTypes';

addCustomJestMatchers(expect, [
  {
    description: {
      name: 'toEqualDataFrameOf',
    },
    matcher: (
      expectChain: any,
      received: DataFrame,
      [expected]: (Row[] | { rows: Row[]; columns: string[] })[],
    ) => {
      const expectedDf = Array.isArray(expected)
        ? new DataFrame(expected)
        : new DataFrame(expected.rows, new OrderedSet(expected.columns));
      expectChain(received).toEqual(expectedDf);
    },
  },
]);

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { addCustomJestMatchers } from '@tupaia/utils';
import { RawRow } from './src/reportBuilder';
import { Table, OrderedSet } from './src/reportBuilder/transform/parser/customTypes';

addCustomJestMatchers(expect, [
  {
    description: {
      name: 'toEqualTableOf',
    },
    matcher: (
      expectChain: any,
      received: Table,
      [expected]: (RawRow[] | { rows: RawRow[]; columns: string[] })[],
    ) => {
      const expectedDf = Array.isArray(expected)
        ? new Table(expected)
        : new Table(expected.rows, new OrderedSet(expected.columns));
      expectChain(received).toEqual(expectedDf);
    },
  },
]);

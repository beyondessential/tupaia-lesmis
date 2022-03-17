/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { Matrix } from 'mathjs';
import { DataFrame, DataFrameColumn, DataFrameRow, OrderedSet } from '../customTypes';

const enforceIsNumber = (value: unknown) => {
  if (typeof value !== 'number') {
    throw new Error(`Expected number, got: ${value}`);
  }
  return value;
};

const sumArray = (arr: unknown[]) =>
  arr.every(item => item === undefined)
    ? undefined
    : arr
        .filter(item => item !== undefined)
        .map(enforceIsNumber)
        .reduce((total, item) => total + item, 0);

export const sum = {
  dependencies: ['typed', 'DataFrame', 'DataFrameRow', 'DataFrameColumn'],
  func: ({ typed }: { typed: any }) =>
    typed('sum', {
      '...': (args: unknown[]) => {
        return sumArray(args); // 'this' is bound by mathjs to allow recursive function calls to other typed function implementations
      },
      number: (num: number) => num,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      undefined: (undef: undefined) => undefined,
      Array: sumArray,
      Matrix: (matrix: Matrix) => sumArray(matrix.toArray()),
      DataFrame: (df: DataFrame) => sumArray(df.cells()),
      DataFrameRow: (dfr: DataFrameRow) => sumArray(dfr.cells()),
      DataFrameColumn: (dfc: DataFrameColumn) => sumArray(dfc.cells()),
    }),
};

export const subtract = {
  dependencies: ['typed', 'OrderedSet'],
  func: ({ typed }: { typed: any }) =>
    typed('subtract', {
      'number,number': (num1: number, num2: number) => num1 - num2,
      'OrderedSet,OrderedSet': (set1: OrderedSet<unknown>, set2: OrderedSet<unknown>) =>
        set1.difference(set2),
      'OrderedSet,any': (set: OrderedSet<unknown>, val: unknown) =>
        set.difference(new OrderedSet([val])),
    }),
};

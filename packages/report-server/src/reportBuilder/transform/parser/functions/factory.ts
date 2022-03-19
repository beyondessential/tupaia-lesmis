/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { Matrix, typed, mean as mathjsMean, sum as mathjsSum, bitOr as mathjsBitOr } from 'mathjs';
import { FieldValue } from '../../../types';
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
    : mathjsSum(arr.filter(item => item !== undefined).map(enforceIsNumber));

export const orderedSet = {
  dependencies: ['typed', 'OrderedSet'],
  func: ({
    typed: customTyped,
    OrderedSet: OrderedSetConstructor,
  }: {
    typed: any;
    OrderedSet: new <T>(arr: T[]) => OrderedSet<T>;
  }) =>
    customTyped('orderedSet', {
      Matrix: (matrix: Matrix) => new OrderedSetConstructor(matrix.toArray().flat()),
      Array: (array: unknown[]) => new OrderedSetConstructor(array),
      '...': (args: unknown[]) => new OrderedSetConstructor(args),
    }),
};

export const sum = {
  dependencies: ['typed', 'DataFrame', 'DataFrameRow', 'DataFrameColumn'],
  func: ({ typed: customTyped }: { typed: any }) =>
    customTyped('sum', {
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

export const bitOr = {
  dependencies: ['typed', 'OrderedSet'],
  func: ({ typed: customTyped }: { typed: any }) =>
    customTyped('bitOr', {
      'OrderedSet,OrderedSet': (set1: OrderedSet<unknown>, set2: OrderedSet<unknown>) =>
        set1.union(set2),
      'OrderedSet,Matrix': (set: OrderedSet<unknown>, matrix: Matrix) =>
        set.union(new OrderedSet(matrix.toArray().flat())),
      'OrderedSet,Array': (set: OrderedSet<unknown>, array: unknown[]) =>
        set.union(new OrderedSet(array)),
      'OrderedSet,any': (set: OrderedSet<unknown>, val: unknown) =>
        set.union(new OrderedSet([val])),
      'number,number': (num1: number, num2: number) => mathjsBitOr(num1, num2),
    }),
};

export const subtract = {
  dependencies: ['typed', 'OrderedSet'],
  func: ({ typed: customTyped }: { typed: any }) =>
    customTyped('subtract', {
      'number,number': (num1: number, num2: number) => num1 - num2,
      'OrderedSet,OrderedSet': (set1: OrderedSet<unknown>, set2: OrderedSet<unknown>) =>
        set1.difference(set2),
      'OrderedSet,Matrix': (set: OrderedSet<unknown>, matrix: Matrix) =>
        set.difference(new OrderedSet(matrix.toArray().flat())),
      'OrderedSet,Array': (set: OrderedSet<unknown>, array: unknown[]) =>
        set.difference(new OrderedSet(array)),
      'OrderedSet,any': (set: OrderedSet<unknown>, val: unknown) =>
        set.difference(new OrderedSet([val])),
    }),
};

export const range = {
  dependencies: ['getCurrentTable', 'OrderedSet'],
  func: ({
    getCurrentTable,
    OrderedSet: OrderedSetConstructor,
  }: {
    getCurrentTable: () => DataFrame;
    OrderedSet: new <T>(arr: T[]) => OrderedSet<T>;
  }) =>
    typed('range', {
      'number,number': (num1: number, num2: number) => {
        if (num1 > num2) {
          throw new Error(`Invalid range: ${num1} is larger than ${num2}`);
        }
        const start = Math.max(1, num1);
        const end = Math.min(getCurrentTable().rowCount(), num2);
        const rangeArray = new Array(end + 1 - start).fill(0).map((_, index) => start + index);
        return new OrderedSetConstructor(rangeArray);
      },
      'string,string': (name1: string, name2: string) => {
        const start = getCurrentTable().columnNames.asArray().indexOf(name1);
        if (start < 0) {
          throw new Error(`Invalid range: Cannot find column (${name1})`);
        }
        const end = getCurrentTable().columnNames.asArray().indexOf(name2);
        if (end < 0) {
          throw new Error(`Invalid range: Cannot find column (${name2})`);
        }
        if (start > end) {
          throw new Error(`Invalid range: ${name1} is on the right of ${name2} in the table`);
        }
        const rangeArray = new Array(end + 1 - start)
          .fill(0)
          .map((_, index) => getCurrentTable().columnNames.asArray()[start + index]);
        return new OrderedSetConstructor(rangeArray);
      },
    }),
};

export const mean = {
  dependencies: ['typed', 'DataFrameRow', 'DataFrameColumn', 'DataFrameRow'],
  func: ({ typed: customTyped }: { typed: any }) =>
    customTyped('mean', {
      DataFrame: (df: DataFrame) => mathjsMean(df.cells().map(enforceIsNumber)),
      DataFrameRow: (dfr: DataFrameRow) => mathjsMean(dfr.cells().map(enforceIsNumber)),
      DataFrameColumn: (dfr: DataFrameRow) => mathjsMean(dfr.cells().map(enforceIsNumber)),
      '...': (vals: any[]) => mathjsMean(vals),
    }),
};

const lastItemInArray = (values: FieldValue[]): FieldValue => {
  if (!Array.isArray(values)) {
    throw new Error(`Function 'last' expected an array, but got: ${values}`);
  }

  if (values.length < 1) {
    return undefined;
  }

  return values[values.length - 1];
};

export const last = {
  dependencies: ['typed', 'DataFrameColumn'],
  func: ({ typed: customTyped }: { typed: any }) =>
    customTyped('last', {
      DataFrameColumn: (dfr: DataFrameRow) => lastItemInArray(dfr.cells()),
      Array: (vals: FieldValue[]) => lastItemInArray(vals),
    }),
};

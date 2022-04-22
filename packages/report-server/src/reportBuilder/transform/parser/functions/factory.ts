/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { Matrix, typed, bitOr as mathjsBitOr } from 'mathjs';
import { OrderedSet } from '../customTypes';

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
  dependencies: ['getRowCount', 'getColumnNames', 'OrderedSet'],
  func: ({
    getRowCount,
    getColumnNames,
    OrderedSet: OrderedSetConstructor,
  }: {
    getRowCount: () => number;
    getColumnNames: () => string[];
    OrderedSet: new <T>(arr: T[]) => OrderedSet<T>;
  }) =>
    typed('range', {
      'number,number': (num1: number, num2: number) => {
        if (num1 > num2) {
          throw new Error(`Invalid range: ${num1} is larger than ${num2}`);
        }
        const start = Math.max(1, num1);
        const end = Math.min(getRowCount(), num2);
        const rangeArray = new Array(end + 1 - start).fill(0).map((_, index) => start + index);
        return new OrderedSetConstructor(rangeArray);
      },
      'string,string': (name1: string, name2: string) => {
        const columnNames = getColumnNames();
        const start = columnNames.indexOf(name1);
        if (start < 0) {
          throw new Error(`Invalid range: Cannot find column (${name1})`);
        }
        const end = columnNames.indexOf(name2);
        if (end < 0) {
          throw new Error(`Invalid range: Cannot find column (${name2})`);
        }
        if (start > end) {
          throw new Error(`Invalid range: ${name1} is on the right of ${name2} in the table`);
        }
        const rangeArray = new Array(end + 1 - start)
          .fill(0)
          .map((_, index) => columnNames[start + index]);
        return new OrderedSetConstructor(rangeArray);
      },
    }),
};

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { typed, mean as mathjsMean } from 'mathjs';

export const divide = typed('divide', {
  'number, undefined': (num: number, undef: undefined) => undefined,
  'undefined, number': (undef: undefined, num: number) => undefined,
  'undefined, undefined': (undef: undefined, undef2: undefined) => undefined,
});

export const add = typed('add', {
  'number, undefined': (num: number, undef: undefined) => num,
  'undefined, number': (undef: undefined, num: number) => num,
  'undefined, undefined': (undef: undefined, undef2: undefined) => undefined,
  'string, string': (string1: string, string2: string) => string1 + string2,
  'string, number': (string: string, num: number) => string + num,
  'number, string': (num: number, string: string) => num.toString() + string,
});

const enforceIsNumber = (value: unknown) => {
  if (typeof value !== 'number') {
    throw new Error(`Expected number, got: ${value}`);
  }
  return value;
};

const calculateMean = (arr: unknown[]) => {
  const numbersArray = arr.every(item => item === undefined)
    ? undefined
    : arr.filter(item => item !== undefined).map(enforceIsNumber);
  if (numbersArray === undefined) {
    return undefined;
  }
  return mathjsMean(numbersArray);
};

export const mean = typed('mean', {
  '...': (args: unknown[]) => {
    return calculateMean(args);
  },
  Array: calculateMean,
});

export const range = {
  dependencies: ['getCurrentTable', 'OrderedSet'],
  func: ({ getCurrentTable, OrderedSet }: { getCurrentTable: any; OrderedSet: any }) =>
    typed('range', {
      'number,number': (num1: number, num2: number) => {
        if (num1 > num2) {
          throw new Error(`Invalid range: ${num1} is larger than ${num2}`);
        }
        const start = Math.max(1, num1);
        const end = Math.min(getCurrentTable().length, num2);
        const rangeArray = new Array(end + 1 - start).fill(0).map((_, index) => start + index);
        return new OrderedSet(rangeArray);
      },
      'string,string': (name1: string, name2: string) => {
        const start = getCurrentTable().columnNames.indexOf(name1);
        if (start < 0) {
          throw new Error(`Invalid range: Cannot find column (${name1})`);
        }
        const end = getCurrentTable().columnNames.indexOf(name2);
        if (end < 0) {
          throw new Error(`Invalid range: Cannot find column (${name2})`);
        }
        if (start > end) {
          throw new Error(`Invalid range: ${name1} is on the right of ${name2} in the table`);
        }
        const rangeArray = new Array(end + 1 - start)
          .fill(0)
          .map((_, index) => getCurrentTable().columnNames[start + index]);
        return new OrderedSet(rangeArray);
      },
    }),
};

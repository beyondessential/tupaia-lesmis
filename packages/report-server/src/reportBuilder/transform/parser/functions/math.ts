/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { typed, mean as mathjsMean } from 'mathjs';
import { DataFrame } from '../customTypes';

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

const sumArray = (arr: unknown[]) =>
  arr.every(item => item === undefined)
    ? undefined
    : arr
        .filter(item => item !== undefined)
        .map(enforceIsNumber)
        .reduce((total, item) => total + item, 0);

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

export const sum = ({ typed: customTyped }: { typed: any }) =>
  customTyped('sum', {
    '...': function (args: unknown[]) {
      return sumArray(args); // 'this' is bound by mathjs to allow recursive function calls to other typed function implementations
    },
    number: (num: number) => num,
    undefined: (undef: undefined) => undefined,
    Array: sumArray,
    DataFrame: (df: DataFrame) => sumArray(df.cells()),
  });

// export const range = typed('range', {
//   'number,number': (num1: number, num2: number) => {
//     console.log('doing number number range');
//     const start = Math.max(0, num1);
//     // const end = Math.min(currentTable.length, num2);
//     const end = Math.min(10, num2);
//     const rangeArray = new Array(end + 1 - start).fill(0).map((_, index) => start + index);
//     console.log(rangeArray);
//     return rangeArray;
//   },
//   'string,string': (name1: string, name2: string) => {
//     console.log('doing single string range', name1, name2);
//     const currentTable = { columnNames: ['A', 'B', 'C'] };
//     const start = currentTable.columnNames.indexOf(name1);
//     if (start < 0) {
//       throw new Error(`Cannot find column (${name1}) in dataframe`);
//     }
//     const end = currentTable.columnNames.indexOf(name2);
//     if (end < 0) {
//       throw new Error(`Cannot find column (${name1}) in dataframe`);
//     }
//     console.log('start', start, 'end', end);
//     const rangeArray = new Array(end + 1 - start)
//       .fill(0)
//       .map((_, index) => currentTable.columnNames[start + index]);
//     console.log(rangeArray);
//     return rangeArray;
//   },
//   string: (name1: string, name2: string) => {
//     console.log('doing single string range', name1, name2);
//     const currentTable = { columnNames: ['A', 'B', 'C'] };
//     const start = currentTable.columnNames.indexOf(name1);
//     if (start < 0) {
//       throw new Error(`Cannot find column (${name1}) in dataframe`);
//     }
//     const end = currentTable.columnNames.indexOf(name2);
//     if (end < 0) {
//       throw new Error(`Cannot find column (${name1}) in dataframe`);
//     }
//     const rangeArray = new Array(end - start).map(
//       (_, index) => currentTable.columnNames[start + index],
//     );
//     return rangeArray;
//   },
// });

export const range = {
  dependencies: ['getCurrentTable', 'OrderedSet'],
  func: ({ getCurrentTable, OrderedSet }: { getCurrentTable: any; OrderedSet: any }) =>
    typed('range', {
      'number,number': (num1: number, num2: number) => {
        console.log('doing number number range');
        const start = Math.max(0, num1);
        const end = Math.min(getCurrentTable().length, num2);
        // const end = Math.min(10, num2);
        const rangeArray = new Array(end + 1 - start).fill(0).map((_, index) => start + index);
        console.log(rangeArray);
        return new OrderedSet(rangeArray);
      },
      'string,string': (name1: string, name2: string) => {
        console.log('doing single string range', name1, name2);
        // const currentTable = { columnNames: ['A', 'B', 'C'] };
        const start = getCurrentTable().columnNames.indexOf(name1);
        if (start < 0) {
          throw new Error(`Cannot find column (${name1}) in dataframe`);
        }
        const end = getCurrentTable().columnNames.indexOf(name2);
        if (end < 0) {
          throw new Error(`Cannot find column (${name1}) in dataframe`);
        }
        console.log('start', start, 'end', end);
        const rangeArray = new Array(end + 1 - start)
          .fill(0)
          .map((_, index) => getCurrentTable().columnNames[start + index]);
        console.log(rangeArray);
        return new OrderedSet(rangeArray);
      },
    }),
};

export const subtract = {
  dependencies: ['typed', 'OrderedSet'],
  func: ({ typed: customTyped, getCurrentTable }: { typed: any; getCurrentTable: any }) =>
    customTyped('range', {
      'number,number': (num1: number, num2: number) => {
        console.log('doing number number range');
        const start = Math.max(0, num1);
        const end = Math.min(getCurrentTable().length, num2);
        // const end = Math.min(10, num2);
        const rangeArray = new Array(end + 1 - start).fill(0).map((_, index) => start + index);
        console.log(rangeArray);
        return rangeArray;
      },
      'string,string': (name1: string, name2: string) => {
        console.log('doing single string range', name1, name2);
        // const currentTable = { columnNames: ['A', 'B', 'C'] };
        const start = getCurrentTable().columnNames.indexOf(name1);
        if (start < 0) {
          throw new Error(`Cannot find column (${name1}) in dataframe`);
        }
        const end = getCurrentTable().columnNames.indexOf(name2);
        if (end < 0) {
          throw new Error(`Cannot find column (${name1}) in dataframe`);
        }
        console.log('start', start, 'end', end);
        const rangeArray = new Array(end + 1 - start)
          .fill(0)
          .map((_, index) => getCurrentTable().columnNames[start + index]);
        console.log(rangeArray);
        return rangeArray;
      },
    }),
};

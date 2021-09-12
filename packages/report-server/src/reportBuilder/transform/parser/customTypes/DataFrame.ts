/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { factory } from 'mathjs';

import { Row } from '../../../types';

export class DataFrame {
  public isDataFrame = true;

  private readonly columns: string[];

  private readonly rows: Row[];

  public length: number;

  constructor(rows: Row[]) {
    this.rows = rows;

    const columnSet = new Set<string>();
    this.rows.forEach(row => {
      Object.keys(row).forEach(col => columnSet.add(col));
    });

    this.columns = Array.from(columnSet);
    this.length = this.rows.length;
  }
}

// factory function which defines a new data type CustomValue
export const createDataFrameType = factory('DataFrame', ['typed'], ({ typed }) => {
  // create a new data type

  // define a new data type with typed-function
  typed.addType({
    name: 'DataFrame',
    test: (x: unknown) => {
      // test whether x is of type DataFrame
      return x && x.isDataFrame === true;
    },
  });

  return DataFrame;
});

// function add which can add the CustomValue data type
// When imported in math.js, the existing function `add` with support for
// CustomValue, because both implementations are typed-functions and do not
// have conflicting signatures.
export const createAddCustomValue = factory(
  'map',
  ['typed', 'DataFrame'],
  ({ typed, DataFrame }) => {
    return typed('map', {
      'DataFrame, string': function (a, b) {
        return new DataFrame(a.value + b.value);
      },
    });
  },
);

// import the new data type and function

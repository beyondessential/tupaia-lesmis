/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { Row } from '../../../types';
import { OrderedSet } from './OrderedSet';

export class DataFrameRow {
  public isDataFrameRow = true;
  public readonly columnNames: string[];

  private readonly row: Row;

  constructor(row: Row) {
    this.row = row;

    this.columnNames = Array.from(new Set(Object.keys(row)));
  }

  public column(name: string) {
    return this.row[name];
  }

  public columns(names: string[] | OrderedSet<string>) {
    const arrayNames = Array.isArray(names) ? names : Array.from(names);
    arrayNames.forEach(name => {
      if (!this.columnNames.includes(name)) {
        throw new Error(`Column name (${name}) not in DataFrame`);
      }
    });

    return new DataFrameRow(Object.fromEntries(arrayNames.map(name => [name, this.row[name]])));
  }

  public cells() {
    return Object.values(this.row);
  }
}

export const createDataFrameRowType = {
  name: 'DataFrameRow',
  dependencies: ['typed'],
  creator: ({ typed }: { typed: any }) => {
    // create a new data type

    // define a new data type with typed-function
    typed.addType({
      name: 'DataFrameRow',
      test: (x: unknown) => {
        // test whether x is of type DataFrame
        return x && typeof x === 'object' && 'isDataFrameRow' in x;
      },
    });

    return DataFrameRow;
  },
};

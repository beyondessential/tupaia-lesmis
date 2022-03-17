/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { OrderedSet } from './OrderedSet';
import { Row } from '../../../types';
import { DataFrameRow } from './DataFrameRow';
import { DataFrameColumn } from './DataFrameColumn';

export class DataFrame {
  public isDataFrame = true;

  public readonly columnNames: string[];

  private readonly rowData: Row[];

  public length: number;

  constructor(rows: Row[]) {
    this.rowData = rows;

    const columnSet = new Set<string>();
    this.rowData.forEach(row => {
      Object.keys(row).forEach(col => columnSet.add(col));
    });

    this.columnNames = Array.from(columnSet);
    this.length = this.rowData.length;
  }

  public row(index: number) {
    if (index < 1 || index > this.length) {
      throw new Error(`Index (${index}) out of length of DataFrame`);
    }
    return new DataFrameRow(this.rowData[index - 1]);
  }

  public rows(indexes: number[] | OrderedSet<number>) {
    const arrayIndexes = Array.isArray(indexes) ? indexes : Array.from(indexes);
    arrayIndexes.forEach(index => {
      if (index < 1 || index > this.length) {
        throw new Error(`Index (${index}) out of length of DataFrame`);
      }
    });

    return new DataFrame(arrayIndexes.map(index => this.rowData[index - 1]));
  }

  public column(name: string) {
    if (!this.columnNames.includes(name)) {
      throw new Error(`Column name (${name}) not in DataFrame`);
    }
    return new DataFrameColumn(
      name,
      this.rowData.map(row => row[name]),
    );
  }

  public columns(names: string[] | OrderedSet<string>) {
    const arrayNames = Array.isArray(names) ? names : Array.from(names);
    arrayNames.forEach(name => {
      if (!this.columnNames.includes(name)) {
        throw new Error(`Column name (${name}) not in DataFrame`);
      }
    });

    return new DataFrame(
      this.rowData.map(row => Object.fromEntries(arrayNames.map(name => [name, row[name]]))),
    );
  }

  public cells() {
    return this.rowData.map(row => Object.values(row)).flat();
  }
}

export const createDataFrameType = {
  name: 'DataFrame',
  dependencies: ['typed'],
  creator: ({ typed }: { typed: any }) => {
    // create a new data type

    // define a new data type with typed-function
    typed.addType({
      name: 'DataFrame',
      test: (x: unknown) => {
        // test whether x is of type DataFrame
        return x && typeof x === 'object' && 'isDataFrame' in x;
      },
    });

    return DataFrame;
  },
};

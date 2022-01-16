/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { OrderedSet } from './OrderedSet';
import { FieldValue, Row } from '../../../types';

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
    const arrayIndexes = Array.isArray(indexes) ? indexes : indexes.arrayValues();
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
    const arrayNames = Array.isArray(names) ? names : names.arrayValues();
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

export class DataFrameRow {
  private readonly columns: string[];

  private readonly row: Row;

  constructor(row: Row) {
    this.row = row;

    const columnSet = new Set<string>(Object.keys(row));
    this.columns = Array.from(columnSet);
  }

  public column(name: string) {
    return this.row[name];
  }
}

export class DataFrameColumn {
  private readonly name: string;

  private readonly values: FieldValue[];

  private readonly length: number;

  constructor(name: string, values: FieldValue[]) {
    this.name = name;
    this.values = values;
    this.length = values.length;
  }

  public row(index: number) {
    if (index < 1 || index > this.length) {
      throw new Error(`Index (${index}) out of length of DataFrame`);
    }
    return this.values[index - 1];
  }
}

// factory function which defines a new data type CustomValue
export const createDataFrameType = {
  name: 'DataFrame',
  dependencies: ['typed'],
  creator: ({ typed }) => {
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
  },
};

// import the new data type and function

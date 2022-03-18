/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { Row } from '../../../types';
import { OrderedSet } from './OrderedSet';

export class DataFrameRow {
  public isDataFrameRow = true;
  public readonly columnNames: OrderedSet<string>;

  private readonly row: Row;

  public static checkIsDataFrameRow(input: unknown): input is DataFrameRow {
    return typeof input === 'object' && input !== null && 'isDataFrameRow' in input;
  }

  constructor(row: Row, columnNames?: OrderedSet<string>) {
    this.row = row;
    this.columnNames = columnNames || new OrderedSet(Object.keys(row));
  }

  public column(name: string) {
    return this.row[name];
  }

  public columns(names: string[] | OrderedSet<string>) {
    const arrayNames = Array.isArray(names) ? names : names.asArray();
    arrayNames.forEach(name => {
      if (!this.columnNames.has(name)) {
        throw new Error(`Column name (${name}) not in DataFrame`);
      }
    });

    return new DataFrameRow(
      Object.fromEntries(arrayNames.map(name => [name, this.row[name]])),
      this.columnNames,
    );
  }

  public raw() {
    return this.row;
  }

  public cells() {
    return Object.values(this.row);
  }
}

export const createDataFrameRowType = {
  name: 'DataFrameRow',
  dependencies: ['typed'],
  creator: ({ typed }: { typed: any }) => {
    typed.addType({
      name: 'DataFrameRow',
      test: DataFrameRow.checkIsDataFrameRow,
    });

    return DataFrameRow;
  },
};

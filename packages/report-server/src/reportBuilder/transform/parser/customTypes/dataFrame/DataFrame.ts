/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { OrderedSet } from '../OrderedSet';
import { FieldValue, Row } from '../../../../types';
import { DataFrameRow } from './DataFrameRow';
import { DataFrameColumn } from './DataFrameColumn';

export class DataFrame {
  public isDataFrame = true;
  public readonly columnNames: OrderedSet<string>;
  private readonly rowData: Row[];

  public static checkIsDataFrame(input: unknown): input is DataFrame {
    return typeof input === 'object' && input !== null && 'isDataFrame' in input;
  }

  constructor(rowsOrDf?: DataFrame);
  constructor(rowsOrDf?: Row[] | DataFrameRow[], columnNames?: OrderedSet<string>);
  constructor(rowsOrDf: Row[] | DataFrameRow[] | DataFrame = [], columnNames?: OrderedSet<string>) {
    if (DataFrame.checkIsDataFrame(rowsOrDf)) {
      this.rowData = rowsOrDf.rowData.map(row => ({ ...row }));
      this.columnNames = new OrderedSet(rowsOrDf.columnNames);
    } else {
      this.rowData = rowsOrDf.map((row: Row | DataFrameRow) =>
        DataFrameRow.checkIsDataFrameRow(row) ? { ...row.raw() } : { ...row },
      );
      this.columnNames =
        columnNames || new OrderedSet(this.rowData.map(row => Object.keys(row)).flat());
    }
  }

  public rowCount() {
    return this.rowData.length;
  }

  public truncate() {
    return new DataFrame([], this.columnNames);
  }

  public insertRow(row: Row, position?: number) {
    if (position !== undefined) {
      this.rowData.splice(position, 0, row);
    } else {
      this.rowData.push(row);
    }
    Object.keys(row).forEach(columnName => this.columnNames.add(columnName));
  }

  public row(index: number) {
    if (index < 1 || index > this.rowCount()) {
      throw new Error(`Index (${index}) out of length of DataFrame`);
    }
    return new DataFrameRow(this.rowData[index - 1], index, this.columnNames);
  }

  public rows(matcher: number[] | OrderedSet<number> | ((row: DataFrameRow) => boolean)) {
    if (typeof matcher === 'function') {
      return new DataFrame(
        Array(this.rowCount())
          .fill(0)
          .map((_, i) => this.row(i + 1))
          .filter(row => matcher(row)),
        this.columnNames,
      );
    }

    const arrayIndexes = Array.isArray(matcher) ? matcher : matcher.asArray();
    arrayIndexes.forEach(index => {
      if (index < 1 || index > this.rowCount()) {
        throw new Error(`Index (${index}) out of length of DataFrame`);
      }
    });

    return new DataFrame(arrayIndexes.map(index => this.rowData[index - 1], this.columnNames));
  }

  public rawRows() {
    return this.rowData.map(row =>
      Object.fromEntries(this.columnNames.asArray().map(column => [column, row[column]])),
    );
  }

  public insertColumn(name: string, values: FieldValue[]) {
    this.columnNames.add(name);
    values.forEach((value, index) => {
      if (index < this.rowCount()) {
        this.rowData[index][name] = value;
      } else {
        const newRow = { [name]: value };
        this.rowData.push(newRow);
      }
    });
  }

  public dropColumn(name: string) {
    this.columnNames.delete(name);
    this.rowData.forEach(row => {
      // eslint-disable-next-line no-param-reassign
      delete row[name];
    });
  }

  public column(name: string) {
    if (!this.columnNames.has(name)) {
      throw new Error(`Column name (${name}) not in DataFrame`);
    }
    return new DataFrameColumn(
      name,
      this.rowData.map(row => row[name]),
    );
  }

  private getMatchingColumnNames(
    matcher: string[] | OrderedSet<string> | ((column: DataFrameColumn) => boolean),
  ) {
    if (typeof matcher === 'function') {
      return this.columnNames
        .asArray()
        .map(name => this.column(name))
        .filter(column => matcher(column))
        .map(column => column.name);
    }

    return Array.isArray(matcher) ? matcher : matcher.asArray();
  }

  public columns(matcher: string[] | OrderedSet<string> | ((column: DataFrameColumn) => boolean)) {
    const arrayNames = this.getMatchingColumnNames(matcher);
    arrayNames.forEach(name => {
      if (!this.columnNames.has(name)) {
        throw new Error(`Column (${name}) not found`);
      }
    });

    return new DataFrame(
      this.rowData.map(row => Object.fromEntries(arrayNames.map(name => [name, row[name]]))),
    );
  }

  public cells() {
    return this.rowData.map(row => Object.values(row)).flat();
  }

  public [Symbol.iterator]() {
    let index = -1;
    const data = this.rowData.map((row, i) => new DataFrameRow(row, i + 1, this.columnNames));

    return {
      next: () => ({ value: data[++index], done: !(index in data) }),
    };
  }
}

export const createDataFrameType = {
  name: 'DataFrame',
  dependencies: ['typed'],
  creator: ({ typed }: { typed: any }) => {
    typed.addType({
      name: 'DataFrame',
      test: DataFrame.checkIsDataFrame,
    });

    return DataFrame;
  },
};

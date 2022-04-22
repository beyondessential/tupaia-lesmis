/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { Row } from '../../../../types';
import { OrderedSet } from '../OrderedSet';

export class TableRow {
  public isTableRow = true;
  public readonly columnNames: OrderedSet<string>;
  public readonly index: number;

  private readonly row: Row;

  public static checkIsTableRow(input: unknown): input is TableRow {
    return typeof input === 'object' && input !== null && 'isTableRow' in input;
  }

  public constructor(row: Row, index: number, columnNames?: OrderedSet<string>) {
    this.row = { ...row };
    this.index = index;
    this.columnNames = columnNames ? new OrderedSet(columnNames) : new OrderedSet(Object.keys(row));
  }

  public column(name: string) {
    return this.row[name];
  }

  public columns(names: string[] | OrderedSet<string>) {
    const arrayNames = Array.isArray(names) ? names : names.asArray();
    arrayNames.forEach(name => {
      if (!this.columnNames.has(name)) {
        throw new Error(`Column (${name}) not found in row (${this.index})`);
      }
    });

    return new TableRow(
      Object.fromEntries(arrayNames.map(name => [name, this.row[name]])),
      this.index,
      this.columnNames,
    );
  }

  public raw() {
    return Object.fromEntries(this.columnNames.asArray().map(name => [name, this.row[name]]));
  }

  public cells() {
    return Object.values(this.row);
  }
}

export const createTableRowType = {
  name: 'TableRow',
  dependencies: ['typed'],
  creator: ({ typed }: { typed: any }) => {
    typed.addType({
      name: 'TableRow',
      test: TableRow.checkIsTableRow,
    });

    return TableRow;
  },
};

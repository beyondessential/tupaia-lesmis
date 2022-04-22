/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { FieldValue } from '../../../../types';
import { OrderedSet } from '../OrderedSet';

export class TableColumn {
  public isTableColumn = true;
  public readonly name: string;
  public readonly length: number;

  private readonly values: FieldValue[];

  public static checkIsTableColumn(input: unknown): input is TableColumn {
    return typeof input === 'object' && input !== null && 'isTableColumn' in input;
  }

  public constructor(name: string, values: FieldValue[]) {
    this.name = name;
    this.values = [...values];
    this.length = values.length;
  }

  public row(index: number) {
    if (index < 1 || index > this.length) {
      throw new Error(`Index (${index}) out of column (${this.name})`);
    }
    return this.values[index - 1];
  }

  public rows(indexes: number[] | OrderedSet<number>) {
    const arrayIndexes = Array.isArray(indexes) ? indexes : indexes.asArray();
    arrayIndexes.forEach(index => {
      if (index < 1 || index > this.length) {
        throw new Error(`Index (${index}) out of column (${this.name})`);
      }
    });

    return new TableColumn(
      this.name,
      arrayIndexes.map(index => this.values[index - 1]),
    );
  }

  public cells() {
    return this.values;
  }
}

export const createTableColumnType = {
  name: 'TableColumn',
  dependencies: ['typed'],
  creator: ({ typed }: { typed: any }) => {
    typed.addType({
      name: 'TableColumn',
      test: TableColumn.checkIsTableColumn,
    });

    return TableColumn;
  },
};

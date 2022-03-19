/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { FieldValue } from '../../../../types';
import { OrderedSet } from '../OrderedSet';

export class DataFrameColumn {
  public isDataFrameColumn = true;
  public readonly name: string;
  public readonly length: number;

  private readonly values: FieldValue[];

  public static checkIsDataFrameColumn(input: unknown): input is DataFrameColumn {
    return typeof input === 'object' && input !== null && 'isDataFrameColumn' in input;
  }

  constructor(name: string, values: FieldValue[]) {
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

    return new DataFrameColumn(
      this.name,
      arrayIndexes.map(index => this.values[index - 1]),
    );
  }

  public cells() {
    return this.values;
  }
}

export const createDataFrameColumnType = {
  name: 'DataFrameColumn',
  dependencies: ['typed'],
  creator: ({ typed }: { typed: any }) => {
    typed.addType({
      name: 'DataFrameColumn',
      test: DataFrameColumn.checkIsDataFrameColumn,
    });

    return DataFrameColumn;
  },
};

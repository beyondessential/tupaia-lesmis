/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { FieldValue } from '../../../types';
import { OrderedSet } from './OrderedSet';

export class DataFrameColumn {
  public isDataFrameColumn = true;
  public readonly name: string;
  public readonly length: number;

  private readonly values: FieldValue[];

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

  public rows(indexes: number[] | OrderedSet<number>) {
    const arrayIndexes = Array.isArray(indexes) ? indexes : indexes.asArray();
    arrayIndexes.forEach(index => {
      if (index < 1 || index > this.length) {
        throw new Error(`Index (${index}) out of length of DataFrame`);
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
    // create a new data type

    // define a new data type with typed-function
    typed.addType({
      name: 'DataFrameColumn',
      test: (x: unknown) => {
        // test whether x is of type DataFrame
        return x && typeof x === 'object' && 'isDataFrameColumn' in x;
      },
    });

    return DataFrameColumn;
  },
};

/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { FieldValue } from '../../types';
import { TransformParser } from '../parser';
import { Table } from '../parser/customTypes';

export const getColumnMatcher = (columnsToMatch: '*' | string | string[]) => {
  if (columnsToMatch === '*') {
    return () => true;
  }

  if (typeof columnsToMatch === 'string') {
    return (field: string) => field === columnsToMatch;
  }

  return (field: string) => columnsToMatch.includes(field);
};

const isIterable = (input: unknown): input is Iterable<unknown> => {
  // @ts-expect-error Typescript doesn't know Symbol.iterator exists, but this is how you check for iterables in js
  return typeof input === 'object' && typeof input[Symbol.iterator] === 'function';
};

const columnNameValidator = yup.array().of(yup.string().required()).required();
export const validateEvaluatedColumnNames = (input: unknown) => {
  // checks for null and undefined
  if (input === null) {
    throw new Error('Column name expression resolved to null');
  }

  const arrayOfColumnNames = isIterable(input)
    ? Array.from(input).filter(name => name !== undefined)
    : [input];
  return columnNameValidator.validateSync(arrayOfColumnNames);
};

export const buildNewColumns = (
  table: Table,
  parser: TransformParser,
  columnExpressions: Record<string, string>,
  where?: (parser: TransformParser) => boolean,
) => {
  const newColumns: Record<string, FieldValue[]> = {};

  [...table].forEach((_, index) => {
    const skipRow = where && !where(parser);
    Object.entries(columnExpressions).forEach(([key, expression]) => {
      const evaluatedKey = parser.evaluate(key);
      const columnNames = validateEvaluatedColumnNames(evaluatedKey);
      columnNames.forEach((columnName: string) => {
        const columnData =
          newColumns[columnName] || new Array(table.rowCount()).fill(Table.SKIP_UPSERT_CHAR);
        newColumns[columnName] = columnData;
        if (skipRow) {
          return;
        }

        columnData[index] = parser.evaluate(expression);
        parser.nextColumn();
      });
    });

    parser.nextRow();
  });

  return newColumns;
};

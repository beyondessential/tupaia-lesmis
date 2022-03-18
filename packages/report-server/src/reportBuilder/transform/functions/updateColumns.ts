/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';

import { Context } from '../../context';
import { FieldValue } from '../../types';
import { TransformParser } from '../parser';
import { buildWhere } from './where';
import {
  mapStringToStringValidator,
  starSingleOrMultipleColumnsValidator,
} from './transformValidators';
import { getColumnMatcher, validateEvaluatedColumnNames } from './helpers';
import { DataFrame } from '../parser/customTypes';

type UpdateColumnsParams = {
  insert: { [key: string]: string };
  shouldIncludeColumn: (field: string) => boolean;
  where: (parser: TransformParser) => boolean;
};

export const paramsValidator = yup.object().shape({
  insert: mapStringToStringValidator,
  include: starSingleOrMultipleColumnsValidator,
  exclude: starSingleOrMultipleColumnsValidator,
  where: yup.string(),
});

const updateColumns = (df: DataFrame, params: UpdateColumnsParams, context: Context) => {
  const parser = new TransformParser(df, context);
  const newDf = new DataFrame(df);
  const newColumns: Record<string, FieldValue[]> = {};
  [...df].forEach((_, index) => {
    const skipRow = !params.where(parser);
    Object.entries(params.insert).forEach(([key, expression]) => {
      const evaluatedKey = parser.evaluate(key);
      const columnNames = validateEvaluatedColumnNames(evaluatedKey);
      columnNames.forEach((columnName: string) => {
        const columnData = newColumns[columnName] || new Array(df.rowCount()).fill(undefined);
        newColumns[columnName] = columnData;
        if (skipRow) {
          return;
        }

        parser.setColumnName(columnName);
        columnData[index] = parser.evaluate(expression);
        parser.setColumnName(undefined);
      });
    });

    parser.next();
  });

  Object.entries(newColumns).forEach(([columnName, columnData]) =>
    newDf.insertColumn(columnName, columnData),
  );

  const newColumnNames = Object.keys(newColumns);
  const columnsToDelete = df.columnNames
    .asArray()
    .filter(column => !newColumnNames.includes(column) && !params.shouldIncludeColumn(column));
  columnsToDelete.forEach(column => newDf.dropColumn(column));

  return newDf;
};

const buildParams = (params: unknown): UpdateColumnsParams => {
  const validatedParams = paramsValidator.validateSync(params);

  const { insert, include, exclude } = validatedParams;

  const inclusionPolicy = exclude ? 'exclude' : 'include';
  const policyColumns = exclude || include || '*';

  const columnMatcher = getColumnMatcher(policyColumns);
  const shouldIncludeColumn =
    inclusionPolicy === 'include'
      ? (column: string) => columnMatcher(column)
      : (column: string) => !columnMatcher(column);

  return {
    insert: insert || {},
    shouldIncludeColumn,
    where: buildWhere(params),
  };
};

export const buildUpdateColumns = (params: unknown, context: Context) => {
  const builtParams = buildParams(params);
  return (df: DataFrame) => updateColumns(df, builtParams, context);
};

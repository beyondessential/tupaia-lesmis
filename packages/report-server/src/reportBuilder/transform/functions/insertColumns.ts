/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';

import { Context } from '../../context';
import { FieldValue } from '../../types';
import { TransformParser } from '../parser';
import { buildWhere } from './where';
import { mapStringToStringValidator } from './transformValidators';
import { validateEvaluatedColumnNames } from './helpers';
import { DataFrame } from '../parser/customTypes';

type InsertColumnsParams = {
  columns: { [key: string]: string };
  where: (parser: TransformParser) => boolean;
};

export const paramsValidator = yup.object().shape({
  columns: mapStringToStringValidator,
  where: yup.string(),
});

const insertColumns = (df: DataFrame, params: InsertColumnsParams, context: Context) => {
  const parser = new TransformParser(df, context);
  const newDf = new DataFrame(df);
  const newColumns: Record<string, FieldValue[]> = {};
  [...df].forEach((_, index) => {
    const skipRow = !params.where(parser);
    Object.entries(params.columns).forEach(([key, expression]) => {
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
  return newDf;
};

const buildParams = (params: unknown): InsertColumnsParams => {
  const validatedParams = paramsValidator.validateSync(params);

  const { columns } = validatedParams;

  if (columns === undefined) {
    throw new Error('columns key must be defined for insertColumns');
  }

  return {
    columns,
    where: buildWhere(params),
  };
};

export const buildInsertColumns = (params: unknown, context: Context) => {
  const builtParams = buildParams(params);
  return (df: DataFrame) => insertColumns(df, builtParams, context);
};

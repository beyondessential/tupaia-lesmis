/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { yupTsUtils } from '@tupaia/tsutils';

import { RawRow } from '../../types';
import { Context } from '../../context';
import { TransformParser } from '../parser';
import { buildWhere } from './where';
import { mapStringToStringValidator } from './transformValidators';
import { validateEvaluatedColumnNames } from './helpers';
import { Table } from '../parser/customTypes';

type InsertParams = {
  columns: { [key: string]: string };
  where: (parser: TransformParser) => boolean;
  positioner: (index: number, insertCount: number) => number;
};

const positioners = {
  before: (index: number, insertCount: number) => index + insertCount,
  after: (index: number, insertCount: number) => index + insertCount + 1,
  start: (index: number, insertCount: number) => insertCount,
};

const positionValidator = yup
  .mixed<'before' | 'after' | 'start'>()
  .oneOf(['before', 'after', 'start'])
  .default('after');

export const paramsValidator = yup.object().shape({
  columns: mapStringToStringValidator,
  where: yup.string(),
  position: yupTsUtils.describableLazy(() => {
    return positionValidator;
  }, [positionValidator]),
});

const insertRows = (table: Table, params: InsertParams, context: Context) => {
  const rows = [...table];
  const parser = new TransformParser(table, context);
  const newDf = new Table(table);
  const rowsToInsert = rows.map(() => {
    const shouldInsertNewRow = params.where(parser);
    if (!shouldInsertNewRow) {
      parser.next();
      return undefined;
    }
    const newRow: RawRow = {};
    Object.entries(params.columns).forEach(([key, expression]) => {
      const evaluatedKey = parser.evaluate(key);
      const columnNames = validateEvaluatedColumnNames(evaluatedKey);
      columnNames.forEach((columnName: string) => {
        parser.setColumnName(columnName);
        newRow[columnName] = parser.evaluate(expression);
        parser.setColumnName(undefined);
      });
    });

    parser.next();
    return newRow;
  });
  let insertCount = 0;
  rowsToInsert.forEach((newRow, index) => {
    if (newRow !== undefined) {
      newDf.insertRow(newRow, params.positioner(index, insertCount));
      insertCount++;
    }
  });
  return newDf;
};

const buildParams = (params: unknown): InsertParams => {
  const validatedParams = paramsValidator.validateSync(params);

  const { position, columns } = validatedParams;

  if (columns === undefined) {
    throw new Error('columns key must be defined for insertRows');
  }

  return {
    columns,
    where: buildWhere(params),
    positioner: positioners[position],
  };
};

export const buildInsertRows = (params: unknown, context: Context) => {
  const builtParams = buildParams(params);
  return (table: Table) => insertRows(table, builtParams, context);
};

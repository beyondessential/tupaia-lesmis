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
import { getColumnMatcher, buildNewColumns } from './helpers';
import { Table } from '../parser/customTypes';

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

const updateColumns = (table: Table, params: UpdateColumnsParams, context: Context) => {
  const parser = new TransformParser(table, context);
  const newColumns = buildNewColumns(table, parser, params.insert, params.where);
  const newDf = new Table(table);
  Object.entries(newColumns).forEach(([columnName, columnData]) =>
    newDf.upsertColumn(columnName, columnData),
  );

  const newColumnNames = Object.keys(newColumns);
  const columnsToDelete = table.columnNames
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
  return (table: Table) => updateColumns(table, builtParams, context);
};

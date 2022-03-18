/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { starSingleOrMultipleColumnsValidator } from './transformValidators';
import { getColumnMatcher } from './helpers';
import { DataFrame } from '../parser/customTypes';

type ExcludeColumnsParams = {
  shouldIncludeColumn: (field: string) => boolean;
};

export const paramsValidator = yup.object().shape({
  columns: starSingleOrMultipleColumnsValidator,
  where: yup.string(),
});

const excludeColumns = (df: DataFrame, params: ExcludeColumnsParams) => {
  const newDf = new DataFrame(df);
  const columnsToDelete = newDf.columnNames
    .asArray()
    .filter(column => !params.shouldIncludeColumn(column));
  columnsToDelete.forEach(column => newDf.dropColumn(column));
  return newDf;
};

const buildParams = (params: unknown): ExcludeColumnsParams => {
  const { columns } = paramsValidator.validateSync(params);
  if (!columns) {
    throw new Error('columns must be defined');
  }

  const columnMatcher = getColumnMatcher(columns);
  const shouldIncludeColumn = (column: string) => !columnMatcher(column);

  return { shouldIncludeColumn };
};

export const buildExcludeColumns = (params: unknown) => {
  const builtParams = buildParams(params);
  return (df: DataFrame) => excludeColumns(df, builtParams);
};

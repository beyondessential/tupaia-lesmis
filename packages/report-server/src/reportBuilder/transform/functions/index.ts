/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { Context } from '../../context';
import { Row } from '../../types';

import {
  buildInsertColumns,
  paramsValidator as insertColumnsParamsValidator,
} from './insertColumns';
import {
  buildExcludeColumns,
  paramsValidator as excludeColumnsParamsValidator,
} from './excludeColumns';
import {
  buildUpdateColumns,
  paramsValidator as updateColumnsParamsValidator,
} from './updateColumns';
import { buildMergeRows, paramsValidator as mergeRowsParamsValidator } from './mergeRows';
import { buildSortRows, paramsValidator as sortRowsParamsValidator } from './sortRows';
import { buildExcludeRows, paramsValidator as excludeRowsParamsValidator } from './excludeRows';
import { buildInsertRows, paramsValidator as insertRowsParamsValidator } from './insertRows';
import {
  buildGatherColumns,
  paramsValidator as gatherColumnsParamsValidator,
} from './gatherColumns';
import { buildFetchData, paramsValidator as fetchDataParamsValidator } from './fetchData';

type TransformBuilder = (
  params: unknown,
  context: Context,
) => (rows: Row[]) => Row[] | Promise<Row[]>;

export const transformBuilders: Record<string, TransformBuilder> = {
  fetchData: buildFetchData,
  insertColumns: buildInsertColumns,
  excludeColumns: buildExcludeColumns,
  updateColumns: buildUpdateColumns,
  mergeRows: buildMergeRows,
  sortRows: buildSortRows,
  excludeRows: buildExcludeRows,
  insertRows: buildInsertRows,
  gatherColumns: buildGatherColumns,
};

export const transformSchemas: Record<
  string,
  {
    type: string;
    fields: Record<string, unknown>;
  }
> = {
  fetchData: fetchDataParamsValidator.describe(),
  insertColumns: insertColumnsParamsValidator.describe(),
  excludeColumns: excludeColumnsParamsValidator.describe(),
  updateColumns: updateColumnsParamsValidator.describe(),
  mergeRows: mergeRowsParamsValidator.describe(),
  sortRows: sortRowsParamsValidator.describe(),
  excludeRows: excludeRowsParamsValidator.describe(),
  insertRows: insertRowsParamsValidator.describe(),
  gatherColumns: gatherColumnsParamsValidator.describe(),
};

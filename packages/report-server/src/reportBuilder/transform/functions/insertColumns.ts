/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';

import { Context } from '../../context';
import { TransformParser } from '../parser';
import { buildWhere } from './where';
import { mapStringToStringValidator } from './transformValidators';
import { buildNewColumns } from './helpers';
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
  const newColumns = buildNewColumns(df, parser, params.columns, params.where);
  const newDf = new DataFrame(df);
  Object.entries(newColumns).forEach(([columnName, columnData]) =>
    newDf.upsertColumn(columnName, columnData),
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

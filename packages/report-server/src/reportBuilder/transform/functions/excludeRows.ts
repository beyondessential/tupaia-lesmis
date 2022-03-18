/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { TransformParser } from '../parser';
import { buildWhere } from './where';
import { Context } from '../../context';
import { DataFrame } from '../parser/customTypes';

type ExcludeRowsParams = {
  where: (parser: TransformParser) => boolean;
};

export const paramsValidator = yup.object().shape({
  where: yup.string(),
});

const excludeRows = (df: DataFrame, params: ExcludeRowsParams, context: Context) => {
  const parser = new TransformParser(df, context);
  const newDf = df.truncate();

  df.rawRows().forEach(row => {
    const filterResult = !params.where(parser);
    parser.next();
    if (filterResult) {
      newDf.insertRow(row);
    }
  });

  return newDf;
};

const buildParams = (params: unknown): ExcludeRowsParams => {
  paramsValidator.validateSync(params);
  return { where: buildWhere(params) };
};

export const buildExcludeRows = (params: unknown, context: Context) => {
  const builtParams = buildParams(params);
  return (df: DataFrame) => excludeRows(df, builtParams, context);
};

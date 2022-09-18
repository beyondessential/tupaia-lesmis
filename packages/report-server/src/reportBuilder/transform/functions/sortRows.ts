/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { yupTsUtils } from '@tupaia/tsutils';

import { Row } from '../../types';
import { starSingleOrMultipleColumnsValidator } from './transformValidators';
import { TransformTable } from '../table';

type SortParams = {
  by: string | string[];
  direction: 'asc' | 'desc' | ('asc' | 'desc')[];
};

const ascOrDescValidator = yup.mixed<'asc' | 'desc'>().oneOf(['asc', 'desc']);

export const paramsValidator = yup.object().shape({
  by: starSingleOrMultipleColumnsValidator,
  direction: yupTsUtils.describableLazy(
    (value: unknown) => {
      if (typeof value === 'string' || value === undefined) {
        return ascOrDescValidator;
      }

      if (Array.isArray(value)) {
        return yup.array().of(ascOrDescValidator.required());
      }

      throw new yup.ValidationError(
        'Input must be either be asc, desc, or an array of [asc or desc]',
      );
    },
    [ascOrDescValidator, yup.array().of(ascOrDescValidator.required())],
  ),
});

const sortByColumn = (columnName: string, direction: 'asc' | 'desc') => {
  return (row1: Row, row2: Row) => {
    if (row1[columnName] === row2[columnName]) {
      return 0;
    }

    const row1Value = row1[columnName];
    const row2Value = row2[columnName];

    let sortResult: number;
    if (row1Value === null || row1Value === undefined) {
      if (row2Value === null || row2Value === undefined) {
        sortResult = 0;
      } else {
        sortResult = -1;
      }
    } else if (row2Value === null || row2Value === undefined) {
      sortResult = 1;
    } else {
      sortResult = row1Value < row2Value ? -1 : 1;
    }

    return sortResult * (direction === 'asc' ? 1 : -1);
  };
};

const sortRows = (table: TransformTable, params: SortParams) => {
  const { by, direction } = params;

  const bys = typeof by === 'string' ? [by] : by;
  const directions = typeof direction === 'string' ? [direction] : direction;
  const reversedBys = [...bys].reverse();
  const reversedDirections = [...directions].reverse();
  let newRowData = table.getRows();
  reversedBys.forEach((columnName, sortIndex) => {
    const directionForIndex =
      reversedDirections[Math.min(sortIndex, reversedDirections.length - 1)];
    newRowData = newRowData.sort(sortByColumn(columnName, directionForIndex));
  });

  return new TransformTable(table.getColumns(), newRowData);
};

const buildParams = (params: unknown): SortParams => {
  const validatedParams = paramsValidator.validateSync(params);

  const { by, direction = 'asc' } = validatedParams;

  if (!by) {
    throw new Error('by is required in sortRows');
  }

  return {
    by,
    direction,
  };
};

export const buildSortRows = (params: unknown) => {
  const builtSortParams = buildParams(params);
  return (table: TransformTable) => sortRows(table, builtSortParams);
};

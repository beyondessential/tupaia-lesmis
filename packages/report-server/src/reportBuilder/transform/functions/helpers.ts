/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';

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
  // @ts-ignore
  return typeof input === 'object' && typeof input[Symbol.iterator] === 'function';
};

const columnNameValidator = yup.array().of(yup.string().required()).required();
export const validateEvaluatedColumnNames = (input: unknown) => {
  // checks for null and undefined
  if (input === null) {
    throw new Error('Column name expression resolved to null');
  }

  const arrayOfColumnNames = isIterable(input) ? Array.from(input) : [input];
  return columnNameValidator.validateSync(arrayOfColumnNames);
};

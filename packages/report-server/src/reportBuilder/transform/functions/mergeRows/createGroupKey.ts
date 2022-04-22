/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { RawRow } from '../../../types';

export const buildCreateGroupKey = (groupBy: undefined | string | string[]) => {
  return (row: RawRow) => {
    if (groupBy === undefined) {
      return '*';
    }

    if (typeof groupBy === 'string') {
      return `${row[groupBy]}`;
    }

    return groupBy.map(field => row[field]).join('___');
  };
};

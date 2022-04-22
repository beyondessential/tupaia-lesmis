/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { yupTsUtils } from '@tupaia/tsutils';

import { mergeStrategies } from './mergeStrategies';
import { RawRow, FieldValue } from '../../../types';
import { buildCreateGroupKey } from './createGroupKey';
import { buildGetMergeStrategy } from './getMergeStrategy';
import { starSingleOrMultipleColumnsValidator } from '../transformValidators';
import { Table, OrderedSet } from '../../parser/customTypes';

type MergeRowsParams = {
  createGroupKey: (row: RawRow) => string;
  getMergeStrategy: (field: string) => keyof typeof mergeStrategies;
};

const optionalMergeStrategyNameValidator = yup
  .mixed<keyof typeof mergeStrategies>()
  .oneOf(Object.keys(mergeStrategies) as (keyof typeof mergeStrategies)[]);
const mergeStrategyNameValidator = optionalMergeStrategyNameValidator.required();

export const paramsValidator = yup.object().shape({
  groupBy: starSingleOrMultipleColumnsValidator,
  using: yupTsUtils.describableLazy(
    (value: unknown) => {
      if (value === undefined) {
        return optionalMergeStrategyNameValidator;
      }

      if (typeof value === 'string') {
        return mergeStrategyNameValidator;
      }

      if (typeof value === 'object' && value !== null) {
        const mergeStrategyMapValidator = Object.fromEntries(
          Object.entries(value).map(([columnName]) => [columnName, mergeStrategyNameValidator]),
        );
        return yup.object().shape(mergeStrategyMapValidator).required();
      }

      throw new yup.ValidationError(
        'mergeUsing must be either a single merge strategy, or a mapping between columns and merge strategies',
      );
    },
    [optionalMergeStrategyNameValidator, yup.object().shape({})],
  ),
  where: yup.string(),
});

/**
 * A group represents a key of fields, to all the values each row in that group had for the respective field
 *
 * eg.
 * [{orgUnit: TO, BCD1: 4 }, {orgUnit: TO, BCD1: 7 }], groupBy orgUnit => group: { BCD1: [4, 7] }
 */
type Group = {
  [fieldKey: string]: FieldValue[];
};

const groupRows = (table: Table, params: MergeRowsParams) => {
  const groupsByKey: Record<string, Group> = {};
  const rows = table.rawRows();

  rows.forEach((row: RawRow) => {
    const groupKey = params.createGroupKey(row);
    addRowToGroup(groupsByKey, groupKey, row); // mutates groupsByKey
  });

  return Object.values(groupsByKey);
};

const addRowToGroup = (groupsByKey: Record<string, Group>, groupKey: string, row: RawRow) => {
  if (!groupsByKey[groupKey]) {
    // eslint-disable-next-line no-param-reassign
    groupsByKey[groupKey] = {};
  }

  const group = groupsByKey[groupKey];

  Object.keys(row).forEach((field: string) => {
    if (!group[field]) {
      // eslint-disable-next-line no-param-reassign
      group[field] = [];
    }
    group[field].push(row[field]);
  });
};

const mergeGroups = (groups: Group[], params: MergeRowsParams): RawRow[] => {
  return groups.map(group => {
    const mergedRow: RawRow = {};
    Object.entries(group).forEach(([fieldKey, fieldValue]) => {
      const mergeStrategy = params.getMergeStrategy(fieldKey);
      const mergedValue = mergeStrategies[mergeStrategy](fieldValue);
      if (mergedValue !== undefined) {
        mergedRow[fieldKey] = mergedValue;
      }
    });
    return mergedRow;
  });
};

const mergeRows = (table: Table, params: MergeRowsParams) => {
  const groups = groupRows(table, params);
  const mergedRows = mergeGroups(groups, params);
  const columnNames = table.columnNames
    .asArray()
    .filter(columnName => params.getMergeStrategy(columnName) !== 'exclude');
  return new Table(mergedRows, new OrderedSet(columnNames));
};

const buildParams = (params: unknown): MergeRowsParams => {
  const validatedParams = paramsValidator.validateSync(params);

  const { groupBy, using } = validatedParams;

  return {
    createGroupKey: buildCreateGroupKey(groupBy),
    getMergeStrategy: buildGetMergeStrategy(groupBy, using),
  };
};

export const buildMergeRows = (params: unknown) => {
  const builtParams = buildParams(params);
  return (table: Table) => mergeRows(table, builtParams);
};

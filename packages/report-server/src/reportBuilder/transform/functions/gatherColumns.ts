/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { FieldValue } from '../../types';
import { Table } from '../parser/customTypes';
import { getColumnMatcher } from './helpers';
import { gatherColumnsValidator } from './transformValidators';

type GatherColumnsParams = {
  shouldKeepColumn: (field: string) => boolean;
};

export const paramsValidator = yup.object().shape({
  keep: gatherColumnsValidator,
});

const gatherColumns = (table: Table, params: GatherColumnsParams) => {
  const { shouldKeepColumn } = params;

  return new Table(
    table
      .rawRows()
      .map(row => {
        const keptFields: Record<string, FieldValue> = {};
        const gatherFields: string[] = [];

        Object.entries(row).forEach(([key, value]) => {
          if (shouldKeepColumn(key)) {
            keptFields[key] = value;
          } else {
            gatherFields.push(key);
          }
        });

        return gatherFields.map(key => ({ ...keptFields, value: row[key], columnName: key }));
      })
      .flat(),
  );
};

const buildParams = (params: unknown): GatherColumnsParams => {
  const validatedParams = paramsValidator.validateSync(params);

  const { keep } = validatedParams;
  const policyColumns = keep || [];

  const columnMatcher = getColumnMatcher(policyColumns);
  const shouldKeepColumn = (column: string) => columnMatcher(column);

  return {
    shouldKeepColumn,
  };
};

export const buildGatherColumns = (params: unknown) => {
  const builtParams = buildParams(params);
  return (table: Table) => gatherColumns(table, builtParams);
};

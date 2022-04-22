/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { createTableType, createTableRowType, createTableColumnType } from './table';
import { createOrderedSetType } from './OrderedSet';

export { Table, TableRow, TableColumn } from './table';
export { OrderedSet } from './OrderedSet';

export const typeCreators = {
  Table: createTableType,
  TableRow: createTableRowType,
  TableColumn: createTableColumnType,
  OrderedSet: createOrderedSetType,
};

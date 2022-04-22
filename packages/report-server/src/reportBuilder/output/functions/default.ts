/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { Table } from '../../transform/parser/customTypes';

export const buildDefault = () => {
  return (table: Table) => table.rawRows();
};

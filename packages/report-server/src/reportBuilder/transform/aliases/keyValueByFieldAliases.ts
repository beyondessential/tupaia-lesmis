/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { Table, OrderedSet } from '../parser/customTypes';

/**
 * { period: '20200101', organisationUnit: 'TO', dataElement: 'CH01', value: 7 }
 *  => { period: '20200101', organisationUnit: 'TO', CH01: 7 }
 */
export const keyValueByDataElementName = () => (table: Table) => {
  const newColumns = new OrderedSet(table.columnNames);
  newColumns.delete('dataElement');
  newColumns.delete('value');
  const newDf = new Table([], newColumns);
  table.rawRows().forEach(row => {
    const { dataElement, value, ...restOfRow } = row;
    newDf.insertRow({ [dataElement as string]: value, ...restOfRow });
  });
  return newDf;
};

/**
 * { period: '20200101', organisationUnit: 'TO', dataElement: 'CH01', value: 7 }
 *  => { period: '20200101', TO: 7, dataElement: 'CH01' }
 */
export const keyValueByOrgUnit = () => (table: Table) => {
  const newColumns = new OrderedSet(table.columnNames);
  newColumns.delete('organisationUnit');
  newColumns.delete('value');
  const newDf = new Table([], newColumns);
  table.rawRows().forEach(row => {
    const { organisationUnit, value, ...restOfRow } = row;
    newDf.insertRow({ [organisationUnit as string]: value, ...restOfRow });
  });
  return newDf;
};

/**
 * { period: '20200101', organisationUnit: 'TO', dataElement: 'CH01', value: 7 }
 *  => { 20200101: 7, organisationUnit: 'TO', dataElement: 'CH01' }
 */
export const keyValueByPeriod = () => (table: Table) => {
  const newColumns = new OrderedSet(table.columnNames);
  newColumns.delete('period');
  newColumns.delete('value');
  const newDf = new Table([], newColumns);
  table.rawRows().forEach(row => {
    const { period, value, ...restOfRow } = row;
    newDf.insertRow({ [period as string]: value, ...restOfRow });
  });
  return newDf;
};

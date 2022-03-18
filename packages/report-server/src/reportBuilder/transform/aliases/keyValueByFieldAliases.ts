/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { DataFrame } from '../parser/customTypes';

/**
 * { period: '20200101', organisationUnit: 'TO', dataElement: 'CH01', value: 7 }
 *  => { period: '20200101', organisationUnit: 'TO', CH01: 7 }
 */
export const keyValueByDataElementName = () => (df: DataFrame) => {
  const newColumns = df.columnNames;
  newColumns.delete('dataElement');
  newColumns.delete('value');
  const newDf = new DataFrame([], newColumns);
  df.rawRows().forEach(row => {
    const { dataElement, value, ...restOfRow } = row;
    newDf.insertRow({ [dataElement as string]: value, ...restOfRow });
  });
  return newDf;
};

/**
 * { period: '20200101', organisationUnit: 'TO', dataElement: 'CH01', value: 7 }
 *  => { period: '20200101', TO: 7, dataElement: 'CH01' }
 */
export const keyValueByOrgUnit = () => (df: DataFrame) => {
  const newColumns = df.columnNames;
  newColumns.delete('organisationUnit');
  newColumns.delete('value');
  const newDf = new DataFrame([], newColumns);
  df.rawRows().forEach(row => {
    const { organisationUnit, value, ...restOfRow } = row;
    newDf.insertRow({ [organisationUnit as string]: value, ...restOfRow });
  });
  return newDf;
};

/**
 * { period: '20200101', organisationUnit: 'TO', dataElement: 'CH01', value: 7 }
 *  => { 20200101: 7, organisationUnit: 'TO', dataElement: 'CH01' }
 */
export const keyValueByPeriod = () => (df: DataFrame) => {
  const newColumns = df.columnNames;
  newColumns.delete('period');
  newColumns.delete('value');
  const newDf = new DataFrame([], newColumns);
  df.rawRows().forEach(row => {
    const { period, value, ...restOfRow } = row;
    newDf.insertRow({ [period as string]: value, ...restOfRow });
  });
  return newDf;
};

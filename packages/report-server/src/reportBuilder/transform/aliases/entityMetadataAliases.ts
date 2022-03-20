/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { Context } from '../../context';
import { DataFrame } from '../parser/customTypes';

/**
 * [
 *  { organisationUnit: 'TO' },
 *  { organisationUnit: 'PG' }
 * ]
 *  =>
 * [
 *  { organisationUnit: 'TO', numberOfFacilities: 14 },
 *  { organisationUnit: 'PG', numberOfFacilities: 9 }
 * ]
 */
export const insertNumberOfFacilitiesColumn = {
  transform: (context: Context) => (df: DataFrame) => {
    const { facilityCountByOrgUnit } = context;

    if (facilityCountByOrgUnit === undefined) {
      throw new Error(
        "Missing dependency 'facilityCountByOrgUnit' required by 'insertNumberOfFacilitiesColumn'",
      );
    }

    const newDf = new DataFrame([], df.columnNames);
    df.rawRows().forEach(row => {
      const { organisationUnit, ...restOfRow } = row;

      if (typeof organisationUnit !== 'string') {
        throw new Error(
          `'organisationUnit' type must be string, but got: ${typeof organisationUnit}`,
        );
      }

      newDf.insertRow({
        numberOfFacilities: facilityCountByOrgUnit[organisationUnit],
        organisationUnit,
        ...restOfRow,
      });
    });

    return newDf;
  },
  dependencies: ['facilityCountByOrgUnit'],
};

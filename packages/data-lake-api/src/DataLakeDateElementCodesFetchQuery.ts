/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { DataLakeDatabase } from './DataLakeDatabase';
import { SqlQuery } from './SqlQuery';

export type DataElementCodesFetchOptions = {
  startDate?: string;
};

export class DataLakeDataElementCodesFetchQuery {
  private readonly database: DataLakeDatabase;
  private readonly startDate?: string;

  constructor(database: DataLakeDatabase, options: DataElementCodesFetchOptions) {
    this.database = database;

    const { startDate } = options;
    this.startDate = startDate;
  }

  async fetch() {
    const { query, params } = this.buildQueryAndParams();

    const sqlQuery = new SqlQuery(query, params);

    return {
      dataElementCodes: await sqlQuery.executeOnDatabase(this.database),
    };
  }

  getPeriodConditionsAndParams() {
    const periodConditions = [];
    const periodParams = [];
    if (this.startDate) {
      periodConditions.push('date >= ?');
      periodParams.push(this.startDate);
    }

    return { periodConditions, periodParams };
  }

  getBaseWhereClauseAndParams() {
    const { periodConditions, periodParams } = this.getPeriodConditionsAndParams();

    if (periodConditions.length === 0) {
      return { clause: '', params: [] };
    }

    return { clause: `WHERE ${periodConditions.join(' AND ')}`, params: periodParams };
  }

  buildQueryAndParams() {
    const { clause: whereClause, params: whereParams } = this.getBaseWhereClauseAndParams();
    console.log({ clause: whereClause, params: whereParams });
    const query = `
      SELECT distinct data_element_code AS "dataElementCode"
      FROM analytics
      ${whereClause}
     `;

    return { query, params: whereParams };
  }
}

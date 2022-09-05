/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { PARSABLE_ANALYTICS } from '../transform.fixtures';
import { buildTransform } from '../../../../reportBuilder/transform';

describe('parser', () => {
  it('can do lookups', () => {
    const transform = buildTransform([
      {
        transform: 'updateColumns',
        insert: {
          variable: '=$BCD1',
          current: "=@row.column('BCD1')",
          index: '=@index',
          previous: "=@index > 1 ? @table.row(@index - 1).column('BCD1') : undefined",
          next: "=@index < @rowCount ? @table.row(@index + 1).column('BCD1') : undefined",
          lastOfColumn: "=last(@table.column('BCD1'))",
          sumAllPreviousOfColumn: "=sum(@table.rows(1:@index).column('BCD1'))",
          sumSetOfColumns: "=sum(@row.columns('BCD1':'BCD3'))",
          sumExcludingSetOfColumns:
            "=sum(@row.columns(@columnNames - ['period', 'organisationUnit', 'BCD1']))",
          sumWhereMatchingOrgUnit:
            "=sum(@table.rows(f(row) = $organisationUnit == row.column('organisationUnit')).column('BCD1'))",
          tableLength: '=@rowCount',
        },
        exclude: '*',
      },
    ]);
    expect(transform(PARSABLE_ANALYTICS)).toEqualTableOf([
      {
        variable: 4,
        current: 4,
        index: 1,
        previous: undefined,
        next: 2,
        lastOfColumn: 2,
        sumAllPreviousOfColumn: 4,
        sumSetOfColumns: 14,
        sumExcludingSetOfColumns: 10,
        sumWhereMatchingOrgUnit: 11,
        tableLength: 6,
      },
      {
        variable: 2,
        current: 2,
        index: 2,
        previous: 4,
        next: 5,
        lastOfColumn: 2,
        sumAllPreviousOfColumn: 6,
        sumSetOfColumns: 7,
        sumExcludingSetOfColumns: 5,
        sumWhereMatchingOrgUnit: 11,
        tableLength: 6,
      },
      {
        variable: 5,
        current: 5,
        index: 3,
        previous: 2,
        next: 7,
        lastOfColumn: 2,
        sumAllPreviousOfColumn: 11,
        sumSetOfColumns: 17,
        sumExcludingSetOfColumns: 12,
        sumWhereMatchingOrgUnit: 11,
        tableLength: 6,
      },
      {
        variable: 7,
        current: 7,
        index: 4,
        previous: 5,
        next: 8,
        lastOfColumn: 2,
        sumAllPreviousOfColumn: 18,
        sumSetOfColumns: 13,
        sumExcludingSetOfColumns: 6,
        sumWhereMatchingOrgUnit: 17,
        tableLength: 6,
      },
      {
        variable: 8,
        current: 8,
        index: 5,
        previous: 7,
        next: 2,
        lastOfColumn: 2,
        sumAllPreviousOfColumn: 26,
        sumSetOfColumns: 11,
        sumExcludingSetOfColumns: 3,
        sumWhereMatchingOrgUnit: 17,
        tableLength: 6,
      },
      {
        variable: 2,
        current: 2,
        index: 6,
        previous: 8,
        next: undefined,
        lastOfColumn: 2,
        sumAllPreviousOfColumn: 28,
        sumSetOfColumns: 15,
        sumExcludingSetOfColumns: 13,
        sumWhereMatchingOrgUnit: 17,
        tableLength: 6,
      },
    ]);
  });

  describe('in transforms', () => {
    it('excludeRows supports parser lookups on where', () => {
      const transform = buildTransform([
        {
          transform: 'excludeRows',
          where:
            "=$BCD1 <= mean(@table.rows(f(row) = $organisationUnit == row.column('organisationUnit')).column('BCD1'))",
        },
      ]);
      expect(transform(PARSABLE_ANALYTICS)).toEqualTableOf([
        { period: '20200101', organisationUnit: 'TO', BCD1: 4, BCD2: 1, BCD3: 9 },
        { period: '20200103', organisationUnit: 'TO', BCD1: 5, BCD2: 5, BCD3: 7 },
        { period: '20200101', organisationUnit: 'PG', BCD1: 7, BCD2: 4, BCD3: 2 },
        { period: '20200102', organisationUnit: 'PG', BCD1: 8, BCD2: 2, BCD3: 1 },
      ]);
    });

    it('updateColumns supports parser lookups in column name and values', () => {
      const transform = buildTransform([
        {
          transform: 'updateColumns',
          insert: {
            '=$organisationUnit': '=$BCD1',
          },
          exclude: ['organisationUnit', 'BCD1', 'BCD2', 'BCD3'],
        },
      ]);
      expect(transform(PARSABLE_ANALYTICS)).toEqualTableOf([
        { period: '20200101', TO: 4 },
        { period: '20200102', TO: 2 },
        { period: '20200103', TO: 5 },
        { period: '20200101', PG: 7 },
        { period: '20200102', PG: 8 },
        { period: '20200103', PG: 2 },
      ]);
    });

    it('sortRows supports row parser lookups', () => {
      const transform = buildTransform([
        {
          transform: 'sortRows',
          by: '=$BCD1',
        },
      ]);
      expect(transform(PARSABLE_ANALYTICS)).toEqualTableOf([
        { period: '20200102', organisationUnit: 'TO', BCD1: 2, BCD2: 2, BCD3: 3 },
        { period: '20200103', organisationUnit: 'PG', BCD1: 2, BCD2: 6, BCD3: 7 },
        { period: '20200101', organisationUnit: 'TO', BCD1: 4, BCD2: 1, BCD3: 9 },
        { period: '20200103', organisationUnit: 'TO', BCD1: 5, BCD2: 5, BCD3: 7 },
        { period: '20200101', organisationUnit: 'PG', BCD1: 7, BCD2: 4, BCD3: 2 },
        { period: '20200102', organisationUnit: 'PG', BCD1: 8, BCD2: 2, BCD3: 1 },
      ]);
    });
  });
});

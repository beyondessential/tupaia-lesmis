/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { ExpressionParser } from '@tupaia/expression-parser';

import { Context } from '../../context';
import { RawRow } from '../../types';
import {
  customFunctions,
  contextFunctions,
  functionExtensions,
  functionOverrides,
  factoryFunctions,
} from './functions';
import { typeCreators, Table, OrderedSet, TableRow, TableColumn } from './customTypes';
import { TransformScope } from './TransformScope';

/**
 * Lookup variables and functions for usage when writing expression
 */
type Lookups = {
  index: number; // one-based index of the current row being parsed
  rowCount: number; // total rows in table
  columnName: string | undefined; // current column being operated on
  columnNames: OrderedSet<string>; // all columns in the table
  row: Table['row']; // selector for an individual row
  rows: Table['rows']; // selector for an multiple rows
  column: Table['column']; // selector for an individual column
  columns: Table['columns']; // selector for multiple columns
};

export class TransformParser extends ExpressionParser {
  private static readonly EXPRESSION_PREFIX = '=';

  private table: Table;
  private lookups: Lookups;
  // eslint-disable-next-line react/static-property-placement
  private context?: Context;

  public constructor(table: Table = new Table(), context?: Context) {
    super(new TransformScope());

    this.table = table;
    this.lookups = {
      index: 1,
      rowCount: this.table.rowCount(),
      columnName: undefined,
      columnNames: this.table.columnNames,
      row: (index: number) => this.table.row(index),
      rows: (matcher: number[] | OrderedSet<number> | ((row: TableRow) => boolean)) =>
        this.table.rows(matcher),
      column: (name: string) => this.table.column(name),
      columns: (matcher: string[] | OrderedSet<string> | ((column: TableColumn) => boolean)) =>
        this.table.columns(matcher),
    };

    if (this.table.rowCount() > 0) {
      this.addRowToScope(this.table.row(this.lookups.index).raw());

      Object.entries(this.lookups).forEach(([lookupName, lookup]) => {
        this.set(`@${lookupName}`, lookup);
      });
    }

    this.context = context;
  }

  public static isExpression(input: unknown) {
    return typeof input === 'string' && input.startsWith(TransformParser.EXPRESSION_PREFIX);
  }

  protected readExpression(input: unknown) {
    return TransformParser.isExpression(input)
      ? (input as string).replace(new RegExp(`^${TransformParser.EXPRESSION_PREFIX}`), '')
      : input;
  }

  public evaluate(input: unknown) {
    return TransformParser.isExpression(input) ? super.evaluate(input) : input;
  }

  public setColumnName(columnName: string | undefined) {
    this.lookups.columnName = columnName;
    this.set('@columnName', this.lookups.columnName);
  }

  public next() {
    this.removeRowFromScope(this.table.row(this.lookups.index).raw());
    this.lookups.index += 1;

    if (this.lookups.index > this.table.rowCount()) {
      return;
    }

    this.set('@index', this.lookups.index);
    this.addRowToScope(this.table.row(this.lookups.index).raw());
  }

  public addRowToScope = (row: RawRow) => {
    Object.entries(row).forEach(([field, value]) => {
      if (value !== undefined && value !== null && !field.includes(' ')) {
        this.set(`$${field}`, value);
      }
    });
  };

  public removeRowFromScope = (row: RawRow) => {
    Object.keys(row).forEach(field => {
      this.delete(`$${field}`);
    });
  };

  protected getCustomTypes() {
    return [...this.buildTypeCreators()];
  }

  protected getCustomFunctions() {
    const { functions: builtContextFunctions, dependencies } = this.buildContextFunctions();
    const getCurrentTable = () => this.table;

    return {
      ...super.getCustomFunctions(),
      ...customFunctions,
      ...builtContextFunctions,
      ...dependencies,
      getCurrentTable,
    };
  }

  protected getFunctionExtensions() {
    return { ...super.getFunctionExtensions(), ...functionExtensions };
  }

  protected getFunctionOverrides() {
    return {
      ...super.getFunctionOverrides(),
      ...functionOverrides,
      ...this.buildFactoryFunctions(),
    };
  }

  private buildContextFunctions() {
    const dependencies = {
      getContext: () => this.context,
    };

    const functions = Object.fromEntries(
      Object.entries(contextFunctions).map(([fnName, fn]) => [
        fnName,
        this.factory(fnName, ['getContext'], fn),
      ]),
    );

    return { functions, dependencies };
  }

  private buildFactoryFunctions() {
    return Object.fromEntries(
      Object.entries(factoryFunctions).map(([fnName, { func: fn, dependencies }]) => [
        fnName,
        this.factory(fnName, dependencies, fn),
      ]),
    );
  }

  private buildTypeCreators() {
    return Object.entries(typeCreators).map(([typeName, { creator, dependencies }]) =>
      this.factory(typeName, dependencies, creator),
    );
  }
}

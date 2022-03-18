/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { ExpressionParser } from '@tupaia/expression-parser';

import { Context } from '../../context';
import { Row } from '../../types';
import {
  customFunctions,
  contextFunctions,
  functionExtensions,
  functionOverrides,
  factoryFunctions,
} from './functions';
import { typeCreators, DataFrame, OrderedSet } from './customTypes';
import { TransformScope } from './TransformScope';

/**
 * Lookups object for rows within the transform data
 *
 * eg. if rows = [{BCD1: 5}, {BCD1: 8}, {BCD1: 4}], and currentRow = 1
 * '@current.BCD1' => 8
 * '@all.BCD1' => [5, 8, 4]
 * '@allPrevious.BCD1' => [5, 8]
 * 'where(f(@otherRow) = @otherRow.BCD1 < @current.BCD1).BCD1' => [5, 4]
 * '@current.BCD1 + sum(@allPrevious.BCD1)' => 21
 */
type Lookups = {
  index: number; // one-based index, this.currentRow + 1
  table: DataFrame;
  columnName: string | undefined;
  columnNames: OrderedSet<string>;
};

export class TransformParser extends ExpressionParser {
  private static readonly EXPRESSION_PREFIX = '=';

  private table: DataFrame;
  private lookups: Lookups;
  // eslint-disable-next-line react/static-property-placement
  private context?: Context;

  public constructor(table: DataFrame = new DataFrame(), context?: Context) {
    super(new TransformScope());

    this.table = table;
    this.lookups = {
      index: 1,
      table: this.table,
      columnName: undefined,
      columnNames: this.table.columnNames,
    };

    if (table.rowCount() > 0) {
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

  public addRowToScope = (row: Row) => {
    Object.entries(row).forEach(([field, value]) => {
      if (value !== undefined && value !== null && !field.includes(' ')) {
        this.set(`$${field}`, value);
      }
    });
  };

  public removeRowFromScope = (row: Row) => {
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

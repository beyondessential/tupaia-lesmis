/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { Context } from '../../../../context';
import { FetchReportQuery } from '../../../../../types';
import { buildPeriodParams } from './buildPeriodParams';
import { buildOrganisationUnitParams } from './buildOrganisationUnitParams';
import { FetchConfig, ParsedFetchConfig } from '../types';
import { TransformParser } from '../../../parser';
import { Row } from '../../../../types';

export class QueryBuilder {
  private readonly parser: TransformParser;
  private readonly ctx: Context;
  private readonly config: FetchConfig;
  private readonly query: FetchReportQuery;

  public constructor(rows: Row[], context: Context, config: FetchConfig, query: FetchReportQuery) {
    this.ctx = context;
    this.config = config;
    this.query = query;
    console.log(this.ctx);
    this.parser = new TransformParser(rows, this.ctx);
  }

  private parseConfig() {
    const parsedConfig = { ...this.config };
    Object.entries(parsedConfig).forEach(([field, value]) => {
      if (typeof value === 'string') {
        parsedConfig[field as keyof FetchConfig] = this.parser.evaluate(value);
      } else {
        parsedConfig[field as keyof FetchConfig] = value as any;
      }
    });
    return parsedConfig as ParsedFetchConfig;
  }

  public async build() {
    const parsedConfig = this.parseConfig();
    const { period, startDate, endDate } = buildPeriodParams(this.query, parsedConfig);
    const organisationUnitCodes = await buildOrganisationUnitParams(this.ctx.request, parsedConfig);
    return { ...this.query, organisationUnitCodes, period, startDate, endDate };
  }
}

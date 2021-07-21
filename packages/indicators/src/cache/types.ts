/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { Aggregation } from '../types';

export type AnalyticDimension = {
  readonly organisationUnit: string;
  readonly period: string;
  readonly inputOrganisationUnits: string[];
  readonly inputPeriods: string[];
};

export type IndicatorCacheEntry = {
  readonly organisationUnit: string;
  readonly period: string;
  readonly hierarchy?: string;
};

export type IndicatorAnalytic = {
  readonly organisationUnit: string;
  readonly period: string;
  readonly hierarchy?: string;
  readonly inputs: {
    periods: string[];
    organisationUnits: string[];
    dataElements: string[];
  }[];
};

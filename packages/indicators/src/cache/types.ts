/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

export type AnalyticDimension = {
  readonly organisationUnit: string;
  readonly period: string;
  readonly inputOrganisationUnits: string[];
  readonly inputPeriods: string[];
};

export type IndicatorCacheEntry = {
  readonly organisationUnit: string;
  readonly period: string;
  readonly inputHash?: string;
};

export type IndicatorAnalytic = {
  readonly indicatorCode: string;
  readonly organisationUnit: string;
  readonly period: string;
  readonly hierarchy?: string;
  readonly inputs: {
    periods: string[];
    organisationUnits: string[];
    dataElements: string[];
  }[];
  inputHash?: string;
};

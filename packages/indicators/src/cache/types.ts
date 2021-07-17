/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

export type FlatAnalyticDimension = {
  readonly organisationUnit: string;
  readonly period: string;
  readonly inputOrganisationUnits: string[];
  readonly inputPeriods: string[];
};

export type AnalyticDimension = {
  readonly organisationUnit: string;
  readonly period: string;
  readonly inputOrganisationUnits: Record<string, string[]>;
  readonly inputPeriods: Record<string, string[]>;
};

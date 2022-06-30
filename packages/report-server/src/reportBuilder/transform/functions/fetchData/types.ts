/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { Aggregation } from '../../../../types';
import { Row } from '../../../types';
import { DateSpecs } from './query';

export type FetchConfig = {
  dataElements?: string[];
  dataGroups?: string[];
  aggregations?: Aggregation[];
  startDate: string | DateSpecs;
  endDate: string | DateSpecs;
  organisationUnits: string | string[];
};

export type ParsedFetchConfig = {
  dataElements?: string[];
  dataGroups?: string[];
  aggregations?: Aggregation[];
  startDate: DateSpecs;
  endDate: DateSpecs;
  organisationUnits: string[];
};

export interface FetchResponse {
  results: Row[];
  metadata?: {
    dataElementCodeToName?: Record<string, string>;
  };
}

/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { RawRow } from '../types';

export interface FetchResponse {
  results: RawRow[];
  metadata?: {
    dataElementCodeToName?: Record<string, string>;
  };
}

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { createReducer } from '../utilities';
import { DATA_TABLE_PREVIEW_DISMISS, DATA_TABLE_PREVIEW_OPEN } from './constants';

const defaultState = {
  isOpen: false,
  dataTable: null,
};

const stateChanges = {
  [DATA_TABLE_PREVIEW_DISMISS]: () => ({
    ...defaultState,
  }),
  [DATA_TABLE_PREVIEW_OPEN]: ({ dataTable }) => ({
    dataTable,
    isOpen: true,
  }),
};

export const reducer = createReducer(defaultState, stateChanges);

/**
 * Tupaia MediTrak
 * Copyright (c) 2018 Beyond Essential Systems Pty Ltd
 */

import { DATA_TABLE_PREVIEW_DISMISS, DATA_TABLE_PREVIEW_OPEN } from './constants';

export const openDataTablePreviewModal = dataTable => async dispatch => {
  dispatch({
    type: DATA_TABLE_PREVIEW_OPEN,
    dataTable,
  });
};

export const closeDataTablePreviewModal = () => ({
  type: DATA_TABLE_PREVIEW_DISMISS,
});

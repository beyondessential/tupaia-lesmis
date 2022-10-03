/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import DescriptionIcon from '@material-ui/icons/Description';
import { IconButton } from '../widgets';

export const PreviewDataTableButton = ({ dataTable, previewDataTable }) => {
  return (
    <IconButton onClick={() => previewDataTable(dataTable)}>
      <DescriptionIcon />
    </IconButton>
  );
};

PreviewDataTableButton.propTypes = {
  dataTable: PropTypes.object.isRequired,
  previewDataTable: PropTypes.func.isRequired,
};

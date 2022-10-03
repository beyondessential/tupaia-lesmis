/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Edit';
import { IconButton } from '../widgets';

export const EditDataTableButton = ({ dataTable, editDataTable }) => {
  return (
    <IconButton onClick={() => editDataTable(dataTable)}>
      <EditIcon />
    </IconButton>
  );
};

EditDataTableButton.propTypes = {
  dataTable: PropTypes.object.isRequired,
  editDataTable: PropTypes.func.isRequired,
};

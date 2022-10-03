/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { LightOutlinedButton } from '@tupaia/ui-components';

export const NewDataTableButton = ({ onClick }) => {
  return (
    <LightOutlinedButton startIcon={<AddCircleIcon />} onClick={onClick}>
      New
    </LightOutlinedButton>
  );
};

NewDataTableButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

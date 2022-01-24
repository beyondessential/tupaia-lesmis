/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
// import styled from 'styled-components';
import PropTypes from 'prop-types';
import Snackbar from '@material-ui/core/Snackbar';

export const TupaiaSnackbar = ({ message, action, open, ...props }) => {
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      open={open}
      autoHideDuration={8000}
      message={message}
      action={action}
      {...props}
    />
  );
};

TupaiaSnackbar.propTypes = {
  message: PropTypes.string,
  timeout: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
  action: PropTypes.element,
  open: PropTypes.bool,
};

const action = <h1>View recent import</h1>;

TupaiaSnackbar.defaultProps = {
  timeout: false,
  message: 'This is just a test.',
  action,
  open: false,
};

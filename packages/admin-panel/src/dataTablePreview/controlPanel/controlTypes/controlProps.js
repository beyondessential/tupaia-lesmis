/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import PropTypes from 'prop-types';

export const controlPropTypes = {
  name: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  setValue: PropTypes.func.isRequired,
};

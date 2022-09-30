/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DescriptionIcon from '@material-ui/icons/Description';
import { IconButton } from '../widgets';
import { openDataTablePreviewModal } from './actions';

const DataTablePreviewButtonComponent = props => {
  const { openModal } = props;
  return (
    <IconButton onClick={openModal}>
      <DescriptionIcon />
    </IconButton>
  );
};

DataTablePreviewButtonComponent.propTypes = {
  openModal: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch, { row: dataTable }) => ({
  openModal: () => {
    dispatch(openDataTablePreviewModal(dataTable));
  },
});

const mergeProps = ({ ...stateProps }, { ...dispatchProps }, { ...ownProps }) => {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
  };
};

export const DataTablePreviewButton = connect(
  null,
  mapDispatchToProps,
  mergeProps,
)(DataTablePreviewButtonComponent);

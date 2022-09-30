/**
 * Tupaia MediTrak
 * Copyright (c) 2018 Beyond Essential Systems Pty Ltd
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { Dialog, DialogHeader } from '@tupaia/ui-components';
import { closeDataTablePreviewModal } from './actions';
import { ModalContentProvider } from '../widgets';
import { DataTablePreview } from './DataTablePreview';
import { useApi } from '../utilities/ApiProvider';
import { makeSubstitutionsInString } from '../utilities';
import { DataTablePreviewControlPanel } from './DataTablePreviewControlPanel';

const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    min-height: 90%;
    max-height: 90%;
    display: flex;
  }
`;

const titleTemplate = '{code} preview';
const dataTableParametersEndpointTemplate = 'dataTables/{code}/parameters';

export const DataTablePreviewModalComponent = ({ isOpen, dataTable, onDismiss }) => {
  if (!isOpen) {
    return null;
  }

  const title = makeSubstitutionsInString(titleTemplate, dataTable);
  const [dataTableParameters, setDataTableParameters] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [showData, setShowData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPreviewData, setIsLoadingPreviewData] = useState(false);
  const [isPreviewError, setIsPreviewError] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const api = useApi();

  const fetchDataTableParameters = async () => {
    try {
      setIsLoading(true);
      const parametersEndpoint = makeSubstitutionsInString(
        dataTableParametersEndpointTemplate,
        dataTable,
      );
      const parametersResponse = await api.get(parametersEndpoint);
      setDataTableParameters(parametersResponse.body.parameters);
    } catch (parametersError) {
      setErrorMessage(parametersError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataTableParameters();
  }, []);

  return (
    <StyledDialog onClose={onDismiss} open={isOpen} disableBackdropClick maxWidth="xl">
      <DialogHeader onClose={onDismiss} title={title} />
      <ModalContentProvider errorMessage={errorMessage} isLoading={isLoading}>
        <DataTablePreviewControlPanel
          dataTable={dataTable}
          dataTableParameters={dataTableParameters}
          setPreviewData={setPreviewData}
          setShowData={setShowData}
          setIsLoading={setIsLoadingPreviewData}
          setIsError={setIsPreviewError}
          setError={setPreviewError}
        />
        <DataTablePreview
          previewData={previewData}
          showData={showData}
          isLoading={isLoadingPreviewData}
          isError={isPreviewError}
          error={previewError}
        />
      </ModalContentProvider>
    </StyledDialog>
  );
};

DataTablePreviewModalComponent.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  dataTable: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

DataTablePreviewModalComponent.defaultProps = {};

const mapStateToProps = state => ({
  ...state.dataTablePreview,
});

const mapDispatchToProps = dispatch => ({
  onDismiss: () => dispatch(closeDataTablePreviewModal()),
  dispatch,
});

const mergeProps = ({ ...stateProps }, { dispatch, ...dispatchProps }, { ...ownProps }) => {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
  };
};

export const DataTablePreviewModal = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(DataTablePreviewModalComponent);

/**
 * Tupaia MediTrak
 * Copyright (c) 2018 Beyond Essential Systems Pty Ltd
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Dialog, DialogFooter, DialogHeader, Button } from '@tupaia/ui-components';
import { ModalContentProvider } from '../widgets';
import { DataTablePreview } from './DataTablePreview';
import { useApi } from '../utilities/ApiProvider';
import { makeSubstitutionsInString } from '../utilities';
import { DataTablePropertiesEditor } from './DataTablePropertiesEditor';
import { DataTablePreviewControlPanel } from './controlPanel';
import { DataTablePreviewEditPanel } from './editPanel';

const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    min-height: 90%;
    max-height: 90%;
    display: flex;
    overflow: hidden;
  }
`;

const MainContainer = styled.div`
  display: flex;
  overflow: auto;
`;

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const editTitleTemplate = 'Editing {code}';
const previewTitleTemplate = '{code} preview';
const dataTableParametersEndpointTemplate = 'dataTables/{code}/parameters';
const editDataTableEndpoint = 'dataTables/{id}';
const saveDataTableEndpoint = 'dataTables';

export const DataTablePreviewModal = ({
  isOpen,
  isEditing,
  isCreatingNew,
  dataTable,
  closeDataTablePreviewModal,
}) => {
  if (!isOpen) {
    return null;
  }

  let title;
  if (isCreatingNew) {
    title = 'New Data-Table';
  } else if (isEditing) {
    title = makeSubstitutionsInString(editTitleTemplate, dataTable);
  } else {
    title = makeSubstitutionsInString(previewTitleTemplate, dataTable);
  }

  const editMode = isEditing || isCreatingNew;

  const [dataTableInEdit, setDataTableInEdit] = useState({ ...dataTable });

  const [dataTableParameters, setDataTableParameters] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [showData, setShowData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreviewData, setIsLoadingPreviewData] = useState(false);
  const [isPreviewError, setIsPreviewError] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const setProperty = (name, value) => setDataTableInEdit({ ...dataTableInEdit, [name]: value });

  const api = useApi();

  const updateDataTableParameters = parameters => {
    setDataTableParameters(parameters);
    setDataTableInEdit({ ...dataTableInEdit, config: { ...dataTableInEdit.config, parameters } });
  };

  const fetchDataTableParameters = async () => {
    if (isCreatingNew) {
      // data-table doesn't exist yet, so don't bother fetching parameters
      return;
    }

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

  const saveDataTable = async () => {
    try {
      await api.post(saveDataTableEndpoint, null, dataTableInEdit);
      closeDataTablePreviewModal();
    } catch (parametersError) {
      setErrorMessage(parametersError.message);
    }
  };

  const editDataTable = async () => {
    try {
      const editEndpoint = makeSubstitutionsInString(editDataTableEndpoint, dataTable);
      await api.put(editEndpoint, null, dataTableInEdit);
      closeDataTablePreviewModal();
    } catch (parametersError) {
      setErrorMessage(parametersError.message);
    }
  };

  useEffect(() => {
    fetchDataTableParameters();
  }, []);

  return (
    <StyledDialog
      onClose={closeDataTablePreviewModal}
      open={isOpen}
      disableBackdropClick
      maxWidth="xl"
    >
      <DialogHeader onClose={closeDataTablePreviewModal} title={title} />
      <ModalContentProvider
        style={{ overflow: 'auto' }}
        errorMessage={errorMessage}
        isLoading={isLoading}
      >
        {editMode ? (
          <DataTablePropertiesEditor setProperty={setProperty} dataTable={dataTableInEdit} />
        ) : null}
        <MainContainer>
          {editMode ? (
            <DataTablePreviewEditPanel
              type={dataTableInEdit.type}
              config={dataTableInEdit.config}
              setConfig={value => setProperty('config', value)}
              dataTableParameters={dataTableParameters}
              setDataTableParameters={updateDataTableParameters}
            />
          ) : null}
          <PreviewContainer>
            <DataTablePreviewControlPanel
              dataTable={dataTableInEdit}
              dataTableParameters={dataTableParameters}
              isEditing={editMode}
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
          </PreviewContainer>
        </MainContainer>
      </ModalContentProvider>
      {editMode ? (
        <DialogFooter>
          <Button
            variant="outlined"
            onClick={() => (errorMessage ? setErrorMessage(null) : closeDataTablePreviewModal())}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => (isCreatingNew ? saveDataTable() : editDataTable())}
            disabled={!!errorMessage || isLoading}
          >
            Save
          </Button>
        </DialogFooter>
      ) : null}
    </StyledDialog>
  );
};

DataTablePreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isCreatingNew: PropTypes.bool,
  isEditing: PropTypes.bool,
  dataTable: PropTypes.object.isRequired,
  closeDataTablePreviewModal: PropTypes.func.isRequired,
};

DataTablePreviewModal.defaultProps = {
  isCreatingNew: false,
  isEditing: false,
};

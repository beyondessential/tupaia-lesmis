/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DeleteIcon from '@material-ui/icons/Delete';
import { ConfirmDeleteModal } from '@tupaia/ui-components';
import { IconButton } from '../widgets';
import { useApi } from '../utilities/ApiProvider';
import { makeSubstitutionsInString } from '../utilities';

const deleteDataTableEndpoint = 'dataTables/{id}';

export const DeleteDataTableButton = ({ dataTable, refreshDataTablePage }) => {
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const api = useApi();

  const openModal = () => setIsConfirmDeleteModalOpen(true);
  const closeModal = () => setIsConfirmDeleteModalOpen(false);

  const deleteDataTable = async () => {
    try {
      const deleteEndpoint = makeSubstitutionsInString(deleteDataTableEndpoint, dataTable);
      await api.delete(deleteEndpoint);
      closeModal();
      refreshDataTablePage();
    } catch (parametersError) {
      setErrorMessage(parametersError.message);
    }
  };

  return (
    <IconButton onClick={openModal}>
      <DeleteIcon />
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteModalOpen}
        message={errorMessage || 'Are you sure you wish to delete?'}
        onConfirm={() => deleteDataTable(dataTable)}
        onCancel={closeModal}
      />
    </IconButton>
  );
};

DeleteDataTableButton.propTypes = {
  dataTable: PropTypes.object.isRequired,
  refreshDataTablePage: PropTypes.func.isRequired,
};

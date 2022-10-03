/* eslint-disable react/prop-types */
/*
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ResourcePage } from './ResourcePage';
import { ArrayFilter } from '../../table/columnTypes/columnFilters';
import { prettyArray } from '../../utilities';
import {
  DataTablePreviewModal,
  NewDataTableButton,
  EditDataTableButton,
  PreviewDataTableButton,
  DeleteDataTableButton,
} from '../../dataTablePreview';

const DATA_TABLES_ENDPOINT = 'dataTables';

const FIELDS = [
  {
    Header: 'Code',
    source: 'code',
    type: 'tooltip',
  },
  {
    Header: 'Description',
    source: 'description',
  },
  {
    Header: 'Permission groups',
    source: 'permission_groups',
    Filter: ArrayFilter,
    Cell: ({ value }) => prettyArray(value),
    editConfig: {
      optionsEndpoint: 'permissionGroups',
      optionLabelKey: 'name',
      optionValueKey: 'name',
      sourceKey: 'permission_groups',
      allowMultipleValues: true,
    },
  },
  {
    Header: 'Type',
    source: 'type',
  },
  {
    Header: 'Config',
    source: 'config',
    show: false,
  },
];

export const DataTablesPage = ({ getHeaderEl }) => {
  const [isDataTableModelOpen, setIsDataTableModalOpen] = useState(false);
  const [isCreatingDataTable, setIsCreatingDataTable] = useState(false);
  const [isEditingDataTable, setIsEditingDataTable] = useState(false);
  const [dataTableModalDataTable, setDataTableModalDataTable] = useState({});
  const refreshDataTrigger = useRef(() => {});

  const createNewDataTable = () => {
    setIsCreatingDataTable(true);
    setDataTableModalDataTable({});
    setIsDataTableModalOpen(true);
  };

  const editDataTable = dataTable => {
    setIsEditingDataTable(true);
    setDataTableModalDataTable(dataTable);
    setIsDataTableModalOpen(true);
  };

  const previewDataTable = dataTable => {
    setDataTableModalDataTable(dataTable);
    setIsDataTableModalOpen(true);
  };

  const closeDataTableModal = () => {
    setIsCreatingDataTable(false);
    setIsEditingDataTable(false);
    setDataTableModalDataTable({});
    setIsDataTableModalOpen(false);
    refreshDataTrigger.current();
  };

  const refreshDataTablePage = () => {
    refreshDataTrigger.current();
  };

  const PreviewCell = ({ row }) => (
    <PreviewDataTableButton dataTable={{ ...row }} previewDataTable={previewDataTable} />
  );

  const EditCell = ({ row }) => {
    const { type } = row;
    if (type === 'internal') {
      return null;
    }

    return <EditDataTableButton dataTable={{ ...row }} editDataTable={editDataTable} />;
  };

  const DeleteCell = ({ row }) => {
    const { type } = row;
    if (type === 'internal') {
      return null;
    }

    return (
      <DeleteDataTableButton dataTable={{ ...row }} refreshDataTablePage={refreshDataTablePage} />
    );
  };

  const previewColumn = {
    Header: 'Preview',
    source: 'id',
    Cell: PreviewCell,
    width: 80,
    filterable: false,
    sortable: false,
  };

  const editColumn = {
    Header: 'Edit',
    source: 'id',
    Cell: EditCell,
    width: 60,
    filterable: false,
    sortable: false,
  };

  const deleteColumn = {
    Header: 'Delete',
    source: 'id',
    Cell: DeleteCell,
    width: 60,
    filterable: false,
    sortable: false,
  };

  const columns = [...FIELDS, previewColumn, editColumn, deleteColumn];

  return (
    <ResourcePage
      title="Data-Tables"
      endpoint={DATA_TABLES_ENDPOINT}
      columns={columns}
      LinksComponent={() => <NewDataTableButton onClick={createNewDataTable} />}
      getHeaderEl={getHeaderEl}
      refreshDataTrigger={refreshDataTrigger}
    >
      <DataTablePreviewModal
        isOpen={isDataTableModelOpen}
        isCreatingNew={isCreatingDataTable}
        isEditing={isEditingDataTable}
        dataTable={dataTableModalDataTable}
        closeDataTablePreviewModal={closeDataTableModal}
      />
    </ResourcePage>
  );
};

DataTablesPage.propTypes = {
  getHeaderEl: PropTypes.func.isRequired,
};

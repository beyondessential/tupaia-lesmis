/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Autocomplete, Select, TextField } from '@tupaia/ui-components';
import { Chip } from '@material-ui/core';
import { useApi } from '../utilities/ApiProvider';
import { convertSearchTermToFilter } from '../utilities';

const PropertiesEditorContainer = styled.div`
  display: flex;
  height: 100%;
`;

const PropertyInputContainer = styled.div`
  flex-grow: 1;
  padding-left: 2px;
  padding-right: 2px;
`;

const permissionGroupsEndpoint = 'permissionGroups';

const USER_DEFINABLE_DATA_TABLE_TYPES = [{ label: 'SQL', value: 'sql' }];

const PermissionGroupsInput = ({ permissionGroups = [], setPermissionGroups }) => {
  const selectedPermissionGroupOptions = permissionGroups.map(group => ({ name: group }));
  const [permissionGroupSearchTerm, setPermissionGroupSearchTerm] = useState('');
  const [permissionGroupOptions, setPermissionGroupOptions] = useState([]);
  const [isLoadingPermissionGroupOptions, setIsLoadingPermissionGroupOptions] = useState(false);

  const api = useApi();

  const fetchPermissionGroupOptions = async () => {
    try {
      setIsLoadingPermissionGroupOptions(true);
      const filter = convertSearchTermToFilter({ name: permissionGroupSearchTerm });
      const parametersResponse = await api.get(permissionGroupsEndpoint, {
        filter: JSON.stringify(filter),
        sort: JSON.stringify([`name ASC`]),
        columns: JSON.stringify(['name']),
        pageSize: 10,
        distinct: true,
      });

      setPermissionGroupOptions(parametersResponse.body);
    } catch (parametersError) {
      // Swallow error message
    } finally {
      setIsLoadingPermissionGroupOptions(false);
    }
  };

  useEffect(() => {
    fetchPermissionGroupOptions();
  }, []);

  return (
    <Autocomplete
      value={selectedPermissionGroupOptions}
      label="Permission Groups"
      options={permissionGroupOptions}
      getOptionSelected={(option, selected) => option.name === selected.name}
      getOptionLabel={option => option.name}
      loading={isLoadingPermissionGroupOptions}
      onChange={(e, newValue) => {
        setPermissionGroups(newValue.map(value => value.name));
        setPermissionGroupSearchTerm('');
        fetchPermissionGroupOptions();
      }}
      onInputChange={(event, newValue) => {
        if (event) {
          setPermissionGroupSearchTerm(newValue);
          fetchPermissionGroupOptions();
        }
      }}
      inputValue={permissionGroupSearchTerm}
      muiProps={{
        disableClearable: true,
        multiple: true,
        renderTags: values => values.map(option => <Chip color="primary" label={option.name} />),
      }}
    />
  );
};

PermissionGroupsInput.propTypes = {
  permissionGroups: PropTypes.array.isRequired,
  setPermissionGroups: PropTypes.func.isRequired,
};

export const DataTablePropertiesEditor = ({ dataTable, setProperty }) => {
  return (
    <PropertiesEditorContainer>
      <PropertyInputContainer>
        <TextField
          label="Code"
          value={dataTable.code}
          onChange={e => setProperty('code', e.target.value)}
        />
      </PropertyInputContainer>
      <PropertyInputContainer>
        <TextField
          label="Description"
          value={dataTable.description}
          onChange={e => setProperty('description', e.target.value)}
        />
      </PropertyInputContainer>
      <PropertyInputContainer>
        <Select
          value={dataTable.type}
          label="Type"
          options={USER_DEFINABLE_DATA_TABLE_TYPES}
          onChange={e => setProperty('type', e.target.value)}
        />
      </PropertyInputContainer>
      <PropertyInputContainer>
        <PermissionGroupsInput
          permissionGroups={dataTable.permission_groups}
          setPermissionGroups={value => setProperty('permission_groups', value)}
        />
      </PropertyInputContainer>
    </PropertiesEditorContainer>
  );
};

DataTablePropertiesEditor.propTypes = {
  dataTable: PropTypes.object.isRequired,
  setProperty: PropTypes.func.isRequired,
};

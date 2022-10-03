/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Select, TextField } from '@tupaia/ui-components';
import { useApi } from '../../utilities/ApiProvider';
import { ParametersEditor } from './ParametersEditor';

const EXTERNAL_DATABASE_CONNECTIONS_ENDPOINT = 'externalDatabaseConnections';

const SqlEditPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const SqlEditor = styled(TextField)`
  min-width: 400px;
`;

export const SqlEditPanel = ({
  config,
  setConfigField,
  dataTableParameters,
  setDataTableParameters,
}) => {
  const [databaseConnectionOptions, setDatabaseConnectionOptions] = useState([]);

  const api = useApi();

  const fetchDatabaseConnectionOptions = async () => {
    try {
      const databaseConnectionsResponse = await api.get(EXTERNAL_DATABASE_CONNECTIONS_ENDPOINT);
      const connections = databaseConnectionsResponse.body;
      setDatabaseConnectionOptions(connections.map(({ id, code }) => ({ value: id, label: code })));
    } catch (parametersError) {
      // Swallow errors
    }
  };

  useEffect(() => {
    fetchDatabaseConnectionOptions();
  }, []);

  return (
    <SqlEditPanelContainer>
      <Select
        label="Database connection"
        value={config.externalDatabaseConnectionId}
        options={databaseConnectionOptions}
        onChange={e => setConfigField('externalDatabaseConnectionId', e.target.value)}
      />
      <SqlEditor
        label="SQL"
        value={config.sql || ''}
        onChange={e => setConfigField('sql', e.target.value)}
        multiline
        type="textarea"
        rows="4"
      />
      <ParametersEditor
        dataTableParameters={dataTableParameters}
        setDataTableParameters={setDataTableParameters}
      />
    </SqlEditPanelContainer>
  );
};

SqlEditPanel.propTypes = {
  config: PropTypes.shape({ sql: PropTypes.string, externalDatabaseConnectionId: PropTypes.string })
    .isRequired,
  setConfigField: PropTypes.func.isRequired,
  dataTableParameters: PropTypes.array.isRequired,
  setDataTableParameters: PropTypes.func.isRequired,
};

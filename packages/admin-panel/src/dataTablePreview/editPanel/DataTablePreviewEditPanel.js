/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { SqlEditPanel } from './SqlEditPanel';

const EditPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const EDIT_PANEL_COMPONENTS = {
  sql: SqlEditPanel,
};

export const DataTablePreviewEditPanel = ({
  type,
  config,
  setConfig,
  dataTableParameters,
  setDataTableParameters,
}) => {
  if (!config) {
    setConfig({});
  }

  const EditPanelComponent = EDIT_PANEL_COMPONENTS[type];

  if (!EditPanelComponent) {
    return null;
  }

  const setConfigField = (name, value) => setConfig({ ...config, [name]: value });

  return (
    <EditPanelContainer>
      <EditPanelComponent
        config={config}
        setConfigField={setConfigField}
        dataTableParameters={dataTableParameters}
        setDataTableParameters={setDataTableParameters}
      />
    </EditPanelContainer>
  );
};

DataTablePreviewEditPanel.propTypes = {
  type: PropTypes.string,
  config: PropTypes.shape({ type: PropTypes.string }).isRequired,
  setConfig: PropTypes.func.isRequired,
  dataTableParameters: PropTypes.array.isRequired,
  setDataTableParameters: PropTypes.func.isRequired,
};

DataTablePreviewEditPanel.defaultProps = {
  type: undefined,
};

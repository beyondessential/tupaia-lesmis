/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { CONTROL_COMPONENTS } from './controlTypes';

const ControlContainer = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  padding-left: 2px;
  padding-right: 2px;
  justify-content: center;
`;

const ControlsContainer = styled.div`
  display: flex;
  height: 100%;
`;

const Control = ({ name, config, value, setValue }) => {
  const { type } = config;

  const ControlComponent = CONTROL_COMPONENTS[type];
  if (!ControlComponent) {
    return null;
  }

  return (
    <ControlContainer>
      <ControlComponent name={name} config={config} value={value} setValue={setValue} />
    </ControlContainer>
  );
};

Control.propTypes = {
  name: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string]).isRequired,
  setValue: PropTypes.func.isRequired,
};

export const DataTablePreviewControls = ({
  dataTableParameters,
  controlValues,
  setControlValues,
}) => {
  const setControlValue = controlName => value => {
    setControlValues({ ...controlValues, [controlName]: value });
  };

  return (
    <ControlsContainer>
      {dataTableParameters.map(({ name, config }) => (
        <Control
          name={name}
          config={config}
          value={controlValues[name]}
          setValue={setControlValue(name)}
        />
      ))}
    </ControlsContainer>
  );
};

DataTablePreviewControls.propTypes = {
  dataTableParameters: PropTypes.arrayOf(
    PropTypes.objectOf({ name: PropTypes.string, config: PropTypes.object }),
  ).isRequired,
  controlValues: PropTypes.object.isRequired,
  setControlValues: PropTypes.func.isRequired,
};

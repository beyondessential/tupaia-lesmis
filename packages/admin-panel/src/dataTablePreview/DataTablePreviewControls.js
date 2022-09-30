/* eslint-disable react/prop-types */
/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { TextField, DatePicker } from '@tupaia/ui-components';

const ControlContainer = styled.div`
  display: flex;
  height: 100%;
  flex-direction: column;
  padding-right: 5px;
`;

const ControlsContainer = styled.div`
  display: flex;
  height: 100%;
  flex-grow: 1;
`;

const TextControl = ({ config, value, setValue }) => {
  const { defaultValue } = config;
  const onTextChange = e => {
    const newValue = e.target.value;
    setValue(newValue);
  };
  return <TextField value={value || defaultValue} onChange={onTextChange} />;
};

const DateControl = ({ config, value, setValue }) => {
  const { defaultValue } = config;
  const dateValue = value || defaultValue || new Date();
  const onDateChange = newValue => {
    setValue(newValue.toISOString());
  };
  return <DatePicker value={dateValue} onChange={onDateChange} />;
};

const TextArrayControl = ({ config, value, setValue }) => {
  const { defaultValue } = config;
  const textValue = value || defaultValue;
  const onTextArrayChange = e => {
    const newValue = e.target.value.split(',').map(item => item.trim());
    setValue(newValue);
  };
  return <TextField value={textValue} onChange={onTextArrayChange} />;
};

const ArrayControl = ({ config, value, setValue }) => {
  const { type: arrayType } = config.innerType;

  if (arrayType === 'string') {
    return <TextArrayControl config={config} value={value} setValue={setValue} />;
  }

  return null;
};

const CONTROL_COMPONENTS = {
  string: TextControl,
  date: DateControl,
  array: ArrayControl,
};

const Control = ({ name, config, value, setValue }) => {
  const { type } = config;
  if (!CONTROL_COMPONENTS[type]) {
    return null;
  }

  const Component = CONTROL_COMPONENTS[type];
  return (
    <ControlContainer>
      <>{name}</>
      <Component config={config} value={value} setValue={setValue} />
    </ControlContainer>
  );
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

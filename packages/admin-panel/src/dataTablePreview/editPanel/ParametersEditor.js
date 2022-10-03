/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { List, ListItem, ListItemSecondaryAction } from '@material-ui/core';
import { TextField, Select, Checkbox, IconButton } from '@tupaia/ui-components';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import { CONTROL_COMPONENTS, ARRAY_CONTROL_COMPONENTS } from '../controlPanel/controlTypes';

const ParametersEditorContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ParameterEditorContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ParameterEditorRow = styled.div`
  display: flex;
`;

const PARAMETER_TYPES = [
  { label: 'Text', value: 'string' },
  { label: 'Date', value: 'date' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Object', value: 'object' },
];

const isMultiValue = parameterConfig => parameterConfig.type === 'array';

// Convert 'array' type parameters into flat inner type, with multiValue checked
const unArrayParameter = parameterConfig => {
  if (!isMultiValue(parameterConfig)) {
    return parameterConfig;
  }

  const { innerType, ...restOfParameterConfig } = parameterConfig;
  return { ...restOfParameterConfig, type: innerType.type };
};

const arrayParameter = parameterConfig => {
  const { type } = parameterConfig;
  return { ...parameterConfig, type: 'array', innerType: { type } };
};

const ParameterEditor = ({ parameter, setParameter }) => {
  const setProperty = (propertyName, value) =>
    setParameter({ ...parameter, [propertyName]: value });

  const setConfigProperty = (propertyName, value) =>
    setParameter({ ...parameter, config: { ...parameter.config, [propertyName]: value } });

  const changeType = newType => {
    // Remove all other fields, as they may not be supported with the new type
    setProperty('config', { type: newType });
  };

  const DefaultValueComponent = CONTROL_COMPONENTS[parameter.config.type];
  const multiValueCheckboxState = isMultiValue(parameter.config);
  const parsedConfig = unArrayParameter(parameter.config);
  const supportsMultiValue = Object.keys(ARRAY_CONTROL_COMPONENTS).includes(parsedConfig.type);

  return (
    <ParameterEditorContainer>
      <ParameterEditorRow>
        <TextField
          label="Name"
          value={parameter.name}
          onChange={e => setProperty('name', e.target.value)}
        />
        <Select
          value={parsedConfig.type}
          label="Type"
          options={PARAMETER_TYPES}
          onChange={e => changeType(e.target.value)}
        />
      </ParameterEditorRow>
      <ParameterEditorRow>
        <Checkbox
          checked={parsedConfig.required}
          value={parsedConfig.required}
          label="Required"
          onChange={e => {
            setConfigProperty('required', e.target.checked);
          }}
        />
        <Checkbox
          checked={multiValueCheckboxState}
          value={multiValueCheckboxState}
          label="Multi value"
          disabled={!supportsMultiValue}
          onChange={e => {
            if (e.target.checked) {
              setProperty('config', arrayParameter(parameter.config));
            } else {
              setProperty('config', unArrayParameter(parameter.config));
            }
          }}
        />
      </ParameterEditorRow>

      {DefaultValueComponent ? (
        <DefaultValueComponent
          name="Default value"
          value={parsedConfig.defaultValue}
          setValue={value => setConfigProperty('defaultValue', value)}
          config={parameter.config}
        />
      ) : null}
    </ParameterEditorContainer>
  );
};

ParameterEditor.propTypes = {
  parameter: PropTypes.shape({
    name: PropTypes.string,
    config: PropTypes.shape({
      type: PropTypes.string,
      innerType: PropTypes.object,
      required: PropTypes.bool,
      defaultValue: PropTypes.oneOfType([PropTypes.string]),
    }),
  }).isRequired,
  setParameter: PropTypes.func.isRequired,
};

const AddParameterButton = ({ addParameter }) => {
  return (
    <IconButton onClick={addParameter}>
      <AddIcon />
    </IconButton>
  );
};

AddParameterButton.propTypes = {
  addParameter: PropTypes.func.isRequired,
};

export const ParametersEditor = ({ dataTableParameters, setDataTableParameters }) => {
  const addParameter = () =>
    setDataTableParameters([...dataTableParameters, { name: '', config: {} }]);

  const removeParameter = index => () =>
    setDataTableParameters(
      dataTableParameters.filter((_, parameterIndex) => parameterIndex !== index),
    );

  const setParameter = index => value => {
    const newParameters = [
      ...dataTableParameters.slice(0, index),
      value,
      ...dataTableParameters.slice(index + 1),
    ];
    setDataTableParameters(newParameters);
  };

  return (
    <ParametersEditorContainer>
      <>Parameters:</>
      <List>
        {dataTableParameters.map((parameter, index) => (
          <ListItem divider>
            <ParameterEditor parameter={parameter} setParameter={setParameter(index)} />
            <ListItemSecondaryAction>
              <IconButton onClick={removeParameter(index)}>
                <ClearIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <AddParameterButton addParameter={addParameter} />
    </ParametersEditorContainer>
  );
};

ParametersEditor.propTypes = {
  dataTableParameters: PropTypes.array.isRequired,
  setDataTableParameters: PropTypes.func.isRequired,
};

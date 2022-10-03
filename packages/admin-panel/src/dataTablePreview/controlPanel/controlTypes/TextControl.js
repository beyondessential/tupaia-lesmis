/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */
import React from 'react';
import { TextField } from '@tupaia/ui-components';
import { controlPropTypes } from './controlProps';

export const TextControl = ({ name, config, value, setValue }) => {
  const { defaultValue } = config;
  const initialValue = value || defaultValue || '';
  const onChange = e => {
    const newValue = e.target.value;
    setValue(newValue);
  };
  return <TextField label={name} value={initialValue} onChange={onChange} />;
};

TextControl.propTypes = controlPropTypes;

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */
import React from 'react';
import { JsonEditor } from '@tupaia/ui-components';
import { controlPropTypes } from './controlProps';

export const ObjectControl = ({ name, config, value, setValue }) => {
  const { defaultValue } = config;
  const initialValue = value || defaultValue || {};
  const onChange = newValue => {
    setValue(newValue);
  };
  return <JsonEditor label={name} value={initialValue} onChange={onChange} />;
};

ObjectControl.propTypes = controlPropTypes;

/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */
import React from 'react';
import { Checkbox } from '@tupaia/ui-components';
import { controlPropTypes } from './controlProps';

export const BooleanControl = ({ name, config, value, setValue }) => {
  const { defaultValue } = config;
  let initialValue = false;
  if (defaultValue !== undefined) initialValue = defaultValue;
  if (value !== undefined) initialValue = value;

  const onChange = e => {
    setValue(e.target.checked);
  };
  return <Checkbox label={name} value={initialValue} checked={initialValue} onChange={onChange} />;
};

BooleanControl.propTypes = controlPropTypes;

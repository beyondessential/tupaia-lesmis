/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */
import React from 'react';
import { controlPropTypes } from './controlProps';
import { TextArrayControl } from './TextArrayControl';

export const ARRAY_CONTROL_COMPONENTS = {
  string: TextArrayControl,
};

export const ArrayControl = ({ name, config, value, setValue }) => {
  const { type: arrayType } = config.innerType;

  const ComponentForInnerType = ARRAY_CONTROL_COMPONENTS[arrayType];

  if (!ComponentForInnerType) {
    return null;
  }

  return <ComponentForInnerType name={name} config={config} value={value} setValue={setValue} />;
};

ArrayControl.propTypes = controlPropTypes;

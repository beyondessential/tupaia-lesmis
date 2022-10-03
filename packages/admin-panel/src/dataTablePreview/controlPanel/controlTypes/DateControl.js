/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */
import React from 'react';
import { DatePicker } from '@tupaia/ui-components';
import { controlPropTypes } from './controlProps';

export const DateControl = ({ name, config, value, setValue }) => {
  const { defaultValue } = config;
  const initialValue = value || defaultValue;
  const onChange = newValue => {
    setValue(newValue.toISOString());
  };
  return (
    <DatePicker
      label={name}
      value={initialValue ? new Date(initialValue) : null}
      emptyLabel="No date"
      onChange={onChange}
    />
  );
};

DateControl.propTypes = controlPropTypes;

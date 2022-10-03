/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */
import React, { useState } from 'react';
import { Chip } from '@material-ui/core';
import { Autocomplete } from '@tupaia/ui-components';
import { controlPropTypes } from './controlProps';

export const TextArrayControl = ({ name, config, value, setValue }) => {
  const [inputValue, setInputValue] = useState('');
  const { defaultValue } = config;
  const initialValue = value || defaultValue || [];

  return (
    <Autocomplete
      value={initialValue}
      label={name}
      options={[inputValue]}
      getOptionSelected={(option, selected) => option === selected}
      getOptionLabel={option => option}
      onChange={(e, newValue) => {
        setValue(newValue);
        setInputValue('');
      }}
      onInputChange={(event, newValue) => {
        if (event) {
          setInputValue(newValue);
        }
      }}
      inputValue={inputValue}
      muiProps={{
        disableClearable: true,
        multiple: true,
        freeSolo: true,
        selectOnFocus: true,
        clearOnBlur: true,
        handleHomeEndKeys: true,
        renderTags: values => values.map(option => <Chip color="primary" label={option} />),
      }}
    />
  );
};

TextArrayControl.propTypes = controlPropTypes;

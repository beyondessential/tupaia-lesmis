/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';
import { DataTableParameter, DataTableParameterConfig } from '../types';

const castDefaultValueToType = (defaultValue: unknown, type: string) => {
  switch (type) {
    case 'date': {
      return new Date(defaultValue as string);
    }
    default: {
      return defaultValue;
    }
  }
};

const attachQualifiersToSchema = (
  schema: yup.AnySchema,
  { type, defaultValue, oneOf, required }: DataTableParameterConfig,
) => {
  let qualifiedSchema = schema;
  if (oneOf) {
    qualifiedSchema = qualifiedSchema.oneOf(oneOf);
  }
  if (defaultValue) {
    qualifiedSchema = qualifiedSchema.default(castDefaultValueToType(defaultValue, type));
  } else if (required) {
    qualifiedSchema = qualifiedSchema.required();
  }

  return qualifiedSchema;
};

const dataTableParamConfigConfigToYupSchema = (paramConfig: DataTableParameterConfig) => {
  const { type, innerType } = paramConfig;
  let schema: yup.AnySchema;
  switch (type) {
    case 'string':
      schema = yup.string();
      return attachQualifiersToSchema(schema, paramConfig);
    case 'date':
      schema = yup.date();
      return attachQualifiersToSchema(schema, paramConfig);
    case 'array':
      schema = yup.array();
      if (innerType) {
        const innerValidator = dataTableParamConfigConfigToYupSchema(innerType);
        schema = (schema as yup.ArraySchema<yup.AnySchema>).of(innerValidator);
      }
      return attachQualifiersToSchema(schema, paramConfig);
    default:
      throw new Error(`Missing logic to serialize to yup validator for parameter of type: ${type}`);
  }
};

export const dataTableParamsToYupSchema = (params: DataTableParameter[]): yup.AnyObjectSchema => {
  const schemaShape = Object.fromEntries(
    params.map(({ name, config }) => [name, dataTableParamConfigConfigToYupSchema(config)]),
  );
  return yup.object().shape(schemaShape);
};

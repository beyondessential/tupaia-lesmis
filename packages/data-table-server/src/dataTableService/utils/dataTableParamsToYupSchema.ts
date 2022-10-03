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
    case 'string': {
      schema = yup.string();
      break;
    }
    case 'date': {
      schema = yup.date();
      break;
    }
    case 'boolean': {
      schema = yup.boolean();
      break;
    }
    case 'object': {
      schema = yup.object();
      break;
    }
    case 'array': {
      if (!innerType) {
        throw new Error('Array parameters require an innerType');
      }
      schema = yup.array().of(dataTableParamConfigConfigToYupSchema(innerType));
      break;
    }
    default:
      throw new Error(`Missing logic to serialize to yup validator for parameter of type: ${type}`);
  }

  return attachQualifiersToSchema(schema, paramConfig);
};

export const dataTableParamsToYupSchema = (params: DataTableParameter[]): yup.AnyObjectSchema => {
  const schemaShape = Object.fromEntries(
    params.map(({ name, config }) => [name, dataTableParamConfigConfigToYupSchema(config)]),
  );
  return yup.object().shape(schemaShape);
};

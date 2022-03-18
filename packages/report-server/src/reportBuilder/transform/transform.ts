/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { yup } from '@tupaia/utils';

import { Context } from '../context';
import { transformBuilders } from './functions';
import { aliases } from './aliases';
import { DataFrame } from './parser/customTypes';
import { Row } from '../types';

type BuiltTransformParams = {
  title?: string;
  name: string;
  apply: (df: DataFrame) => DataFrame;
};

const transformParamsValidator = yup.lazy((value: unknown) => {
  if (typeof value === 'string') {
    return yup
      .mixed<keyof typeof aliases>()
      .oneOf(Object.keys(aliases) as (keyof typeof aliases)[])
      .required();
  }

  return yup.object().shape({
    transform: yup
      .mixed<keyof typeof transformBuilders>()
      .oneOf(Object.keys(transformBuilders) as (keyof typeof transformBuilders)[])
      .required(),
    title: yup.string(),
    description: yup.string(),
  });
});

const paramsValidator = yup.array().required();

const transform = (rowsOrDf: Row[] | DataFrame, transformSteps: BuiltTransformParams[]) => {
  let df = DataFrame.checkIsDataFrame(rowsOrDf) ? rowsOrDf : new DataFrame(rowsOrDf);
  transformSteps.forEach((transformStep: BuiltTransformParams, index: number) => {
    try {
      df = transformStep.apply(df);
    } catch (e) {
      const titlePart = transformStep.title ? ` (${transformStep.title})` : '';
      const errorMessagePrefix = `Error in transform[${index + 1}]${titlePart}: `;
      throw new Error(`${errorMessagePrefix}${(e as Error).message}`);
    }
  });
  return df;
};

const buildParams = (params: unknown, context: Context): BuiltTransformParams => {
  const validatedParams = transformParamsValidator.validateSync(params);
  if (typeof validatedParams === 'string') {
    return {
      name: validatedParams,
      apply: aliases[validatedParams](context),
    };
  }

  const {
    transform: transformStep,
    title,
    description, // This is purely a cosmetic part of the config, ignore it
    ...restOfTransformParams
  } = validatedParams;

  return {
    title,
    name: transformStep,
    apply: transformBuilders[transformStep](restOfTransformParams, context),
  };
};

export const buildTransform = (params: unknown, context: Context = {}) => {
  const validatedParams = paramsValidator.validateSync(params);

  const builtParams = validatedParams.map(param => buildParams(param, context));
  return (rowsOrDf: Row[] | DataFrame) => transform(rowsOrDf, builtParams);
};

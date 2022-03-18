/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { DataFrame } from '../../transform/parser/customTypes';

export const buildDefault = () => {
  return (df: DataFrame) => df.rawRows();
};

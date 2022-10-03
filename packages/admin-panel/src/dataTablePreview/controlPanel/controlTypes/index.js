/**
 * Tupaia
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { ArrayControl } from './ArrayControl';
import { BooleanControl } from './BooleanControl';
import { DateControl } from './DateControl';
import { ObjectControl } from './ObjectControl';
import { TextControl } from './TextControl';

export const CONTROL_COMPONENTS = {
  string: TextControl,
  date: DateControl,
  boolean: BooleanControl,
  object: ObjectControl,
  array: ArrayControl,
};

export { ARRAY_CONTROL_COMPONENTS } from './ArrayControl';

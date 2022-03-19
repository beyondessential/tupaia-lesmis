/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 */

import { typed } from 'mathjs';

export const divide = typed('divide', {
  'number, undefined': (num: number, undef: undefined) => undefined,
  'undefined, number': (undef: undefined, num: number) => undefined,
  'undefined, undefined': (undef: undefined, undef2: undefined) => undefined,
});

export const add = typed('add', {
  'number, undefined': (num: number, undef: undefined) => num,
  'undefined, number': (undef: undefined, num: number) => num,
  'undefined, undefined': (undef: undefined, undef2: undefined) => undefined,
  'string, string': (string1: string, string2: string) => string1 + string2,
  'string, number': (string: string, num: number) => string + num,
  'number, string': (num: number, string: string) => num.toString() + string,
});

export const equal = typed('equal', {
  'any, any': (val1: unknown, val2: unknown) => val1 === val2,
});

export const unequal = typed('unequal', {
  'any, any': (val1: unknown, val2: unknown) => val1 !== val2,
});

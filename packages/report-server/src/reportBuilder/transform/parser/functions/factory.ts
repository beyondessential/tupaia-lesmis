import { DataFrame, OrderedSet } from '../customTypes';

const enforceIsNumber = (value: unknown) => {
  if (typeof value !== 'number') {
    throw new Error(`Expected number, got: ${value}`);
  }
  return value;
};

const sumArray = (arr: unknown[]) =>
  arr.every(item => item === undefined)
    ? undefined
    : arr
        .filter(item => item !== undefined)
        .map(enforceIsNumber)
        .reduce((total, item) => total + item, 0);

export const sum = {
  dependencies: ['typed', 'DataFrame'],
  func: ({ typed }: { typed: any }) =>
    typed('sum', {
      '...': function (args: unknown[]) {
        return this(args); // 'this' is bound by mathjs to allow recursive function calls to other typed function implementations
      },
      number: (num: number) => num,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      undefined: (undef: undefined) => undefined,
      Array: sumArray,
      DataFrame: (df: DataFrame) => {
        console.log('summing dataframe');
        sumArray(df.cells());
      },
    }),
};

export const subtract = {
  dependencies: ['typed', 'OrderedSet'],
  func: ({ typed }: { typed: any }) =>
    typed('subtract', {
      'number,number': (num1: number, num2: number) => num1 - num2,
      'OrderedSet,OrderedSet': (set1: OrderedSet<any>, set2: OrderedSet<any>) =>
        set1.difference(set2),
      'OrderedSet,any': (set: OrderedSet<any>, val: any) => set.delete(val),
    }),
};

/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

export class OrderedSet<T> extends Set<T> {
  public isOrderedSet = true;

  // private readonly values: Set<T>;

  constructor(values: T[] | OrderedSet<T>) {
    super(Array.isArray(values) ? values : Array.from(values));
  }

  public union(newSet: OrderedSet<T>) {
    const clone = new Set(this);
    newSet.forEach(item => {
      clone.add(item);
    });
    return new OrderedSet(Array.of(...clone));
  }

  public difference(newSet: OrderedSet<T>) {
    const clone = new Set(this);
    newSet.forEach(item => {
      clone.delete(item);
    });
    return new OrderedSet(Array.of(...clone));
  }
}

// factory function which defines a new data type CustomValue
export const createOrderedSetType = {
  name: 'OrderedSet',
  dependencies: ['typed'],
  creator: ({ typed }: { typed: any }) => {
    // create a new data type

    // define a new data type with typed-function
    typed.addType({
      name: 'OrderedSet',
      test: (x: unknown) => {
        // test whether x is of type DataFrame
        return x && typeof x === 'object' && 'isOrderedSet' in x;
      },
    });

    return OrderedSet;
  },
};

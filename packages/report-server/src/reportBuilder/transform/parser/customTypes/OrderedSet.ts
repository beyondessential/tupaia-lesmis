/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

export class OrderedSet<T> {
  public isOrderedSet = true;

  private readonly values: Set<T>;

  constructor(values: T[] | OrderedSet<T>) {
    this.values = Array.isArray(values) ? new Set(values) : new Set(values.arrayValues());
  }

  public union(newSet: OrderedSet<T>) {
    const clone = new Set(this.values);
    newSet.forEach(item => {
      clone.add(item);
    });
    return new OrderedSet(Array.of(...clone));
  }

  public difference(newSet: OrderedSet<T>) {
    const clone = new Set(this.values);
    newSet.forEach(item => {
      clone.delete(item);
    });
    return new OrderedSet(Array.of(...clone));
  }

  public delete(value: T) {
    const clone = new Set(this.values);
    clone.delete(value);
    return new OrderedSet(Array.of(...clone));
  }

  public arrayValues() {
    return Array.of(...this.values);
  }

  public [Symbol.iterator]() {
    return this.values.values();
  }
}

// factory function which defines a new data type CustomValue
export const createOrderedSetType = {
  name: 'OrderedSet',
  dependencies: ['typed'],
  creator: ({ typed }) => {
    // create a new data type

    // define a new data type with typed-function
    typed.addType({
      name: 'OrderedSet',
      test: (x: unknown) => {
        // test whether x is of type DataFrame
        return x && x.isOrderedSet === true;
      },
    });

    return OrderedSet;
  },
};

// import the new data type and function

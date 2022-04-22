/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

export class OrderedSet<T> {
  public isOrderedSet = true;

  private readonly set: Set<T>;

  public static checkIsOrderedSet(input: unknown) {
    return input && typeof input === 'object' && 'isOrderedSet' in input;
  }

  public constructor(values: T[] | OrderedSet<T>) {
    this.set = new Set(Array.isArray(values) ? values : Array.from(values.set));
  }

  public add(item: T) {
    return this.set.add(item);
  }

  public has(item: T) {
    return this.set.has(item);
  }

  public delete(item: T) {
    return this.set.delete(item);
  }

  public union(newSet: OrderedSet<T>) {
    const clone = new OrderedSet<T>([]);
    this.set.forEach(item => clone.add(item));
    newSet.set.forEach(item => clone.add(item));
    return clone;
  }

  public difference(newSet: OrderedSet<T>) {
    const clone = new OrderedSet<T>([]);
    this.set.forEach(value => {
      if (!newSet.has(value)) clone.add(value);
    });
    return clone;
  }

  public asArray() {
    return Array.from(this.set);
  }

  public [Symbol.iterator]() {
    return this.set.values();
  }
}

export const createOrderedSetType = {
  name: 'OrderedSet',
  dependencies: ['typed'],
  creator: ({ typed }: { typed: any }) => {
    typed.addType({
      name: 'OrderedSet',
      test: OrderedSet.checkIsOrderedSet,
    });

    return OrderedSet;
  },
};

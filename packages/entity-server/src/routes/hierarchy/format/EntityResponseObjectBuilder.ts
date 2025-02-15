/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { Writable } from '../../../types';
import { EntityResponseObject, ExtendedEntityFieldName } from '../types';

export class EntityResponseObjectBuilder {
  private readonly responseObject: Writable<EntityResponseObject> = {};

  public set<T extends ExtendedEntityFieldName>(field: T, value: EntityResponseObject[T]) {
    this.responseObject[field] = value;
  }

  public build() {
    return this.responseObject as EntityResponseObject;
  }
}

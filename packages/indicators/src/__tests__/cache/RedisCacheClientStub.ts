/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import { RedisCacheClient } from '../../cache/RedisCacheClient';

export class RedisCacheClientStub implements RedisCacheClient {
  private readonly cache: Record<string, string | null>;

  constructor() {
    this.cache = {};
  }

  public async get(key: string) {
    return this.cache[key];
  }

  public async set(key: string, value: string) {
    this.cache[key] = value;
    return true;
  }
}

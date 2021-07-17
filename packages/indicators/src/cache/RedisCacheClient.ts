/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import redis, { RedisClient } from 'redis';
import { promisify } from 'util';

export interface RedisCacheClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<boolean>;
}

export class RealRedisCacheClient implements RedisCacheClient {
  private readonly client: RedisClient;

  private readonly fetchFromCache: (key: string) => Promise<string | null>;

  constructor() {
    this.client = redis.createClient();
    this.fetchFromCache = promisify(this.client.get).bind(this.client);
  }

  public async get(key: string) {
    return this.fetchFromCache(key);
  }

  public async set(key: string, value: string) {
    return this.client.set(key, value);
  }
}

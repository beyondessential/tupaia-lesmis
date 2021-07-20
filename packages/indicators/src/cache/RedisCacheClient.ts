/**
 * Tupaia
 * Copyright (c) 2017 - 2021 Beyond Essential Systems Pty Ltd
 */

import redis, { RedisClient } from 'redis';
import { promisify } from 'util';

export interface RedisCacheClient {
  get: (key: string) => Promise<string | null>;
  hmGet: (key: string, fields: string[]) => Promise<(string | null)[]>;
  set: (key: string, value: string) => Promise<boolean>;
  hmSet: (key: string, fieldValues: Record<string, string>) => Promise<boolean>;
}

export class RealRedisCacheClient implements RedisCacheClient {
  static readonly realInstance = new RealRedisCacheClient();

  private readonly client: RedisClient;

  private readonly fetchFromCache: (key: string) => Promise<string | null>;

  private readonly fetchFromCacheMap: (key: string, fields: string[]) => Promise<(string | null)[]>;

  private readonly fetchFromCacheSet: (key: string) => Promise<string[]>;

  private constructor() {
    this.client = redis.createClient();
    this.fetchFromCache = promisify(this.client.get).bind(this.client);
    this.fetchFromCacheMap = promisify(this.client.hmget).bind(this.client);
    this.fetchFromCacheSet = promisify(this.client.smembers).bind(this.client);
  }

  public static getInstance() {
    return RealRedisCacheClient.realInstance;
  }

  public async get(key: string) {
    return this.fetchFromCache(key);
  }

  public async hmGet(key: string, fields: string[]) {
    return this.fetchFromCacheMap(key, fields);
  }

  public async set(key: string, value: string) {
    return this.client.set(key, value);
  }

  public async hmSet(key: string, fieldValues: Record<string, string>) {
    return this.client.hmset(key, fieldValues);
  }

  public async sAdd(key: string, values: string[]) {
    return this.client.sadd(key, values);
  }

  public async sMembers(key: string) {
    return this.fetchFromCacheSet(key);
  }
}

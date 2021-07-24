/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 *
 */

import createHasher, { Hasher } from 'node-object-hash';

import { QueryParameters } from '../types';
import { OutboundConnection } from './OutboundConnection';

type RequestBody = Record<string, unknown> | Record<string, unknown>[];

export class CachedOutboundConnection extends OutboundConnection {
  private readonly cache: Record<string, Promise<unknown>>;

  private readonly hasher: Hasher;

  public constructor() {
    super();
    this.cache = {};
    this.hasher = createHasher();
  }

  async get(
    baseUrl: string,
    authHeader: string,
    endpoint: string,
    queryParameters: QueryParameters = {},
  ) {
    const method = 'GET';
    const key = this.hasher.hash({ method, baseUrl, authHeader, endpoint, queryParameters });
    const cacheResult = this.cache[key];
    if (cacheResult) {
      return cacheResult;
    }

    const promise = this.request(method, baseUrl, authHeader, endpoint, queryParameters);
    this.cache[key] = promise;
    return promise;
  }

  async post(
    baseUrl: string,
    authHeader: string,
    endpoint: string,
    queryParameters: QueryParameters,
    body: RequestBody,
  ) {
    const method = 'POST';
    const key = this.hasher.hash({ method, baseUrl, authHeader, endpoint, queryParameters, body });
    const cacheResult = this.cache[key];
    if (cacheResult) {
      return cacheResult;
    }

    const promise = this.request(method, baseUrl, authHeader, endpoint, queryParameters, body);
    this.cache[key] = promise;
    return promise;
  }

  async put(
    baseUrl: string,
    authHeader: string,
    endpoint: string,
    queryParameters: QueryParameters,
    body: RequestBody,
  ) {
    const method = 'PUT';
    const key = this.hasher.hash({ method, baseUrl, authHeader, endpoint, queryParameters, body });
    const cacheResult = this.cache[key];
    if (cacheResult) {
      return cacheResult;
    }

    const promise = this.request(method, baseUrl, authHeader, endpoint, queryParameters, body);
    this.cache[key] = promise;
    return promise;
  }

  async delete(baseUrl: string, authHeader: string, endpoint: string) {
    const method = 'DELETE';
    const key = this.hasher.hash({ method, baseUrl, authHeader, endpoint });
    const cacheResult = this.cache[key];
    if (cacheResult) {
      return cacheResult;
    }

    const promise = this.request(method, baseUrl, authHeader, endpoint);
    this.cache[key] = promise;
    return promise;
  }
}

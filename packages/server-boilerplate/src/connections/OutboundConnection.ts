/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 *
 */
import { fetchWithTimeout, verifyResponseStatus, stringifyQuery } from '@tupaia/utils';
import { QueryParameters } from '../types';

type RequestBody = Record<string, unknown> | Record<string, unknown>[];

interface FetchHeaders {
  Authorization: string;
  'Content-Type'?: string;
}

interface FetchConfig {
  method: string;
  headers: FetchHeaders;
  body?: string;
}

export class OutboundConnection {
  async get(
    baseUrl: string,
    authHeader: string,
    endpoint: string,
    queryParameters: QueryParameters = {},
  ) {
    return this.request('GET', baseUrl, authHeader, endpoint, queryParameters);
  }

  async post(
    baseUrl: string,
    authHeader: string,
    endpoint: string,
    queryParameters: QueryParameters,
    body: RequestBody,
  ) {
    return this.request('POST', baseUrl, authHeader, endpoint, queryParameters, body);
  }

  async put(
    baseUrl: string,
    authHeader: string,
    endpoint: string,
    queryParameters: QueryParameters,
    body: RequestBody,
  ) {
    return this.request('PUT', baseUrl, authHeader, endpoint, queryParameters, body);
  }

  async delete(baseUrl: string, authHeader: string, endpoint: string) {
    return this.request('DELETE', baseUrl, authHeader, endpoint);
  }

  protected async request(
    requestMethod: string,
    baseUrl: string,
    authHeader: string,
    endpoint: string,
    queryParameters: QueryParameters = {},
    body?: RequestBody,
  ) {
    console.log(requestMethod, baseUrl, authHeader, endpoint, queryParameters, body);
    const queryUrl = stringifyQuery(baseUrl, endpoint, queryParameters);
    const fetchConfig: FetchConfig = {
      method: requestMethod || 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    };
    if (body) {
      fetchConfig.body = JSON.stringify(body);
    }

    const response = await fetchWithTimeout(queryUrl, fetchConfig);
    await verifyResponseStatus(response);
    return response.json();
  }
}

/*
 * Tupaia
 * Copyright (c) 2017 - 2020 Beyond Essential Systems Pty Ltd
 *
 */
import { QueryParameters } from '../types';
import { OutboundConnection } from './OutboundConnection';
import { AuthHandler } from './types';

type RequestBody = Record<string, unknown> | Record<string, unknown>[];

export class ApiConnection {
  public authHandler: AuthHandler;

  private readonly outboundConnection: OutboundConnection;

  public baseUrl!: string;

  constructor(authHandler: AuthHandler, outboundConnection = new OutboundConnection()) {
    this.authHandler = authHandler;
    this.outboundConnection = outboundConnection;
  }

  async get(endpoint: string, queryParameters: QueryParameters = {}) {
    return this.outboundConnection.get(
      this.baseUrl,
      await this.authHandler.getAuthHeader(),
      endpoint,
      queryParameters,
    );
  }

  async post(endpoint: string, queryParameters: QueryParameters, body: RequestBody) {
    return this.outboundConnection.post(
      this.baseUrl,
      await this.authHandler.getAuthHeader(),
      endpoint,
      queryParameters,
      body,
    );
  }

  async put(endpoint: string, queryParameters: QueryParameters, body: RequestBody) {
    return this.outboundConnection.put(
      this.baseUrl,
      await this.authHandler.getAuthHeader(),
      endpoint,
      queryParameters,
      body,
    );
  }

  async delete(endpoint: string) {
    return this.outboundConnection.delete(
      this.baseUrl,
      await this.authHandler.getAuthHeader(),
      endpoint,
    );
  }
}

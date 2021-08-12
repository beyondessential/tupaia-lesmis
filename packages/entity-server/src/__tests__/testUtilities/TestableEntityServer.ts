/**
 * Tupaia MediTrak
 * Copyright (c) 2017 Beyond Essential Systems Pty Ltd
 */
import * as dotenv from 'dotenv';

/**
 * Start the server
 */
import supertest, { Test } from 'supertest';

import { Express } from 'express';

import { Authenticator } from '@tupaia/auth';
import { getTestDatabase, TupaiaDatabase } from '@tupaia/database';

import { createApp } from '../../app';

dotenv.config(); // Load the environment variables into process.env

export const BES_ADMIN_PERMISSION_GROUP = 'BES Admin';
const DEFAULT_API_VERSION = 1;
const getVersionedEndpoint = (endpoint: string, apiVersion = DEFAULT_API_VERSION) =>
  `/v${apiVersion}/${endpoint}`;

export const getAuthorizationHeader = () => {
  const credentials = `${process.env.CLIENT_USERNAME}:${process.env.CLIENT_SECRET}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

type User = { username: string; password: string };
type RequestOptions = { headers?: Record<string, any>; query?: Record<string, any>; body?: any };

export class TestableEntityServer {
  public readonly database: TupaiaDatabase;

  private readonly app: Express;

  private user: User;

  // create test user
  // create fake entities and relations

  constructor(username: string, password: string) {
    this.app = createApp(getTestDatabase());
    this.user = { username, password };
  }

  public async grantFullAccess() {
    const policy = {
      DL: [BES_ADMIN_PERMISSION_GROUP],
    };
    return this.grantAccess(policy);
  }

  public async grantAccess(policy) {
    sinon.stub(Authenticator.prototype, 'getAccessPolicyForUser').resolves(policy);
    return this.authenticate();
  }

  public revokeAccess() {
    Authenticator.prototype.getAccessPolicyForUser.restore();
  }

  public async get(endpoint: string, options: RequestOptions, apiVersion = DEFAULT_API_VERSION) {
    const versionedEndpoint = getVersionedEndpoint(endpoint, apiVersion);
    return this.addOptionsToRequest(supertest(this.app).get(versionedEndpoint), options);
  }

  public post(endpoint: string, options: RequestOptions, apiVersion = DEFAULT_API_VERSION) {
    const versionedEndpoint = getVersionedEndpoint(endpoint, apiVersion);
    return this.addOptionsToRequest(supertest(this.app).post(versionedEndpoint), options);
  }

  public put(endpoint: string, options: RequestOptions, apiVersion = DEFAULT_API_VERSION) {
    const versionedEndpoint = getVersionedEndpoint(endpoint, apiVersion);
    return this.addOptionsToRequest(supertest(this.app).put(versionedEndpoint), options);
  }

  public delete(endpoint: string, options: RequestOptions, apiVersion = DEFAULT_API_VERSION) {
    const versionedEndpoint = getVersionedEndpoint(endpoint, apiVersion);
    return this.addOptionsToRequest(supertest(this.app).delete(versionedEndpoint), options);
  }

  private addOptionsToRequest(request: Test, options: RequestOptions = {}) {
    const { headers, query, body } = options;
    request.set(
      'Authorization',
      `Basic ${Buffer.from(`${this.user.username}:${this.user.password}`).toString('base64')}`,
    );

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => request.set(key, value));
    }

    if (query) {
      request.query(query);
    }

    if (body) {
      request.send(body);
    }
    return request;
  }
}
